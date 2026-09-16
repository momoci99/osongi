import {
  MIN_NORMAL_SEASONS,
  NORMAL_BAND_QUANTILES,
  NORMAL_BASELINE_SEASONS,
} from "../../const/Analysis";
import { aggregateRows, compareX, type AggregateOptions } from "./aggregate";
import { findSeasonStarts } from "./rows";
import type { AggregatePoint, GradeRow, NormalBandPoint } from "./types";

/** 정렬된 숫자 배열의 선형 보간 분위수 */
export const quantileSorted = (sorted: number[], q: number): number => {
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
};

/**
 * 평년 기준 시즌을 고른다.
 * 선택 시즌 중 가장 최근 연도보다 이전이면서 선택되지 않은 시즌 중 최근 N개.
 */
export const pickNormalYears = (
  availableYears: number[],
  selectedYears: number[],
): number[] => {
  if (selectedYears.length === 0) return [];
  const anchor = Math.max(...selectedYears);
  return availableYears
    .filter((year) => year < anchor && !selectedYears.includes(year))
    .sort((a, b) => a - b)
    .slice(-NORMAL_BASELINE_SEASONS);
};

/**
 * 누계 지표용 — x 이하 마지막 포인트 값.
 * 해당 시즌에 x 이전 공판이 없으면 0, 시즌이 끝난 뒤면 최종 누계를 유지한다.
 */
const cumulativeAt = (points: AggregatePoint[], x: string | number): number => {
  let value = 0;
  for (const point of points) {
    if (compareX(point.x, x) > 0) break;
    value = point.value ?? value;
  }
  return value;
};

/**
 * 시즌별로 한 줄씩 집계한 뒤 같은 x의 값을 모아 분위 밴드를 만든다.
 * `rows`는 시간 필터를 뺀 지역·조합·등급 필터 결과여야 한다.
 */
export const buildNormalBand = (
  rows: GradeRow[],
  normalYears: number[],
  options: Omit<AggregateOptions, "groupBy" | "seasonStarts">,
  denominatorRows: GradeRow[] = rows,
): NormalBandPoint[] => {
  if (options.axis !== "seasonDay" && options.axis !== "monthDay") return [];

  const yearSet = new Set(normalYears);
  const baselineRows = rows.filter((row) => yearSet.has(row.year));
  const baselineDenominators = denominatorRows.filter((row) => yearSet.has(row.year));
  const series = aggregateRows(
    baselineRows,
    { ...options, groupBy: "year", seasonStarts: findSeasonStarts(baselineRows) },
    baselineDenominators,
  );

  const allX = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))].sort(compareX);
  const isCumulative = options.metric === "cumQuantity";

  return allX.flatMap((x) => {
    const values = series
      .map((s) =>
        isCumulative
          ? cumulativeAt(s.points, x)
          : (s.points.find((p) => p.x === x)?.value ?? null),
      )
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);

    if (values.length < MIN_NORMAL_SEASONS) return [];

    return [
      {
        x,
        lower: quantileSorted(values, NORMAL_BAND_QUANTILES.LOWER),
        median: quantileSorted(values, NORMAL_BAND_QUANTILES.MEDIAN),
        upper: quantileSorted(values, NORMAL_BAND_QUANTILES.UPPER),
        seasons: values.length,
      },
    ];
  });
};
