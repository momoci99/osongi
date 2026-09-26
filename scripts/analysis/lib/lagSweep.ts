/*
  조합 × 공판일 시차 상관 공통 틀 (기획서 9-1·9-4).
  설명변수(지점 시계열)는 시차 창으로 요약하고, 설명·종속 변수 모두 학습 연도 평년 대비 편차로 바꾼다.
*/
import { UNION_WEATHER_STATION } from "../../../src/const/Weather";
import {
  anomaly,
  climatology,
  correlationPValue,
  laggedWindowSum,
  partialCorrelation,
  pearson,
  type Series,
} from "../../../src/utils/weather/seriesStats";

export const LAG_WINDOWS = [3, 5, 7];
export const MAX_LAG = 30;

export type LagCombo = { window: number; lag: number };
export type Correlation = { r: number; n: number; p: number };

/** 창 × 시차 0~maxLag 조합 */
export const lagCombos = (maxLag: number = MAX_LAG): LagCombo[] =>
  LAG_WINDOWS.flatMap((window) => Array.from({ length: maxLag + 1 }, (_, lag) => ({ window, lag })));

export const ALL_LAG_COMBOS: LagCombo[] = lagCombos();

/** 상관 계산 옵션 */
export type LagOptions = {
  unions?: string[];
  /** 이 인덱스(수집 창 기준) 이전 날은 평가하지 않는다 — 시차별 표본을 고정할 때 */
  fromIndex?: number;
};

/** 지점 일별 시계열과 창 요약 방식 */
export type LagFeature = {
  source: (stationId: number, year: number) => Series;
  /** 창 합계(강수) 또는 평균(습도) */
  aggregate: "sum" | "mean";
};

/** 조합 일별 종속변수 */
export type LagTarget = {
  series: (union: string, year: number) => Series;
  /** 일자별 평년값에 필요한 최소 연도 */
  minYears: number;
};

const windowed = ({ source, aggregate }: LagFeature, stationId: number, year: number, { window, lag }: LagCombo): Series => {
  const sums = laggedWindowSum(source(stationId, year), window, lag);
  return aggregate === "sum" ? sums : sums.map((v) => (v === null ? null : v / window));
};

type Pooled = { xs: Series; ys: Series; zs: Series };

/** 편상관 통제 변수 — 지점 시차 변수 또는 같은 날 조합 변수 */
export type LagControl = { feature: LagFeature; combo: LagCombo } | { target: LagTarget };

const maskBefore = (series: Series, fromIndex: number): Series =>
  fromIndex > 0 ? series.map((v, i) => (i < fromIndex ? null : v)) : series;

const pool = (
  feature: LagFeature,
  target: LagTarget,
  trainYears: number[],
  years: number[],
  combo: LagCombo,
  { unions = Object.keys(UNION_WEATHER_STATION), fromIndex = 0 }: LagOptions,
  control?: LagControl,
): Pooled => {
  const xs: Series = [];
  const ys: Series = [];
  const zs: Series = [];
  for (const union of unions) {
    const { stationId } = UNION_WEATHER_STATION[union];
    const targetNormal = climatology(trainYears.map((y) => target.series(union, y)), target.minYears);
    const featureNormal = climatology(trainYears.map((y) => windowed(feature, stationId, y, combo)));
    const controlSeries = (y: number): Series | null => {
      if (!control) return null;
      return "target" in control
        ? control.target.series(union, y)
        : windowed(control.feature, stationId, y, control.combo);
    };
    const controlNormal = control
      ? climatology(trainYears.map((y) => controlSeries(y) ?? []), "target" in control ? control.target.minYears : 1)
      : null;
    for (const y of years) {
      xs.push(...anomaly(windowed(feature, stationId, y, combo), featureNormal));
      ys.push(...maskBefore(anomaly(target.series(union, y), targetNormal), fromIndex));
      const z = controlSeries(y);
      if (z && controlNormal) zs.push(...anomaly(z, controlNormal));
    }
  }
  return { xs, ys, zs };
};

/**
 * 조합 × 공판일 편차 상관.
 * @param trainYears 평년값 계산에 쓸 연도
 * @param years 상관을 계산할 연도
 */
export const lagCorrelation = (
  feature: LagFeature,
  target: LagTarget,
  trainYears: number[],
  years: number[],
  combo: LagCombo,
  options: LagOptions = {},
): Correlation | null => {
  const { xs, ys } = pool(feature, target, trainYears, years, combo, options);
  const result = pearson(xs, ys);
  return result ? { ...result, p: correlationPValue(result.r, result.n) } : null;
};

/** 통제 변수의 편차를 뺀 편상관 */
export const lagPartialCorrelation = (
  feature: LagFeature,
  target: LagTarget,
  trainYears: number[],
  years: number[],
  combo: LagCombo,
  control: LagControl,
  options: LagOptions = {},
): { r: number; n: number } | null => {
  const { xs, ys, zs } = pool(feature, target, trainYears, years, combo, options, control);
  return partialCorrelation(xs, ys, zs);
};

/** 학습 연도 스윕 결과. rankBy 로 정렬 (기본: r 큰 순) */
export const sweepLagCombos = (
  feature: LagFeature,
  target: LagTarget,
  trainYears: number[],
  rankBy: (r: number) => number = (r) => r,
  combos: LagCombo[] = ALL_LAG_COMBOS,
  options: LagOptions = {},
) =>
  combos.map((combo) => ({ ...combo, train: lagCorrelation(feature, target, trainYears, trainYears, combo, options) })).sort(
    (a, b) => rankBy(b.train?.r ?? -Infinity) - rankBy(a.train?.r ?? -Infinity),
  );
