#!/usr/bin/env node
/*
  H6 탐색: 수확기 비·습도가 많으면 상위 등급 비율이 떨어지는가 (기획서 9-3)

  조합 × 공판일 단위로 상위 등급 비율 편차와 강수·습도 편차의 상관을 (변수, 창 w, 시차 N) 별로 스윕한다.

  실행: npx tsx scripts/analysis/explore-grade-weather.ts
*/
import { UNION_WEATHER_STATION, WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import {
  anomaly,
  climatology,
  correlationPValue,
  laggedWindowSum,
  median,
  pearson,
  type Series,
} from "../../src/utils/weather/seriesStats";
import { LAST_COMPLETE_YEAR, rainSeries, upperGradeShareSeries, weatherSeries, yearRange } from "./lib/analysisData";

const ALL_YEARS = yearRange(WEATHER_FIRST_YEAR, LAST_COMPLETE_YEAR);
const TRAIN_YEARS = yearRange(WEATHER_FIRST_YEAR, 2022);
const HOLDOUT_YEARS = yearRange(2023, 2025);
const MIN_DAILY_QUANTITY_KG = 15;
const MIN_GRADE_YEARS = 3;
/** 판정 기준 (기획서 9-3) — 음의 상관 */
const CRITERIA = { r: -0.3, alpha: 0.05 };

type Variable = "rain" | "humidity";
type Combo = { variable: Variable; window: number; lag: number };

const COMBOS: Combo[] = (["rain", "humidity"] as const).flatMap((variable) =>
  [1, 2, 3].flatMap((window) => [0, 1, 2].map((lag) => ({ variable, window, lag }))),
);

/** 강수는 창 누적, 습도는 창 평균 */
const feature = (stationId: number, year: number, { variable, window, lag }: Combo): Series => {
  const source = variable === "rain" ? rainSeries(stationId, year) : weatherSeries(stationId, year, "avgRhm");
  const sums = laggedWindowSum(source, window, lag);
  return variable === "rain" ? sums : sums.map((v) => (v === null ? null : v / window));
};

const correlate = (trainYears: number[], years: number[], combo: Combo) => {
  const xs: Series = [];
  const ys: Series = [];
  for (const [union, { stationId }] of Object.entries(UNION_WEATHER_STATION)) {
    const share = (y: number) => upperGradeShareSeries(union, y, MIN_DAILY_QUANTITY_KG);
    const shareNormal = climatology(trainYears.map(share), MIN_GRADE_YEARS);
    const featureNormal = climatology(trainYears.map((y) => feature(stationId, y, combo)));
    for (const y of years) {
      xs.push(...anomaly(feature(stationId, y, combo), featureNormal));
      ys.push(...anomaly(share(y), shareNormal));
    }
  }
  const result = pearson(xs, ys);
  return result ? { ...result, p: correlationPValue(result.r, result.n) } : null;
};

const fmt = (v: number | undefined | null, digits = 3) => (v === undefined || v === null ? "—" : v.toFixed(digits));
const label = (c: Combo) => `${c.variable === "rain" ? "강수" : "습도"} w${c.window} N${c.lag}`;

const main = () => {
  console.log(`# H6 상위 등급 비율 vs 강수·습도 — 학습 ${TRAIN_YEARS[0]}~${TRAIN_YEARS.at(-1)}, 홀드아웃 ${HOLDOUT_YEARS[0]}~${HOLDOUT_YEARS.at(-1)}\n`);
  console.log("| 설명변수 | 학습 r | 학습 n | 학습 p×18 | 홀드아웃 r | 홀드아웃 n |");
  console.log("|---|---|---|---|---|---|");

  const rows = COMBOS.map((combo) => ({ combo, train: correlate(TRAIN_YEARS, TRAIN_YEARS, combo), holdout: correlate(TRAIN_YEARS, HOLDOUT_YEARS, combo) }));
  for (const { combo, train, holdout } of rows) {
    console.log(`| ${label(combo)} | ${fmt(train?.r)} | ${train?.n} | ${Math.min(1, (train?.p ?? 1) * COMBOS.length).toExponential(1)} | ${fmt(holdout?.r)} | ${holdout?.n} |`);
  }

  const best = [...rows].sort((a, b) => (a.train?.r ?? 1) - (b.train?.r ?? 1))[0];
  const pass =
    (best.train?.r ?? 0) <= CRITERIA.r &&
    (best.holdout?.r ?? 0) <= CRITERIA.r &&
    (best.train?.p ?? 1) < CRITERIA.alpha / COMBOS.length;
  console.log(`\n## 판정: ${pass ? "✅ 통과" : "❌ 미통과"} (최강 음의 상관: ${label(best.combo)}, 학습 r ${fmt(best.train?.r)})\n`);

  console.log("## 보강: 연도 하나씩 빼고 검증 (최강 조합 고정)\n");
  const heldOut = ALL_YEARS.flatMap((year) => {
    const result = correlate(ALL_YEARS.filter((y) => y !== year), [year], best.combo);
    return result ? [result.r] : [];
  });
  console.log(`- 검증 r 중앙값 ${fmt(median(heldOut))}, 음수 ${heldOut.filter((r) => r < 0).length}/${heldOut.length}, ≤${CRITERIA.r} ${heldOut.filter((r) => r <= CRITERIA.r).length}/${heldOut.length}`);
};

main();
