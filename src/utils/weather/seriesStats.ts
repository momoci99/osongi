import { WEATHER_ANALYSIS } from "../../const/Weather";

/** 결측을 null 로 표현한 일별 시계열 */
export type Series = (number | null)[];

/** 응답 문자열 → 숫자. 빈 문자열·비숫자는 결측(null) */
export const toNumberOrNull = (value: string | undefined): number | null => {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * 후행 이동평균.
 * 창 안의 관측값이 minCount 미만이면 결측으로 둔다 — 결측을 0 으로 메우지 않는다.
 */
export const movingAverage = (
  series: Series,
  windowDays: number = WEATHER_ANALYSIS.MOVING_AVERAGE_DAYS,
  minCount: number = WEATHER_ANALYSIS.MOVING_AVERAGE_MIN_COUNT,
): Series =>
  series.map((_, index) => {
    const window = series
      .slice(Math.max(0, index - windowDays + 1), index + 1)
      .filter((v): v is number => v !== null);
    if (window.length < minCount) return null;
    return window.reduce((sum, v) => sum + v, 0) / window.length;
  });

/** 두 시계열에서 양쪽 모두 관측된 지점만 짝지어 뽑는다 */
const pairedValues = (xs: Series, ys: Series): [number, number][] =>
  xs.flatMap((x, i) => {
    const y = ys[i];
    return x !== null && y !== null && y !== undefined ? [[x, y] as [number, number]] : [];
  });

/** 피어슨 상관계수. 짝 표본이 부족하거나 분산이 0 이면 null */
export const pearson = (
  xs: Series,
  ys: Series,
): { r: number; n: number } | null => {
  const pairs = pairedValues(xs, ys);
  const n = pairs.length;
  if (n < WEATHER_ANALYSIS.MIN_CORRELATION_SAMPLES) return null;

  const meanX = pairs.reduce((s, [x]) => s + x, 0) / n;
  const meanY = pairs.reduce((s, [, y]) => s + y, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (const [x, y] of pairs) {
    cov += (x - meanX) * (y - meanY);
    varX += (x - meanX) ** 2;
    varY += (y - meanY) ** 2;
  }
  if (varX === 0 || varY === 0) return null;
  return { r: cov / Math.sqrt(varX * varY), n };
};

/** 양쪽 모두 관측된 날의 평균 차이 (xs - ys) */
export const meanDifference = (xs: Series, ys: Series): number | null => {
  const pairs = pairedValues(xs, ys);
  if (pairs.length === 0) return null;
  return pairs.reduce((s, [x, y]) => s + (x - y), 0) / pairs.length;
};

/**
 * 연도별로 같은 길이로 정렬된 시계열의 일자별 평년값.
 * 해당 일자에 관측된 연도만 평균한다.
 */
export const climatology = (seriesByYear: Series[]): Series => {
  const length = Math.max(0, ...seriesByYear.map((s) => s.length));
  return Array.from({ length }, (_, index) => {
    const values = seriesByYear
      .map((s) => s[index])
      .filter((v): v is number => v !== null && v !== undefined);
    return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
  });
};

/** 평년 대비 편차 */
export const anomaly = (series: Series, normal: Series): Series =>
  series.map((v, i) => (v === null || normal[i] === null || normal[i] === undefined ? null : v - normal[i]));

/** 값이 처음으로 기준 이하가 되는 인덱스. fromIndex 이전은 보지 않는다 */
export const firstIndexAtOrBelow = (
  series: Series,
  threshold: number,
  fromIndex = 0,
): number | null => {
  for (let i = fromIndex; i < series.length; i++) {
    const v = series[i];
    if (v !== null && v <= threshold) return i;
  }
  return null;
};

/** 중앙값 (빈 배열이면 null) */
export const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};
