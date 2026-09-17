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

/** 파싱 결과 캐시 상한 — URL 조합이 계속 바뀌어도 메모리가 늘지 않게 */
const PARSE_CACHE_LIMIT = 64;

/** 같은 내용이면 같은 참조를 돌려주는 캐시 */
const parseCache = new Map<string, AnalysisQuery>();

/** 배열·시간 조각을 내용 기준으로 공유하기 위한 캐시 */
const partCache = new Map<string, unknown>();

/** 내용이 같은 조각은 같은 참조로 — 자식 컴포넌트 메모가 동작하게 한다 */
const intern = <T>(value: T): T => {
  const key = JSON.stringify(value);
  const cached = partCache.get(key);
  if (cached !== undefined) return cached as T;
  if (partCache.size > PARSE_CACHE_LIMIT * 4) partCache.clear();
  partCache.set(key, value);
  return value;
};

/**
 * URL 파라미터를 분석 쿼리로 변환한다.
 * 파라미터마다 독립적으로 검증하고, 없거나 잘못된 값은 폴백 쿼리 값을 쓴다.
 */
export const parseAnalysisQuery = (params: URLSearchParams, fallback: AnalysisQuery): AnalysisQuery => {
  const cacheKey = `${params.toString()}#${serializeAnalysisQuery(fallback).toString()}`;
  const cached = parseCache.get(cacheKey);
  if (cached) return cached;

  const parsed = parseAnalysisQueryUncached(params, fallback);
  const query: AnalysisQuery = {
    ...parsed,
    time: intern(parsed.time),
    regions: intern(parsed.regions),
    unions: intern(parsed.unions),
    grades: intern(parsed.grades),
  };
  if (parseCache.size >= PARSE_CACHE_LIMIT) parseCache.clear();
  parseCache.set(cacheKey, query);
  return query;
};

/** 캐시 없는 파싱 */
const parseAnalysisQueryUncached = (
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
