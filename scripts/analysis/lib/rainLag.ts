/*
  H1 강수 시차 상관 (기획서 9-1) — lagSweep 공통 틀에 강수·공판량을 끼운 것.
*/
import { auctionQuantitySeries, rainSeries } from "./analysisData";
import {
  ALL_LAG_COMBOS,
  lagCorrelation,
  LAG_WINDOWS,
  MAX_LAG,
  sweepLagCombos,
  type LagCombo,
  type LagFeature,
  type LagTarget,
} from "./lagSweep";

export { ALL_LAG_COMBOS as ALL_RAIN_LAG_COMBOS, LAG_WINDOWS as RAIN_WINDOWS, MAX_LAG as MAX_RAIN_LAG };
export type { Correlation, LagCombo as RainLagCombo } from "./lagSweep";

/** 공판량 평년값에 필요한 최소 연도 */
const MIN_QUANTITY_YEARS = 3;

export const RAIN_FEATURE: LagFeature = { source: rainSeries, aggregate: "sum" };

export const LOG_QUANTITY_TARGET: LagTarget = {
  series: (union, year) => auctionQuantitySeries(union, year).map((q) => (q === null ? null : Math.log1p(q))),
  minYears: MIN_QUANTITY_YEARS,
};

export const rainLagCorrelation = (trainYears: number[], years: number[], combo: LagCombo, unions?: string[]) =>
  lagCorrelation(RAIN_FEATURE, LOG_QUANTITY_TARGET, trainYears, years, combo, unions);

/** 학습 연도에서 r 이 가장 큰 (창, 시차) */
export const bestRainLagCombo = (trainYears: number[]) => sweepLagCombos(RAIN_FEATURE, LOG_QUANTITY_TARGET, trainYears);
