#!/usr/bin/env node
/*
  H7·H8 탐색 (기획서 9-4)
  - H7: 생육기 강수(시차 0~30일)가 상위 등급 비율을 바꾸는가
  - H8: 습도가 공판량을 바꾸는가 — 강수(7일·22일) 통제 편상관 포함

  실행: npx tsx scripts/analysis/explore-lag-hypotheses.ts
*/
import { WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import { median } from "../../src/utils/weather/seriesStats";
import { LAST_COMPLETE_YEAR, upperGradeShareSeries, weatherSeries, yearRange } from "./lib/analysisData";
import {
  ALL_LAG_COMBOS,
  lagCorrelation,
  lagPartialCorrelation,
  LAG_WINDOWS,
  MAX_LAG,
  sweepLagCombos,
  type LagFeature,
  type LagTarget,
} from "./lib/lagSweep";
import { LOG_QUANTITY_TARGET, RAIN_FEATURE } from "./lib/rainLag";

const ALL_YEARS = yearRange(WEATHER_FIRST_YEAR, LAST_COMPLETE_YEAR);
const TRAIN_YEARS = yearRange(WEATHER_FIRST_YEAR, 2022);
const HOLDOUT_YEARS = yearRange(2023, 2025);
const TEST_COUNT = ALL_LAG_COMBOS.length;
/** 판정 기준 (기획서 9-4) */
const CRITERIA = { r: 0.3, alpha: 0.05, partialR: 0.2 };
/** H1 최적 조합 — H8 통제 변수 */
const RAIN_CONTROL = { feature: RAIN_FEATURE, combo: { window: 7, lag: 22 } };
/** 상위 등급 비율 산출 최소 일 공판량 (9-3) */
const MIN_DAILY_QUANTITY_KG = 15;

const HUMIDITY_FEATURE: LagFeature = {
  source: (stationId, year) => weatherSeries(stationId, year, "avgRhm"),
  aggregate: "mean",
};

const UPPER_GRADE_TARGET: LagTarget = {
  series: (union, year) => upperGradeShareSeries(union, year, MIN_DAILY_QUANTITY_KG),
  minYears: 3,
};

const fmt = (v: number | undefined | null, digits = 3) => (v === undefined || v === null ? "—" : v.toFixed(digits));

const analyze = (title: string, feature: LagFeature, target: LagTarget, withPartial: boolean) => {
  console.log(`# ${title}\n`);
  const ranked = sweepLagCombos(feature, target, TRAIN_YEARS, Math.abs);

  console.log("## 학습 구간 시차별 r (행: 창 w, 열: 시차 N)\n");
  console.log(`| w \\ N | ${Array.from({ length: MAX_LAG + 1 }, (_, n) => n).join(" | ")} |`);
  console.log(`|---|${Array(MAX_LAG + 1).fill("---").join("|")}|`);
  for (const window of LAG_WINDOWS) {
    const cells = ranked
      .filter((s) => s.window === window)
      .sort((a, b) => a.lag - b.lag)
      .map((s) => fmt(s.train?.r, 2));
    console.log(`| ${window} | ${cells.join(" | ")} |`);
  }

  const best = ranked[0];
  const holdout = lagCorrelation(feature, target, TRAIN_YEARS, HOLDOUT_YEARS, best);
  const trainR = best.train?.r ?? 0;
  const sameSignStrong = holdout !== null && Math.sign(holdout.r) === Math.sign(trainR) && Math.abs(holdout.r) >= CRITERIA.r;
  const partial = withPartial ? lagPartialCorrelation(feature, target, TRAIN_YEARS, TRAIN_YEARS, best, RAIN_CONTROL) : null;
  const pass =
    Math.abs(trainR) >= CRITERIA.r &&
    sameSignStrong &&
    (best.train?.p ?? 1) < CRITERIA.alpha / TEST_COUNT &&
    (!withPartial || (partial !== null && Math.abs(partial.r) >= CRITERIA.partialR));

  console.log(`\n- 최강 |r|: w=${best.window}, N=${best.lag}, 학습 r ${fmt(trainR)} (n ${best.train?.n}, p×${TEST_COUNT} ${Math.min(1, (best.train?.p ?? 1) * TEST_COUNT).toExponential(1)})`);
  console.log(`- 홀드아웃 r ${fmt(holdout?.r)} (n ${holdout?.n})`);
  if (withPartial) console.log(`- 강수(7일·22일) 통제 편상관 (학습) ${fmt(partial?.r)}`);

  const heldOut = ALL_YEARS.flatMap((year) => {
    const result = lagCorrelation(feature, target, ALL_YEARS.filter((y) => y !== year), [year], best);
    return result ? [result.r] : [];
  });
  const sign = Math.sign(trainR) || 1;
  console.log(
    `- 연도 하나씩 빼고 검증 (조합 고정): 중앙값 ${fmt(median(heldOut))}, 같은 부호 ${heldOut.filter((r) => Math.sign(r) === sign).length}/${heldOut.length}, |r|≥${CRITERIA.r} ${heldOut.filter((r) => Math.abs(r) >= CRITERIA.r && Math.sign(r) === sign).length}/${heldOut.length}`,
  );
  console.log(`\n## 판정: ${pass ? "✅ 통과" : "❌ 미통과"}\n`);
};

analyze("H7 생육기 강수 → 상위 등급 비율", RAIN_FEATURE, UPPER_GRADE_TARGET, false);
analyze("H8 습도 → 공판량", HUMIDITY_FEATURE, LOG_QUANTITY_TARGET, true);
