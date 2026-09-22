/*
  H1 강수 시차 상관 계산 (기획서 9-1).
  평년값은 항상 전달받은 학습 연도로만 계산해 검증 연도에 새지 않게 한다.
*/
import { UNION_WEATHER_STATION } from "../../../src/const/Weather";
import {
  anomaly,
  climatology,
  correlationPValue,
  laggedWindowSum,
  pearson,
  type Series,
} from "../../../src/utils/weather/seriesStats";
import { auctionQuantitySeries, rainSeries } from "./analysisData";

export const RAIN_WINDOWS = [3, 5, 7];
export const MAX_RAIN_LAG = 30;
/** 공판량 평년값에 필요한 최소 연도 */
const MIN_QUANTITY_YEARS = 3;

export type RainLagCombo = { window: number; lag: number };
export type Correlation = { r: number; n: number; p: number };

export const ALL_RAIN_LAG_COMBOS: RainLagCombo[] = RAIN_WINDOWS.flatMap((window) =>
  Array.from({ length: MAX_RAIN_LAG + 1 }, (_, lag) => ({ window, lag })),
);

const logQuantity = (union: string, year: number): Series =>
  auctionQuantitySeries(union, year).map((q) => (q === null ? null : Math.log1p(q)));

const quantityAnomalies = (union: string, trainYears: number[], years: number[]): Series[] => {
  const normal = climatology(trainYears.map((y) => logQuantity(union, y)), MIN_QUANTITY_YEARS);
  return years.map((y) => anomaly(logQuantity(union, y), normal));
};

const rainAnomalies = (stationId: number, trainYears: number[], years: number[], { window, lag }: RainLagCombo): Series[] => {
  const feature = (y: number) => laggedWindowSum(rainSeries(stationId, y), window, lag);
  const normal = climatology(trainYears.map(feature));
  return years.map((y) => anomaly(feature(y), normal));
};

/**
 * 조합 × 공판일 편차 상관.
 * @param trainYears 평년값 계산에 쓸 연도
 * @param years 상관을 계산할 연도
 */
export const rainLagCorrelation = (
  trainYears: number[],
  years: number[],
  combo: RainLagCombo,
  unions: string[] = Object.keys(UNION_WEATHER_STATION),
): Correlation | null => {
  const xs: Series = [];
  const ys: Series = [];
  for (const union of unions) {
    const { stationId } = UNION_WEATHER_STATION[union];
    const rain = rainAnomalies(stationId, trainYears, years, combo);
    const quantity = quantityAnomalies(union, trainYears, years);
    years.forEach((_, i) => {
      xs.push(...rain[i]);
      ys.push(...quantity[i]);
    });
  }
  const result = pearson(xs, ys);
  return result ? { ...result, p: correlationPValue(result.r, result.n) } : null;
};

/** 학습 연도에서 r 이 가장 큰 (창, 시차) */
export const bestRainLagCombo = (trainYears: number[]) =>
  ALL_RAIN_LAG_COMBOS.map((combo) => ({ ...combo, train: rainLagCorrelation(trainYears, trainYears, combo) })).sort(
    (a, b) => (b.train?.r ?? -1) - (a.train?.r ?? -1),
  );
