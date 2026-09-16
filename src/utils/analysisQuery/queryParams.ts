import * as z from "zod";
import { QUERY_YEAR_RANGE } from "../../const/Analysis";
import { isValidCalendarDate } from "../calendarDate";
import { GRADE_KEYS } from "./rows";
import type { AnalysisQuery, AnalysisTime, GradeKey } from "./types";

/** URL 파라미터 이름 */
export const QUERY_PARAM = {
  VIEW: "view",
  YEARS: "years",
  FROM: "from",
  TO: "to",
  ALIGN: "align",
  REGIONS: "regions",
  UNIONS: "unions",
  GRADES: "grades",
  METRIC: "metric",
  GROUP_BY: "by",
  GRANULARITY: "unit",
  COMPARE: "compare",
  COMMON_UNITS: "common",
} as const;

/** 전체 등급을 뜻하는 grades 값 */
const ALL_GRADES_TOKEN = "all";

/** 목록 구분자 */
const LIST_SEPARATOR = ",";

const viewSchema = z.enum([
  "timeline",
  "overlay",
  "heatmap",
  "coverage",
  "rank",
  "composition",
  "relation",
  "table",
]);
const alignSchema = z.enum(["calendar", "seasonDay"]);
const metricSchema = z.enum(["unitPrice", "quantity", "amount", "cumQuantity", "gradeShare"]);
const groupBySchema = z.enum(["none", "year", "region", "union", "grade"]);
const granularitySchema = z.enum(["day", "week", "season"]);
const compareSchema = z.enum(["none", "normal", "prevYear"]);
const yearSchema = z.coerce.number().int().min(QUERY_YEAR_RANGE.MIN).max(QUERY_YEAR_RANGE.MAX);

/** 쉼표 목록을 배열로 */
const splitList = (value: string): string[] =>
  value
    .split(LIST_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean);

/** enum 파라미터 파싱 — 없거나 잘못되면 폴백 */
const parseEnum = <T extends string>(
  schema: z.ZodType<T>,
  value: string | null,
  fallback: T,
): T => {
  if (value === null) return fallback;
  const result = schema.safeParse(value);
  return result.success ? result.data : fallback;
};

/** 시간 범위 파싱 — 기간(from·to)이 유효하면 우선, 아니면 연도 목록 */
const parseTime = (params: URLSearchParams, fallback: AnalysisTime): AnalysisTime => {
  const from = params.get(QUERY_PARAM.FROM);
  const to = params.get(QUERY_PARAM.TO);
  if (from && to && isValidCalendarDate(from) && isValidCalendarDate(to) && from <= to) {
    return { kind: "range", start: from, end: to };
  }

  const yearsParam = params.get(QUERY_PARAM.YEARS);
  if (yearsParam === null) return fallback;

  const years = splitList(yearsParam).flatMap((item) => {
    const result = yearSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
  if (years.length === 0) return fallback;

  return { kind: "seasons", years: [...new Set(years)].sort((a, b) => a - b) };
};

/** 등급 목록 파싱 — `all`은 빈 배열(전체) */
const parseGrades = (value: string | null, fallback: GradeKey[]): GradeKey[] => {
  if (value === null) return fallback;
  if (value === ALL_GRADES_TOKEN) return [];
  const grades = splitList(value).filter((item): item is GradeKey =>
    (GRADE_KEYS as string[]).includes(item),
  );
  return grades.length > 0 ? grades : fallback;
};

/** 문자열 목록 파싱 */
const parseList = (value: string | null, fallback: string[]): string[] =>
  value === null ? fallback : splitList(value);

/**
 * URL 파라미터를 분석 쿼리로 변환한다.
 * 파라미터마다 독립적으로 검증하고, 없거나 잘못된 값은 폴백 쿼리 값을 쓴다.
 */
export const parseAnalysisQuery = (
  params: URLSearchParams,
  fallback: AnalysisQuery,
): AnalysisQuery => ({
  view: parseEnum(viewSchema, params.get(QUERY_PARAM.VIEW), fallback.view),
  time: parseTime(params, fallback.time),
  align: parseEnum(alignSchema, params.get(QUERY_PARAM.ALIGN), fallback.align),
  regions: parseList(params.get(QUERY_PARAM.REGIONS), fallback.regions),
  unions: parseList(params.get(QUERY_PARAM.UNIONS), fallback.unions),
  grades: parseGrades(params.get(QUERY_PARAM.GRADES), fallback.grades),
  metric: parseEnum(metricSchema, params.get(QUERY_PARAM.METRIC), fallback.metric),
  groupBy: parseEnum(groupBySchema, params.get(QUERY_PARAM.GROUP_BY), fallback.groupBy),
  granularity: parseEnum(
    granularitySchema,
    params.get(QUERY_PARAM.GRANULARITY),
    fallback.granularity,
  ),
  compare: parseEnum(compareSchema, params.get(QUERY_PARAM.COMPARE), fallback.compare),
  commonUnitsOnly:
    params.has(QUERY_PARAM.COMMON_UNITS)
      ? params.get(QUERY_PARAM.COMMON_UNITS) === "1"
      : fallback.commonUnitsOnly,
});

/**
 * 분석 쿼리를 URL 파라미터로 변환한다.
 * 링크만으로 화면이 재현되도록 모든 키를 명시한다.
 */
export const serializeAnalysisQuery = (query: AnalysisQuery): URLSearchParams => {
  const params = new URLSearchParams();
  params.set(QUERY_PARAM.VIEW, query.view);

  if (query.time.kind === "range") {
    params.set(QUERY_PARAM.FROM, query.time.start);
    params.set(QUERY_PARAM.TO, query.time.end);
  } else {
    params.set(QUERY_PARAM.YEARS, query.time.years.join(LIST_SEPARATOR));
  }

  params.set(QUERY_PARAM.ALIGN, query.align);
  params.set(QUERY_PARAM.REGIONS, query.regions.join(LIST_SEPARATOR));
  params.set(QUERY_PARAM.UNIONS, query.unions.join(LIST_SEPARATOR));
  params.set(
    QUERY_PARAM.GRADES,
    query.grades.length === 0 ? ALL_GRADES_TOKEN : query.grades.join(LIST_SEPARATOR),
  );
  params.set(QUERY_PARAM.METRIC, query.metric);
  params.set(QUERY_PARAM.GROUP_BY, query.groupBy);
  params.set(QUERY_PARAM.GRANULARITY, query.granularity);
  params.set(QUERY_PARAM.COMPARE, query.compare);
  params.set(QUERY_PARAM.COMMON_UNITS, query.commonUnitsOnly ? "1" : "0");
  return params;
};
