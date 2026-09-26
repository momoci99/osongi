#!/usr/bin/env node
/*
  H5′ 독립 검증 (기획서 9-6): 관측소 5cm 지온 22°C 통과일 ≈ 공판 본격화(누계 10%) 일인가.

  22°C 는 2013~2025 에서 유도한 값이라 2008~2012 로만 확인한다.
  비교 예측은 2013~2025 조합별 P10 평균 날짜(기후값).

  실행: npx tsx scripts/analysis/verify-legacy-h5.ts
*/
import { UNION_WEATHER_STATION, WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import { firstIndexAtOrBelow, median, movingAverage, pearson } from "../../src/utils/weather/seriesStats";
import {
  auctionQuantitySeries,
  LAST_COMPLETE_YEAR,
  weatherSeries,
  windowDates,
  windowIndexOf,
  yearRange,
} from "./lib/analysisData";
import { LEGACY_YEARS, legacyCumulative, maskIfSparse, windowIndexOfDate } from "./lib/legacyAuction";

const UNIONS = ["강릉", "포항", "청송"];
const NORMAL_YEARS = yearRange(WEATHER_FIRST_YEAR, LAST_COMPLETE_YEAR);
const FROM_INDEX = windowIndexOf("0801");
const TO_INDEX = windowIndexOf("1031");
const ONSET_SHARE = 0.1;
const THRESHOLD_C = 22;
const SENSITIVITY_C = [21, 23];
/** 2013~2025 누계 10% 도달일 지온 사분위 (기획서 9-2 사후 탐색) */
const REFERENCE_BAND_C = [19.9, 22.4];
/** 판정 기준 (기획서 9-6) */
const CRITERIA = { minSamples: 8, maxMedianBiasDays: 5 };

type Season = { union: string; year: number; crossing: number; p10: number; climatology: number; soilAtP10: number | null };

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const dateOf = (index: number) => windowDates(2001)[index]?.slice(5) ?? "—";
const fmt = (v: number | null | undefined, digits = 1) => (v === null || v === undefined ? "—" : v.toFixed(digits));

/** 누적 공판량이 총량의 share 에 도달한 인덱스 (explore-soil-onset 과 동일) */
const cumulativeShareIndex = (quantities: (number | null)[], share: number): number | null => {
  const total = quantities.reduce<number>((sum, q) => sum + (q ?? 0), 0);
  if (total === 0) return null;
  let cumulative = 0;
  for (let i = 0; i < quantities.length; i++) {
    cumulative += quantities[i] ?? 0;
    if (cumulative >= total * share) return i;
  }
  return null;
};

/** 2013~2025 조합별 P10 평균 인덱스 */
const climatologyP10 = (union: string): number => {
  const indices = NORMAL_YEARS.map((y) => cumulativeShareIndex(auctionQuantitySeries(union, y), ONSET_SHARE)).filter(
    (i): i is number => i !== null,
  );
  return mean(indices);
};

/** 옛 자료 누계로 P10. 제외 사유가 있으면 문자열 */
const legacyP10 = (union: string, year: number): number | string => {
  const flow = legacyCumulative(union, year);
  if (!flow || flow.finalTotal === 0) return "시즌 누계 0";
  if (flow.firstUntilYesterday >= flow.finalTotal * ONSET_SHARE) return "게시판이 개시 뒤 시작";
  const point = flow.points.find((p) => p.total >= flow.finalTotal * ONSET_SHARE);
  return point ? windowIndexOfDate(point.date) : "P10 없음";
};

const soilSeries = (union: string, year: number) =>
  movingAverage(maskIfSparse(weatherSeries(UNION_WEATHER_STATION[union].stationId, year, "avgCm5Te"), FROM_INDEX, TO_INDEX));

const collect = (threshold: number) => {
  const seasons: Season[] = [];
  const excluded: string[] = [];
  for (const union of UNIONS) {
    const climatology = climatologyP10(union);
    for (const year of LEGACY_YEARS) {
      const soil = soilSeries(union, year);
      const crossing = firstIndexAtOrBelow(soil, threshold, FROM_INDEX);
      const p10 = legacyP10(union, year);
      if (typeof p10 === "string") excluded.push(`${union} ${year}: ${p10}`);
      else if (crossing === null) excluded.push(`${union} ${year}: 지온 결측·통과 없음`);
      else seasons.push({ union, year, crossing, p10, climatology, soilAtP10: soil[p10] });
    }
  }
  return { seasons, excluded };
};

const evaluate = (seasons: Season[]) => {
  const bias = median(seasons.map((s) => s.p10 - s.crossing));
  const maeModel = mean(seasons.map((s) => Math.abs(s.p10 - s.crossing)));
  const maeClimate = mean(seasons.map((s) => Math.abs(s.p10 - s.climatology)));
  return { bias, maeModel, maeClimate };
};

const main = () => {
  console.log(`# H5′ 독립 검증 — 5cm 지온 ${THRESHOLD_C}°C 통과일 vs 누계 10% 도달일, 2008~2012\n`);
  const { seasons, excluded } = collect(THRESHOLD_C);

  console.log("| 조합 | 시즌 | 지온 통과 C22 | 누계 10% P10 | P10−C22 | 기후값 | P10 당일 지온 |");
  console.log("|---|---|---|---|---|---|---|");
  for (const s of seasons) {
    console.log(
      `| ${s.union} | ${s.year} | ${dateOf(s.crossing)} | ${dateOf(s.p10)} | ${s.p10 - s.crossing} | ${dateOf(Math.round(s.climatology))} | ${fmt(s.soilAtP10)} |`,
    );
  }
  console.log(`\n제외: ${excluded.join(" / ") || "없음"}\n`);

  const { bias, maeModel, maeClimate } = evaluate(seasons);
  const enough = seasons.length >= CRITERIA.minSamples;
  const pass = enough && bias !== null && Math.abs(bias) <= CRITERIA.maxMedianBiasDays && maeModel < maeClimate;
  console.log("| 항목 | 값 | 기준 |\n|---|---|---|");
  console.log(`| 표본 | ${seasons.length} | ≥ ${CRITERIA.minSamples} |`);
  console.log(`| (P10 − C22) 중앙값 | ${fmt(bias, 1)}일 | \\|·\\| ≤ ${CRITERIA.maxMedianBiasDays}일 |`);
  console.log(`| 평균 절대오차 C22 / 기후값 | ${fmt(maeModel)} / ${fmt(maeClimate)}일 | C22 < 기후값 |`);
  console.log(`\n## 판정: ${!enough ? "⏸ 판정 보류 (표본 부족)" : pass ? "✅ 통과" : "❌ 미통과"}\n`);

  console.log("## 참고 (판정 아님)\n");
  const inBand = seasons.filter((s) => s.soilAtP10 !== null && s.soilAtP10 >= REFERENCE_BAND_C[0] && s.soilAtP10 <= REFERENCE_BAND_C[1]);
  console.log(`- P10 당일 지온이 ${REFERENCE_BAND_C[0]}~${REFERENCE_BAND_C[1]}°C 안: ${inBand.length}/${seasons.length}`);
  for (const threshold of SENSITIVITY_C) {
    const result = collect(threshold);
    const e = evaluate(result.seasons);
    console.log(`- ${threshold}°C: n=${result.seasons.length}, 중앙값 ${fmt(e.bias)}일, 오차 ${fmt(e.maeModel)} / 기후값 ${fmt(e.maeClimate)}일`);
  }
  const r = pearson(seasons.map((s) => s.crossing), seasons.map((s) => s.p10));
  console.log(`- 상관 r(C22, P10): ${fmt(r?.r, 2)} (n=${r?.n ?? 0})`);
};

main();
