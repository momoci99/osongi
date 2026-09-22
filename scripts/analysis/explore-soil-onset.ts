#!/usr/bin/env node
/*
  H5 탐색: 지온이 임계 이하로 내려간 뒤 공판이 본격화되는가 (기획서 9-2)

  지중온도 관측 조합(강릉·포항·청송)에서 시즌별 지온 통과일과 누적 10% 도달일을 비교한다.
  비교군으로 평균기온·지면온도 통과일도 같은 절차로 계산한다.

  실행: npx tsx scripts/analysis/explore-soil-onset.ts
*/
import { UNION_WEATHER_STATION, WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import {
  correlationPValue,
  firstIndexAtOrBelow,
  median,
  movingAverage,
  pearson,
} from "../../src/utils/weather/seriesStats";
import {
  auctionQuantitySeries,
  LAST_COMPLETE_YEAR,
  weatherSeries,
  windowDates,
  windowIndexOf,
  yearRange,
} from "./lib/analysisData";

const UNIONS = ["강릉", "포항", "청송"];
const YEARS = yearRange(WEATHER_FIRST_YEAR, LAST_COMPLETE_YEAR);
const FROM_INDEX = windowIndexOf("0801");
const THRESHOLDS_C = [18, 19, 20];
const ONSET_SHARE = 0.1;
/** 판정 기준 (기획서 9-2) */
const CRITERIA = { r: 0.5, alpha: 0.05 };

/** 온도 지표와 5cm 지온 대비 공통 오프셋 (기획서 4-4 결과) */
const INDICATORS = [
  { label: "5cm 지중온도", field: "avgCm5Te", offset: 0 },
  { label: "평균기온", field: "avgTa", offset: -2.02 },
  { label: "지면온도", field: "avgTs", offset: 0.59 },
] as const;

type Season = { union: string; year: number; crossing: number; p10: number; first: number };

/** 누적 공판량이 총량의 share 에 도달한 인덱스 */
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

const collectSeasons = (field: string, threshold: number): Season[] =>
  UNIONS.flatMap((union) => {
    const { stationId } = UNION_WEATHER_STATION[union];
    return YEARS.flatMap((year) => {
      const quantities = auctionQuantitySeries(union, year);
      const p10 = cumulativeShareIndex(quantities, ONSET_SHARE);
      const first = quantities.findIndex((q) => q !== null);
      const smoothed = movingAverage(weatherSeries(stationId, year, field as "avgTa"));
      const crossing = firstIndexAtOrBelow(smoothed, threshold, FROM_INDEX);
      return p10 === null || crossing === null ? [] : [{ union, year, crossing, p10, first }];
    });
  });

/** 조합별 평균을 뺀 값 */
const centerByUnion = (seasons: Season[], pick: (s: Season) => number): number[] => {
  const means = new Map(
    UNIONS.map((u) => {
      const values = seasons.filter((s) => s.union === u).map(pick);
      return [u, values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)];
    }),
  );
  return seasons.map((s) => pick(s) - (means.get(s.union) ?? 0));
};

/** 연도 하나씩 빼고 P10 예측 오차 — 지온+시차 예측 vs 조합 평균(기후값) 예측 */
const leaveOneYearOutErrors = (seasons: Season[]) => {
  const model: number[] = [];
  const baseline: number[] = [];
  for (const season of seasons) {
    const others = seasons.filter((s) => s.year !== season.year);
    const lag = median(others.map((s) => s.p10 - s.crossing));
    const unionOthers = others.filter((s) => s.union === season.union).map((s) => s.p10);
    if (lag === null || unionOthers.length === 0) continue;
    model.push(Math.abs(season.crossing + lag - season.p10));
    baseline.push(Math.abs(unionOthers.reduce((a, b) => a + b, 0) / unionOthers.length - season.p10));
  }
  return { model: median(model), baseline: median(baseline), n: model.length };
};

const fmt = (v: number | null | undefined, digits = 2) => (v === null || v === undefined ? "—" : v.toFixed(digits));
const dateOf = (index: number) => windowDates(2001)[index].slice(5);

const main = () => {
  console.log(`# H5 지온 통과일 vs 공판 개시 — ${UNIONS.join("·")}, ${YEARS[0]}~${YEARS.at(-1)}\n`);
  console.log("| 지표 | T | n | r(C, P10) | p | r(C, 첫공판) | 시차 P10−C 중앙값 | LOYO 오차 중앙값 (지표 / 기후값) | 판정 |");
  console.log("|---|---|---|---|---|---|---|---|---|");

  for (const indicator of INDICATORS) {
    for (const t of THRESHOLDS_C) {
      const seasons = collectSeasons(indicator.field, t + indicator.offset);
      const c = centerByUnion(seasons, (s) => s.crossing);
      const onset = pearson(c, centerByUnion(seasons, (s) => s.p10));
      const first = pearson(c, centerByUnion(seasons, (s) => s.first));
      const p = onset ? correlationPValue(onset.r, onset.n) : null;
      const errors = leaveOneYearOutErrors(seasons);
      const lag = median(seasons.map((s) => s.p10 - s.crossing));
      const pass =
        (onset?.r ?? 0) >= CRITERIA.r &&
        (p ?? 1) < CRITERIA.alpha &&
        errors.model !== null &&
        errors.baseline !== null &&
        errors.model < errors.baseline;
      console.log(
        `| ${indicator.label} | ${t} | ${seasons.length} | ${fmt(onset?.r)} | ${fmt(p, 3)} | ${fmt(first?.r)} | ${fmt(lag, 0)}일 | ${fmt(errors.model, 1)} / ${fmt(errors.baseline, 1)}일 | ${pass ? "✅" : "❌"} |`,
      );
    }
  }

  console.log("\n## 참고: 시즌별 (5cm 지중온도 19°C)\n");
  console.log("| 조합 | 연도 | 지온 통과 | 첫 공판 | 누적 10% |");
  console.log("|---|---|---|---|---|");
  for (const s of collectSeasons("avgCm5Te", 19)) {
    console.log(`| ${s.union} | ${s.year} | ${dateOf(s.crossing)} | ${dateOf(s.first)} | ${dateOf(s.p10)} |`);
  }
};

main();
