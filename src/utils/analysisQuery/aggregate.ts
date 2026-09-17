import {
  LOW_SAMPLE_THRESHOLD,
  SEASON_WEEK_DAYS,
} from "../../const/Analysis";
import { GradeKeyToKorean } from "../../const/Common";
import { MUSHROOM_SEASON } from "../../const/Numbers";
import { addDays, toSeasonDay } from "./rows";
import type {
  AggregatePoint,
  AggregateSeries,
  AnalysisAxis,
  AnalysisGranularity,
  AnalysisGroupBy,
  AnalysisMetric,
  AnalysisQuery,
  GradeRow,
} from "./types";

/** 집계 옵션 */
export type AggregateOptions = {
  axis: AnalysisAxis;
  groupBy: AnalysisGroupBy;
  granularity: AnalysisGranularity;
  metric: AnalysisMetric;
  seasonStarts: Record<number, string>;
};

/** 포인트 누적기 */
type Bucket = {
  seriesKey: string;
  x: string | number;
  year: number;
  quantity: number;
  amount: number;
  records: Set<string>;
  dates: Set<string>;
  unions: Set<string>;
};

/** 뷰·집계 단위로 x축 차원을 결정한다 */
export const resolveAxis = (
  query: Pick<AnalysisQuery, "view" | "align" | "granularity">,
): AnalysisAxis => {
  if (query.granularity === "season") return "year";
  if (query.view === "overlay" || query.view === "heatmap") {
    return query.align === "seasonDay" ? "seasonDay" : "monthDay";
  }
  return "date";
};

/** 묶기 기준에 따른 시리즈 키 */
const toSeriesKey = (row: GradeRow, groupBy: AnalysisGroupBy): string => {
  switch (groupBy) {
    case "year":
      return String(row.year);
    case "region":
      return row.region;
    case "union":
      return row.union;
    case "grade":
      return row.grade;
    default:
      return "all";
  }
};

/** 시리즈 표시 이름 */
const toSeriesLabel = (key: string, groupBy: AnalysisGroupBy): string => {
  if (groupBy === "none") return "전체";
  if (groupBy === "grade") return GradeKeyToKorean[key as keyof typeof GradeKeyToKorean];
  return key;
};

/** 시즌 주 인덱스 (0부터) */
const toWeekIndex = (dayOffset: number): number =>
  Math.floor(dayOffset / SEASON_WEEK_DAYS);

/** 달력 주 묶음의 기준일 — 시즌 시작 월 1일 (윤년 영향 없음) */
const monthDayWeekAnchor = (year: number): string =>
  `${year}-${String(MUSHROOM_SEASON.START_MONTH).padStart(2, "0")}-01`;

/** 행의 x 값을 계산한다 */
export const toAxisValue = (
  row: GradeRow,
  options: Pick<AggregateOptions, "axis" | "granularity" | "seasonStarts">,
): string | number => {
  const { axis, granularity, seasonStarts } = options;
  const isWeek = granularity === "week";

  if (axis === "year") return row.year;

  if (axis === "seasonDay") {
    const day = toSeasonDay(row.date, seasonStarts[row.year]);
    return isWeek ? toWeekIndex(day - 1) * SEASON_WEEK_DAYS + 1 : day;
  }

  if (axis === "monthDay") {
    if (!isWeek) return row.monthDay;
    const anchor = monthDayWeekAnchor(row.year);
    const week = toWeekIndex(toSeasonDay(row.date, anchor) - 1);
    return addDays(anchor, week * SEASON_WEEK_DAYS).slice(5);
  }

  if (!isWeek) return row.date;
  const start = seasonStarts[row.year];
  const week = toWeekIndex(toSeasonDay(row.date, start) - 1);
  return addDays(start, week * SEASON_WEEK_DAYS);
};

/** 행을 시리즈·연도·x 버킷으로 누적한다 */
const bucketRows = (
  rows: GradeRow[],
  options: AggregateOptions,
): Map<string, Bucket> => {
  const buckets = new Map<string, Bucket>();

  for (const row of rows) {
    const seriesKey = toSeriesKey(row, options.groupBy);
    const x = toAxisValue(row, options);
    const key = `${seriesKey}|${row.year}|${x}`;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        seriesKey,
        x,
        year: row.year,
        quantity: 0,
        amount: 0,
        records: new Set(),
        dates: new Set(),
        unions: new Set(),
      };
      buckets.set(key, bucket);
    }

    bucket.quantity += row.quantity;
    bucket.amount += row.amount;
    bucket.records.add(`${row.date}|${row.union}`);
    bucket.dates.add(row.date);
    bucket.unions.add(row.union);
  }

  return buckets;
};

/** 지표 값 계산 (누계·비중은 후처리) */
const toBaseValue = (bucket: Bucket, metric: AnalysisMetric): number | null => {
  if (metric === "amount") return bucket.amount;
  if (metric === "unitPrice") {
    return bucket.quantity > 0 ? bucket.amount / bucket.quantity : null;
  }
  return bucket.quantity;
};

/** x 비교 함수 (문자열·숫자 겸용) */
export const compareX = (a: string | number, b: string | number): number =>
  typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a).localeCompare(String(b));

/** 누계 적용 — 같은 시리즈 안에서 연도가 바뀌면 초기화 */
const applyCumulative = (points: AggregatePoint[]): void => {
  let running = 0;
  let currentYear: number | null = null;
  for (const point of points) {
    if (point.year !== currentYear) {
      running = 0;
      currentYear = point.year;
    }
    running += point.quantity;
    point.value = running;
  }
};

/** 비중 분모의 시리즈 키 — 등급으로 묶으면 등급 전체 합, 아니면 같은 시리즈 합 */
const toDenominatorSeriesKey = (row: GradeRow, groupBy: AnalysisGroupBy): string =>
  groupBy === "grade" ? "all" : toSeriesKey(row, groupBy);

/**
 * 등급 비중 분모 — 등급 필터를 뺀 행을 같은 시리즈·연도·x로 묶은 전체 수량.
 */
const buildShareTotals = (
  denominatorRows: GradeRow[],
  options: AggregateOptions,
): Map<string, number> => {
  const totals = new Map<string, number>();
  for (const row of denominatorRows) {
    const seriesKey = toDenominatorSeriesKey(row, options.groupBy);
    const key = `${seriesKey}|${row.year}|${toAxisValue(row, options)}`;
    totals.set(key, (totals.get(key) ?? 0) + row.quantity);
  }
  return totals;
};

/** 등급 비중 적용 */
const applyGradeShare = (
  points: AggregatePoint[],
  seriesKey: string,
  totals: Map<string, number>,
  groupBy: AnalysisGroupBy,
): void => {
  const denominatorKey = groupBy === "grade" ? "all" : seriesKey;
  for (const point of points) {
    const total = totals.get(`${denominatorKey}|${point.year}|${point.x}`) ?? 0;
    point.value = total > 0 ? point.quantity / total : null;
  }
};

/**
 * 행을 시리즈별 포인트로 집계한다.
 * `denominatorRows`(등급 필터 제외 행)는 등급 비중 지표에서만 사용한다.
 */
export const aggregateRows = (
  rows: GradeRow[],
  options: AggregateOptions,
  denominatorRows: GradeRow[] = rows,
): AggregateSeries[] => {
  const pointsBySeries = new Map<string, AggregatePoint[]>();
  const shareTotals =
    options.metric === "gradeShare"
      ? buildShareTotals(denominatorRows, options)
      : null;

  for (const bucket of bucketRows(rows, options).values()) {
    const records = bucket.records.size;
    const point: AggregatePoint = {
      x: bucket.x,
      year: bucket.year,
      value: toBaseValue(bucket, options.metric),
      quantity: bucket.quantity,
      amount: bucket.amount,
      records,
      tradingDays: bucket.dates.size,
      unions: bucket.unions.size,
      lowSample: records < LOW_SAMPLE_THRESHOLD.RECORDS_PER_POINT,
    };
    const points = pointsBySeries.get(bucket.seriesKey) ?? [];
    points.push(point);
    pointsBySeries.set(bucket.seriesKey, points);
  }

  return [...pointsBySeries.entries()]
    .map(([key, points]) => {
      points.sort((a, b) => a.year - b.year || compareX(a.x, b.x));
      if (options.metric === "cumQuantity") applyCumulative(points);
      if (shareTotals) {
        applyGradeShare(points, key, shareTotals, options.groupBy);
      }
      return { key, label: toSeriesLabel(key, options.groupBy), points };
    })
    .sort((a, b) => compareX(a.key, b.key));
};
