#!/usr/bin/env node
/*
  H1 탐색: 강수 후 N일 뒤 공판량이 늘어나는가 (기획서 9-1)

  조합 × 공판일 단위로 log 공판량 편차와 시차 누적 강수 편차의 상관을 (창 w, 시차 N) 별로 스윕한다.
  평년값은 학습 연도로만 계산해 홀드아웃에 새지 않게 한다.

  실행: npx tsx scripts/analysis/explore-rain-lag.ts
*/
import { UNION_WEATHER_STATION, WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import { yearRange } from "./lib/analysisData";
import { ALL_RAIN_LAG_COMBOS, bestRainLagCombo, MAX_RAIN_LAG, RAIN_WINDOWS, rainLagCorrelation } from "./lib/rainLag";

const TRAIN_YEARS = yearRange(WEATHER_FIRST_YEAR, 2022);
const HOLDOUT_YEARS = yearRange(2023, 2025);
/** 판정 기준 (기획서 9-1) */
const CRITERIA = { r: 0.3, alpha: 0.05 };
const TEST_COUNT = ALL_RAIN_LAG_COMBOS.length;

const fmt = (v: number | undefined, digits = 3) => (v === undefined ? "—" : v.toFixed(digits));

const main = () => {
  console.log(`# H1 강수 시차 스윕 — 학습 ${TRAIN_YEARS[0]}~${TRAIN_YEARS.at(-1)}, 홀드아웃 ${HOLDOUT_YEARS[0]}~${HOLDOUT_YEARS.at(-1)}\n`);

  const ranked = bestRainLagCombo(TRAIN_YEARS);

  console.log("## 학습 구간 시차별 r (행: 창 w, 열: 시차 N)\n");
  console.log(`| w \\ N | ${Array.from({ length: MAX_RAIN_LAG + 1 }, (_, n) => n).join(" | ")} |`);
  console.log(`|---|${Array(MAX_RAIN_LAG + 1).fill("---").join("|")}|`);
  for (const window of RAIN_WINDOWS) {
    const cells = ranked
      .filter((s) => s.window === window)
      .sort((a, b) => a.lag - b.lag)
      .map((s) => fmt(s.train?.r, 2));
    console.log(`| ${window} | ${cells.join(" | ")} |`);
  }

  console.log("\n## 학습 상위 5 → 홀드아웃 재현\n");
  console.log(`| w | N | 학습 r | 학습 n | 학습 p×${TEST_COUNT} | 홀드아웃 r | 홀드아웃 n |`);
  console.log("|---|---|---|---|---|---|---|");
  for (const s of ranked.slice(0, 5)) {
    const holdout = rainLagCorrelation(TRAIN_YEARS, HOLDOUT_YEARS, s);
    console.log(`| ${s.window} | ${s.lag} | ${fmt(s.train?.r)} | ${s.train?.n} | ${Math.min(1, (s.train?.p ?? 1) * TEST_COUNT).toExponential(1)} | ${fmt(holdout?.r)} | ${holdout?.n} |`);
  }

  const best = ranked[0];
  const holdout = rainLagCorrelation(TRAIN_YEARS, HOLDOUT_YEARS, best);
  const pass =
    (best.train?.r ?? 0) >= CRITERIA.r &&
    (holdout?.r ?? 0) >= CRITERIA.r &&
    (best.train?.p ?? 1) < CRITERIA.alpha / TEST_COUNT;
  console.log(`\n## 판정: ${pass ? "✅ 통과" : "❌ 미통과"} (최적 w=${best.window}, N=${best.lag})\n`);

  console.log("## 참고: 조합별 r (최적 조합, 전 기간)\n");
  console.log("| 조합 | r | n |");
  console.log("|---|---|---|");
  const allYears = [...TRAIN_YEARS, ...HOLDOUT_YEARS];
  for (const union of Object.keys(UNION_WEATHER_STATION)) {
    const result = rainLagCorrelation(TRAIN_YEARS, allYears, best, [union]);
    console.log(`| ${union} | ${fmt(result?.r, 2)} | ${result?.n ?? 0} |`);
  }
};

main();
