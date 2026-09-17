import { LINE_CHART } from "../../const/AnalysisLayout";
import { buildXMapping, splitByGap, type ChartXMapping } from "./chartScale";
import type { AnalysisQuery, AnalysisResultCore } from "./types";

/** 차트 포인트 */
export type ChartPoint = {
  position: number;
  x: string | number;
  year: number;
  value: number;
  records: number;
  lowSample: boolean;
};

/**
 * 시리즈 역할.
 * focus — 시즌 겹침에서 가장 최근 시즌 (강조색)
 * context — 시즌 겹침의 나머지 시즌 (중립색, 오래될수록 흐림)
 * entity — 지역·등급·조합처럼 대상 고유색을 쓰는 시리즈
 * comparison — 전년 같은 기간 (같은 대상색, 점선)
 */
export type SeriesRole = "focus" | "context" | "entity" | "comparison";

/** 차트 시리즈 */
export type ChartSeries = {
  key: string;
  /** 색을 결정하는 대상 키 (전년 비교 시리즈는 원래 대상 키) */
  colorKey: string;
  label: string;
  role: SeriesRole;
  /** context 시리즈 불투명도 */
  opacity: number;
  points: ChartPoint[];
  segments: ChartPoint[][];
};

/** 평년 밴드 포인트 */
export type ChartBandPoint = {
  position: number;
  x: string | number;
  lower: number;
  median: number;
  upper: number;
  seasons: number;
};

/** 선 차트 모델 */
export type LineChartModel = {
  mapping: ChartXMapping;
  series: ChartSeries[];
  band: ChartBandPoint[] | null;
  yDomain: [number, number];
  /** 호버 스냅 대상 위치 (오름차순) */
  positions: number[];
};

/** 0 기준 축을 쓰지 않는 지표 — 가격은 변동 폭이 핵심이라 0을 포함하면 선이 납작해진다 */
const isFloatingMetric = (query: AnalysisQuery): boolean => query.metric === "unitPrice";

/** y 도메인 */
const buildYDomain = (values: number[], floating: boolean): [number, number] => {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min || max || 1) * LINE_CHART.Y_PADDING_RATIO;
  return floating ? [Math.max(0, min - padding), max + padding] : [0, max + padding];
};

/** 시즌 겹침에서 최근일수록 진하게 */
const contextOpacity = (year: number, years: number[]): number => {
  const { MIN, MAX } = LINE_CHART.CONTEXT_OPACITY;
  if (years.length <= 1) return MAX;
  const rank = years.indexOf(year) / (years.length - 1);
  return MIN + (MAX - MIN) * rank;
};

/** 전년 결과의 x를 1년 뒤로 옮겨 현재 기간 축에 겹친다 */
const shiftXOneYear = (x: string | number, axis: AnalysisResultCore["axis"]): string | number => {
  if (axis === "year") return Number(x) + 1;
  if (axis === "date") return `${Number(String(x).slice(0, 4)) + 1}${String(x).slice(4)}`;
  return x;
};

/** 전년 비교 시리즈를 현재 축으로 옮긴 결과 */
const shiftComparison = (comparison: AnalysisResultCore): AnalysisResultCore["series"] =>
  comparison.series.map((series) => ({
    ...series,
    key: `${series.key}__prev`,
    label: `${series.label} (전년)`,
    points: series.points.map((point) => ({
      ...point,
      x: shiftXOneYear(point.x, comparison.axis),
      year: point.year + 1,
    })),
  }));

/** 집계 결과를 선 차트 모델로 변환한다 */
export const buildLineChartModel = (
  result: AnalysisResultCore,
  query: AnalysisQuery,
  comparison: AnalysisResultCore | null = null,
): LineChartModel => {
  const comparisonSeries = comparison ? shiftComparison(comparison) : [];
  const allX = [
    ...result.series.flatMap((series) => series.points.map((point) => point.x)),
    ...comparisonSeries.flatMap((series) => series.points.map((point) => point.x)),
    ...(result.normalBand ?? []).map((point) => point.x),
  ];
  const mapping = buildXMapping(result.axis, allX, query.granularity);
  const gapBreak = query.metric === "cumQuantity" ? Number.POSITIVE_INFINITY : mapping.gapBreak;

  const byYear = query.groupBy === "year";
  const seriesYears = result.series.map((series) => Number(series.key)).sort((a, b) => a - b);
  const focusYear = byYear ? seriesYears[seriesYears.length - 1] : null;
  const contextYears = seriesYears.filter((year) => year !== focusYear);

  const comparisonKeys = new Set(comparisonSeries.map((series) => series.key));
  const series: ChartSeries[] = [...comparisonSeries, ...result.series].map((source) => {
    const points = source.points
      .filter((point) => point.value !== null)
      .map((point) => ({
        position: mapping.toPosition(point.x),
        x: point.x,
        year: point.year,
        value: point.value as number,
        records: point.records,
        lowSample: point.lowSample,
      }))
      .sort((a, b) => a.position - b.position);

    const isComparison = comparisonKeys.has(source.key);
    const year = Number(source.key);
    const role: SeriesRole = isComparison
      ? "comparison"
      : !byYear
        ? "entity"
        : year === focusYear
          ? "focus"
          : "context";

    return {
      key: source.key,
      colorKey: isComparison ? source.key.replace(/__prev$/, "") : source.key,
      label: byYear && !isComparison ? `${source.key}` : source.label,
      role,
      opacity:
        role === "context"
          ? contextOpacity(year, contextYears)
          : role === "comparison"
            ? LINE_CHART.CONTEXT_OPACITY.MAX
            : 1,
      points,
      segments: splitByGap(points, gapBreak),
    };
  });

  const band =
    result.normalBand?.map((point) => ({ ...point, position: mapping.toPosition(point.x) })) ?? null;

  const values = [
    ...series.flatMap((item) => item.points.map((point) => point.value)),
    ...(band ?? []).flatMap((point) => [point.lower, point.upper]),
  ];

  const positions = [
    ...new Set([
      ...series.flatMap((item) => item.points.map((point) => point.position)),
      ...(band ?? []).map((point) => point.position),
    ]),
  ].sort((a, b) => a - b);

  return {
    mapping,
    series,
    band,
    yDomain: buildYDomain(values, isFloatingMetric(query)),
    positions,
  };
};

/** 정렬된 위치 목록에서 가장 가까운 위치 */
export const nearestPosition = (positions: number[], target: number): number | null => {
  if (positions.length === 0) return null;
  let low = 0;
  let high = positions.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (positions[mid] < target) low = mid + 1;
    else high = mid;
  }
  const candidate = positions[low];
  const previous = positions[low - 1];
  return previous !== undefined && target - previous < candidate - target ? previous : candidate;
};
