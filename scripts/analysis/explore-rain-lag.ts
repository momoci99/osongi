#!/usr/bin/env node
/*
  H1 탐색: 강수 후 N일 뒤 공판량이 늘어나는가 (기획서 9-1)

  조합 × 공판일 단위로 log 공판량 편차와 시차 누적 강수 편차의 상관을 (창 w, 시차 N) 별로 스윕한다.
  평년값은 학습 연도로만 계산해 홀드아웃에 새지 않게 한다.

  실행: npx tsx scripts/analysis/explore-rain-lag.ts
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
import { auctionQuantitySeries, rainSeries, yearRange } from "./lib/analysisData";

const TRAIN_YEARS = yearRange(WEATHER_FIRST_YEAR, 2022);
const HOLDOUT_YEARS = yearRange(2023, 2025);
const WINDOWS = [3, 5, 7];
const MAX_LAG = 30;
/** 공판량 평년값에 필요한 최소 연도 */
const MIN_QUANTITY_YEARS = 3;
/** 판정 기준 (기획서 9-1) */
const CRITERIA = { r: 0.3, alpha: 0.05 };
const TEST_COUNT = WINDOWS.length * (MAX_LAG + 1);

type Combo = { window: number; lag: number };
type Pooled = { xs: Series; ys: Series };

const logQuantity = (union: string, year: number): Series =>
  auctionQuantitySeries(union, year).map((q) => (q === null ? null : Math.log1p(q)));

/** 조합별 공판량 편차 — 학습 연도 평년 기준 */
const quantityAnomalies = (union: string, years: number[]): Series[] => {
  const normal = climatology(TRAIN_YEARS.map((y) => logQuantity(union, y)), MIN_QUANTITY_YEARS);
  return years.map((y) => anomaly(logQuantity(union, y), normal));
};

/** 지점별 시차 누적 강수 편차 — 학습 연도 평년 기준 */
const rainAnomalies = (stationId: number, years: number[], { window, lag }: Combo): Series[] => {
  const feature = (y: number) => laggedWindowSum(rainSeries(stationId, y), window, lag);
  const normal = climatology(TRAIN_YEARS.map(feature));
  return years.map((y) => anomaly(feature(y), normal));
};

const pooledPairs = (years: number[], combo: Combo, unions = Object.keys(UNION_WEATHER_STATION)): Pooled => {
  const xs: Series = [];
  const ys: Series = [];
  for (const union of unions) {
    const { stationId } = UNION_WEATHER_STATION[union];
    const rain = rainAnomalies(stationId, years, combo);
    const quantity = quantityAnomalies(union, years);
    years.forEach((_, i) => {
      xs.push(...rain[i]);
      ys.push(...quantity[i]);
    });
  }
  return { xs, ys };
};

const correlate = (years: number[], combo: Combo, unions?: string[]) => {
  const { xs, ys } = pooledPairs(years, combo, unions);
  const result = pearson(xs, ys);
  return result ? { ...result, p: correlationPValue(result.r, result.n) } : null;
};

const fmt = (v: number | undefined, digits = 3) => (v === undefined ? "—" : v.toFixed(digits));

const main = () => {
  console.log(`# H1 강수 시차 스윕 — 학습 ${TRAIN_YEARS[0]}~${TRAIN_YEARS.at(-1)}, 홀드아웃 ${HOLDOUT_YEARS[0]}~${HOLDOUT_YEARS.at(-1)}\n`);

  const sweep = WINDOWS.flatMap((window) =>
    Array.from({ length: MAX_LAG + 1 }, (_, lag) => ({ window, lag, train: correlate(TRAIN_YEARS, { window, lag }) })),
  );

  console.log("## 학습 구간 시차별 r (행: 창 w, 열: 시차 N)\n");
  console.log(`| w \\ N | ${Array.from({ length: MAX_LAG + 1 }, (_, n) => n).join(" | ")} |`);
  console.log(`|---|${Array(MAX_LAG + 1).fill("---").join("|")}|`);
  for (const window of WINDOWS) {
    const cells = sweep.filter((s) => s.window === window).map((s) => fmt(s.train?.r, 2));
    console.log(`| ${window} | ${cells.join(" | ")} |`);
  }

  const ranked = [...sweep].sort((a, b) => (b.train?.r ?? -1) - (a.train?.r ?? -1));
  console.log("\n## 학습 상위 5 → 홀드아웃 재현\n");
  console.log("| w | N | 학습 r | 학습 n | 학습 p×93 | 홀드아웃 r | 홀드아웃 n |");
  console.log("|---|---|---|---|---|---|---|");
  for (const s of ranked.slice(0, 5)) {
    const holdout = correlate(HOLDOUT_YEARS, s);
    console.log(`| ${s.window} | ${s.lag} | ${fmt(s.train?.r)} | ${s.train?.n} | ${(Math.min(1, (s.train?.p ?? 1) * TEST_COUNT)).toExponential(1)} | ${fmt(holdout?.r)} | ${holdout?.n} |`);
  }

  const best = ranked[0];
  const holdout = correlate(HOLDOUT_YEARS, best);
  const pass =
    (best.train?.r ?? 0) >= CRITERIA.r &&
    (holdout?.r ?? 0) >= CRITERIA.r &&
    (best.train?.p ?? 1) < CRITERIA.alpha / TEST_COUNT;
  console.log(`\n## 판정: ${pass ? "✅ 통과" : "❌ 미통과"} (최적 w=${best.window}, N=${best.lag})\n`);

  console.log("## 참고: 조합별 r (최적 조합, 전 기간)\n");
  console.log("| 조합 | r | n |");
  console.log("|---|---|---|");
  for (const union of Object.keys(UNION_WEATHER_STATION)) {
    const result = correlate([...TRAIN_YEARS, ...HOLDOUT_YEARS], best, [union]);
    console.log(`| ${union} | ${fmt(result?.r, 2)} | ${result?.n ?? 0} |`);
  }
};

main();
