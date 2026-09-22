#!/usr/bin/env node
/*
  H1 보강 진단: 연도 하나씩 빼고 검증 (leave-one-year-out)

  완료 시즌마다 그 해를 빼고 나머지로 평년값·최적 (창, 시차)를 정한 뒤, 뺀 해에서 상관을 잰다.
  3시즌짜리 홀드아웃보다 안정적인 재현성 추정용이며, 9-1 판정 기준을 바꾸지 않는다.

  실행: npx tsx scripts/analysis/explore-rain-lag-loyo.ts
*/
import { WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import { median } from "../../src/utils/weather/seriesStats";
import { LAST_COMPLETE_YEAR, yearRange } from "./lib/analysisData";
import { bestRainLagCombo, rainLagCorrelation } from "./lib/rainLag";

const YEARS = yearRange(WEATHER_FIRST_YEAR, LAST_COMPLETE_YEAR);
/** 비교용 고정 조합 — 9-1 학습 구간 최적값 */
const REFERENCE = { window: 7, lag: 22 };
const R_THRESHOLD = 0.3;

const fmt = (v: number | undefined, digits = 3) => (v === undefined ? "—" : v.toFixed(digits));

const main = () => {
  console.log(`# H1 연도 하나씩 빼고 검증 — ${YEARS[0]}~${YEARS.at(-1)}\n`);
  console.log("| 검증 연도 | 선택 w | 선택 N | 학습 r | 검증 r | 검증 n | 고정(7,22) 검증 r |");
  console.log("|---|---|---|---|---|---|---|");

  const heldOut: number[] = [];
  const fixed: number[] = [];
  for (const year of YEARS) {
    const trainYears = YEARS.filter((y) => y !== year);
    const [best] = bestRainLagCombo(trainYears);
    const test = rainLagCorrelation(trainYears, [year], best);
    const reference = rainLagCorrelation(trainYears, [year], REFERENCE);
    if (test) heldOut.push(test.r);
    if (reference) fixed.push(reference.r);
    console.log(`| ${year} | ${best.window} | ${best.lag} | ${fmt(best.train?.r)} | ${fmt(test?.r)} | ${test?.n ?? 0} | ${fmt(reference?.r)} |`);
  }

  const summarize = (label: string, values: number[]) =>
    console.log(
      `- ${label}: 중앙값 ${fmt(median(values) ?? undefined)}, 평균 ${fmt(values.reduce((a, b) => a + b, 0) / values.length)}, ` +
        `양수 ${values.filter((r) => r > 0).length}/${values.length}, ≥${R_THRESHOLD} ${values.filter((r) => r >= R_THRESHOLD).length}/${values.length}`,
    );
  console.log("\n## 요약\n");
  summarize("검증 r (매번 재선택)", heldOut);
  summarize("검증 r (고정 7일·22일)", fixed);
};

main();
