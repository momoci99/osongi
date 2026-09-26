#!/usr/bin/env node
/*
  H1 독립 검증 (기획서 9-6): 2008~2012 에서 "7일 누적 강수 → 22일 뒤 공판량" 이 재현되는가.

  (창 7, 시차 22) 고정 — 새로 스윕해서 최적값을 고르지 않는다. 평년값은 2013~2025 로 계산해 적용한다.

  실행: npx tsx scripts/analysis/verify-legacy-h1.ts
*/
import { UNION_WEATHER_STATION, WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import {
  anomaly,
  climatology,
  correlationPValue,
  laggedWindowSum,
  pearson,
  type Series,
} from "../../src/utils/weather/seriesStats";
import { LAST_COMPLETE_YEAR, rainSeries, yearRange } from "./lib/analysisData";
import { lagCombos, lagCorrelation, type LagCombo, type LagFeature } from "./lib/lagSweep";
import { LEGACY_YEARS, maskIfSparse } from "./lib/legacyAuction";
import { LOG_QUANTITY_TARGET } from "./lib/rainLag";

const NORMAL_YEARS = yearRange(WEATHER_FIRST_YEAR, LAST_COMPLETE_YEAR);
const FIXED: LagCombo = { window: 7, lag: 22 };
/** 판정 기준 (기획서 9-6) */
const CRITERIA = { r: 0.3, alpha: 0.05, positiveSeasons: 4 };

/** 수집 창 결측이 20% 넘는 지점·연도는 통째로 제외 */
const COVERED_RAIN: LagFeature = {
  source: (stationId, year) => maskIfSparse(rainSeries(stationId, year)),
  aggregate: "sum",
};

const fmt = (v: number | undefined | null, digits = 3) => (v === undefined || v === null ? "—" : v.toFixed(digits));

const correlate = (years: number[], combo: LagCombo, normalYears = NORMAL_YEARS, unions?: string[]) =>
  lagCorrelation(COVERED_RAIN, LOG_QUANTITY_TARGET, normalYears, years, combo, { unions });

/** 시즌 내 진단: 조합·시즌마다 두 편차의 평균을 빼고 합산 상관 (연도 효과 제거) */
const withinSeasonCorrelation = (combo: LagCombo) => {
  const xs: Series = [];
  const ys: Series = [];
  for (const [union, { stationId }] of Object.entries(UNION_WEATHER_STATION)) {
    const windowed = (y: number) => laggedWindowSum(COVERED_RAIN.source(stationId, y), combo.window, combo.lag);
    const featureNormal = climatology(NORMAL_YEARS.map(windowed));
    const targetNormal = climatology(NORMAL_YEARS.map((y) => LOG_QUANTITY_TARGET.series(union, y)), LOG_QUANTITY_TARGET.minYears);
    for (const year of LEGACY_YEARS) {
      const x = anomaly(windowed(year), featureNormal);
      const y = anomaly(LOG_QUANTITY_TARGET.series(union, year), targetNormal);
      const paired = x.map((v, i) => (v !== null && y[i] !== null ? i : -1)).filter((i) => i >= 0);
      if (paired.length < 2) continue;
      const mean = (s: Series) => paired.reduce((acc, i) => acc + (s[i] as number), 0) / paired.length;
      const mx = mean(x);
      const my = mean(y);
      for (const i of paired) {
        xs.push((x[i] as number) - mx);
        ys.push((y[i] as number) - my);
      }
    }
  }
  return pearson(xs, ys);
};

const main = () => {
  console.log(`# H1 독립 검증 — 2008~2012, 창 ${FIXED.window}일 · 시차 ${FIXED.lag}일 고정, 평년 ${NORMAL_YEARS[0]}~${NORMAL_YEARS.at(-1)}\n`);

  const pooled = correlate(LEGACY_YEARS, FIXED);
  const seasons = LEGACY_YEARS.map((year) => ({ year, result: correlate([year], FIXED) }));
  const positive = seasons.filter((s) => (s.result?.r ?? 0) > 0).length;

  console.log("## 판정 대상\n");
  console.log(`| 항목 | 값 | 기준 |`);
  console.log(`|---|---|---|`);
  console.log(`| 합산 r (n=${pooled?.n ?? 0}) | ${fmt(pooled?.r)} | ≥ ${CRITERIA.r} |`);
  console.log(`| p | ${pooled ? pooled.p.toExponential(1) : "—"} | < ${CRITERIA.alpha} |`);
  console.log(`| 양수 시즌 | ${positive}/${LEGACY_YEARS.length} | ≥ ${CRITERIA.positiveSeasons} |`);
  console.log("\n| 시즌 | r | n |\n|---|---|---|");
  for (const { year, result } of seasons) console.log(`| ${year} | ${fmt(result?.r)} | ${result?.n ?? 0} |`);

  const pass =
    (pooled?.r ?? 0) >= CRITERIA.r && (pooled?.p ?? 1) < CRITERIA.alpha && positive >= CRITERIA.positiveSeasons;
  console.log(`\n## 판정: ${pass ? "✅ 통과 (독립 재현)" : "❌ 미통과"}\n`);

  console.log("## 참고 (판정 아님)\n");
  const sweep = lagCombos().map((combo) => ({ ...combo, result: correlate(LEGACY_YEARS, combo) }));
  const top = [...sweep].sort((a, b) => (b.result?.r ?? -1) - (a.result?.r ?? -1)).slice(0, 5);
  console.log(`① 2008~2012 스윕 상위: ${top.map((s) => `w${s.window}·N${s.lag} ${fmt(s.result?.r, 2)}`).join(", ")}`);
  console.log(`   창 7일 시차별 r: ${sweep.filter((s) => s.window === 7).map((s) => `${s.lag}:${fmt(s.result?.r, 2)}`).join(" ")}`);
  const within = withinSeasonCorrelation(FIXED);
  console.log(`② 시즌 내 진단 r: ${fmt(within?.r)} (n=${within?.n ?? 0}, p ${within ? correlationPValue(within.r, within.n).toExponential(1) : "—"})`);
  const ownNormal = correlate(LEGACY_YEARS, FIXED, LEGACY_YEARS);
  console.log(`③ 옛 자료 자체 평년 r: ${fmt(ownNormal?.r)} (n=${ownNormal?.n ?? 0})`);

  console.log("\n조합별 (고정 조합):");
  for (const union of Object.keys(UNION_WEATHER_STATION)) {
    const result = correlate(LEGACY_YEARS, FIXED, NORMAL_YEARS, [union]);
    if (result) console.log(`  ${union} ${fmt(result.r, 2)} (n=${result.n})`);
  }
};

main();
