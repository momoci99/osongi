#!/usr/bin/env node
/*
  H10′ 독립 검증 (기획서 9-6): 비 그친 뒤 7~10일째 공판량이 늘어나는가 — 2008~2012.

  이벤트·비교군은 9-5 와 같고, 9-5 v2 방식대로 조합·연도 안에서 차이를 낸 뒤 반응일 가중 평균한다.
  k 7~10 은 묶어서 하나의 값. 평년값은 2013~2025.

  실행: npx tsx scripts/analysis/verify-legacy-h10.ts
*/
import { UNION_WEATHER_STATION, WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import { anomaly, climatology, type Series } from "../../src/utils/weather/seriesStats";
import { auctionQuantitySeries, LAST_COMPLETE_YEAR, rainSeries, yearRange } from "./lib/analysisData";
import { LEGACY_YEARS, maskIfSparse } from "./lib/legacyAuction";

const NORMAL_YEARS = yearRange(WEATHER_FIRST_YEAR, LAST_COMPLETE_YEAR);
const MIN_NORMAL_YEARS = 3;
/** 비 그침 정의 (9-5 와 동일) */
const STOP = { rainMm: 10, dryMm: 1, maxK: 10 };
const RESPONSE_K = { from: 7, to: 10 };
/** 판정 기준 (기획서 9-6) */
const CRITERIA = { diff: 0.1, alpha: 0.05 };

/**
 * 마지막 10mm 이상 강수로부터 경과일 k (그 다음날 무강수일 때만). 11일 이상이면 비교군(Infinity).
 * (explore-rain-events 와 동일)
 */
const daysSinceStop = (rain: Series): (number | null)[] =>
  rain.map((_, d) => {
    for (let i = d - 1; i >= 0; i--) {
      const r = rain[i];
      if (r === null) return null;
      if (r >= STOP.rainMm) {
        const k = d - i;
        if (k > STOP.maxK) return Infinity;
        const next = rain[i + 1];
        return next !== null && next < STOP.dryMm ? k : null;
      }
      if (d - i > STOP.maxK) return Infinity;
    }
    return null;
  });

const meanOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** 이항 분포 양측 부호 검정 */
const signTestP = (positive: number, n: number): number => {
  const choose = (k: number) => {
    let c = 1;
    for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
    return c;
  };
  const tail = Math.min(positive, n - positive);
  let p = 0;
  for (let k = 0; k <= tail; k++) p += choose(k) / 2 ** n;
  return Math.min(1, 2 * p);
};

const logQuantity = (union: string, year: number): Series =>
  auctionQuantitySeries(union, year).map((q) => (q === null ? null : Math.log1p(q)));

const main = () => {
  console.log(`# H10′ 독립 검증 — 비 그친 뒤 ${RESPONSE_K.from}~${RESPONSE_K.to}일째 공판량, 2008~2012\n`);
  const units: { union: string; year: number; diff: number; weight: number }[] = [];

  for (const [union, { stationId }] of Object.entries(UNION_WEATHER_STATION)) {
    const normal = climatology(NORMAL_YEARS.map((y) => logQuantity(union, y)), MIN_NORMAL_YEARS);
    for (const year of LEGACY_YEARS) {
      const rain = maskIfSparse(rainSeries(stationId, year));
      const ks = daysSinceStop(rain);
      const response: number[] = [];
      const base: number[] = [];
      anomaly(logQuantity(union, year), normal).forEach((v, d) => {
        const k = ks[d];
        const today = rain[d];
        if (v === null || k === null || today === null || today >= STOP.dryMm) return;
        if (k === Infinity) base.push(v);
        else if (k >= RESPONSE_K.from && k <= RESPONSE_K.to) response.push(v);
      });
      if (response.length && base.length)
        units.push({ union, year, diff: meanOf(response) - meanOf(base), weight: response.length });
    }
  }

  const totalWeight = units.reduce((a, u) => a + u.weight, 0);
  const weighted = units.reduce((a, u) => a + u.diff * u.weight, 0) / Math.max(1, totalWeight);
  const positive = units.filter((u) => u.diff > 0).length;
  const p = signTestP(positive, units.length);
  const pass = weighted >= CRITERIA.diff && p < CRITERIA.alpha;

  console.log("| 항목 | 값 | 기준 |\n|---|---|---|");
  console.log(`| 평균 차이 (log, 반응일 ${totalWeight}일 가중) | ${weighted.toFixed(3)} | ≥ ${CRITERIA.diff} |`);
  console.log(`| 양수 조합·연도 | ${positive}/${units.length} | — |`);
  console.log(`| 부호 검정 p (양측) | ${p.toFixed(4)} | < ${CRITERIA.alpha} |`);
  console.log(`\n## 판정: ${pass ? "✅ 통과" : "❌ 미통과"}\n`);

  console.log("## 참고 (판정 아님): 시즌별\n");
  for (const year of LEGACY_YEARS) {
    const yearUnits = units.filter((u) => u.year === year);
    const w = yearUnits.reduce((a, u) => a + u.weight, 0);
    const mean = yearUnits.reduce((a, u) => a + u.diff * u.weight, 0) / Math.max(1, w);
    console.log(`- ${year}: ${mean.toFixed(3)} (조합 ${yearUnits.length}, 양수 ${yearUnits.filter((u) => u.diff > 0).length})`);
  }
};

main();
