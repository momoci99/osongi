#!/usr/bin/env node
/*
  H7′ 탐색: 장기 시차(0~60일) 강수 → 상위 등급 비율, 공판량 통제 (기획서 9-4 H7′)

  모든 시차에서 같은 평가일(09-05 이후)을 쓰고, 같은 날 공판량 편차를 통제한 편상관으로
  "비가 등급을 바꾸는가" 와 "비가 물량을 늘려 비율이 희석되는가" 를 구분한다.

  실행: npx tsx scripts/analysis/explore-grade-rain-long.ts
*/
import { WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import { median } from "../../src/utils/weather/seriesStats";
import { LAST_COMPLETE_YEAR, upperGradeShareSeries, windowIndexOf, yearRange } from "./lib/analysisData";
import {
  lagCombos,
  lagCorrelation,
  lagPartialCorrelation,
  LAG_WINDOWS,
  sweepLagCombos,
  type LagOptions,
  type LagTarget,
} from "./lib/lagSweep";
import { LOG_QUANTITY_TARGET, RAIN_FEATURE } from "./lib/rainLag";

const ALL_YEARS = yearRange(WEATHER_FIRST_YEAR, LAST_COMPLETE_YEAR);
const TRAIN_YEARS = yearRange(WEATHER_FIRST_YEAR, 2022);
const HOLDOUT_YEARS = yearRange(2023, 2025);
const MAX_LAG = 60;
const COMBOS = lagCombos(MAX_LAG);
const OPTIONS: LagOptions = { fromIndex: windowIndexOf("0905") };
/** 판정 기준 (기획서 9-4 H7′) */
const CRITERIA = { r: 0.3, alpha: 0.05, partialR: 0.2 };
const MIN_DAILY_QUANTITY_KG = 15;
/** 표에 표시할 시차 간격 */
const DISPLAY_STEP = 5;

const UPPER_GRADE_TARGET: LagTarget = {
  series: (union, year) => upperGradeShareSeries(union, year, MIN_DAILY_QUANTITY_KG),
  minYears: 3,
};
const QUANTITY_CONTROL = { target: LOG_QUANTITY_TARGET };

const fmt = (v: number | undefined | null, digits = 3) => (v === undefined || v === null ? "—" : v.toFixed(digits));

const main = () => {
  console.log(`# H7′ 장기 강수 → 상위 등급 비율 (시차 0~${MAX_LAG}일, 평가일 09-05~)\n`);
  const ranked = sweepLagCombos(RAIN_FEATURE, UPPER_GRADE_TARGET, TRAIN_YEARS, Math.abs, COMBOS, OPTIONS);

  const lags = Array.from({ length: MAX_LAG / DISPLAY_STEP + 1 }, (_, i) => i * DISPLAY_STEP);
  console.log("## 학습 구간 r / 공판량 통제 편상관 (창 7일)\n");
  console.log(`| | ${lags.map((n) => `N${n}`).join(" | ")} |`);
  console.log(`|---|${lags.map(() => "---").join("|")}|`);
  for (const window of LAG_WINDOWS) {
    const cells = lags.map((lag) => fmt(ranked.find((s) => s.window === window && s.lag === lag)?.train?.r, 2));
    console.log(`| r w${window} | ${cells.join(" | ")} |`);
  }
  const partialCells = lags.map((lag) =>
    fmt(lagPartialCorrelation(RAIN_FEATURE, UPPER_GRADE_TARGET, TRAIN_YEARS, TRAIN_YEARS, { window: 7, lag }, QUANTITY_CONTROL, OPTIONS)?.r, 2),
  );
  console.log(`| 편상관 w7 | ${partialCells.join(" | ")} |`);

  const best = ranked[0];
  const trainR = best.train?.r ?? 0;
  const holdout = lagCorrelation(RAIN_FEATURE, UPPER_GRADE_TARGET, TRAIN_YEARS, HOLDOUT_YEARS, best, OPTIONS);
  const partial = lagPartialCorrelation(RAIN_FEATURE, UPPER_GRADE_TARGET, TRAIN_YEARS, TRAIN_YEARS, best, QUANTITY_CONTROL, OPTIONS);
  const heldOut = ALL_YEARS.flatMap((year) => {
    const result = lagCorrelation(RAIN_FEATURE, UPPER_GRADE_TARGET, ALL_YEARS.filter((y) => y !== year), [year], best, OPTIONS);
    return result ? [result.r] : [];
  });
  const sign = Math.sign(trainR) || 1;
  const pass =
    Math.abs(trainR) >= CRITERIA.r &&
    holdout !== null &&
    Math.sign(holdout.r) === sign &&
    Math.abs(holdout.r) >= CRITERIA.r &&
    (best.train?.p ?? 1) < CRITERIA.alpha / COMBOS.length &&
    partial !== null &&
    Math.abs(partial.r) >= CRITERIA.partialR;

  console.log(`\n- 최강 |r|: w=${best.window}, N=${best.lag}, 학습 r ${fmt(trainR)} (n ${best.train?.n}, p×${COMBOS.length} ${Math.min(1, (best.train?.p ?? 1) * COMBOS.length).toExponential(1)})`);
  console.log(`- 홀드아웃 r ${fmt(holdout?.r)} (n ${holdout?.n})`);
  console.log(`- 공판량 통제 편상관 (학습) ${fmt(partial?.r)}`);
  console.log(`- 연도 하나씩 빼고 검증 (조합 고정): 중앙값 ${fmt(median(heldOut))}, 같은 부호 ${heldOut.filter((r) => Math.sign(r) === sign).length}/${heldOut.length}`);
  console.log(`\n## 판정: ${pass ? "✅ 통과" : "❌ 미통과"}`);
};

main();
