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

/**
 * 링크에서 생략할 수 있는 값 — 공유 링크가 기본 템플릿 변경에 흔들리지 않도록 고정한다.
 * 분석 파라미터가 하나라도 있는 URL이면 빠진 키는 여기 값으로 읽는다.
 */
const STATIC_QUERY_DEFAULTS = {
  align: "calendar",
  regions: [] as string[],
  unions: [] as string[],
  grades: [] as GradeKey[],
  metric: "unitPrice",
  groupBy: "none",
  granularity: "day",
  compare: "none",
  commonUnitsOnly: false,
} as const satisfies Omit<AnalysisQuery, "view" | "time">;

/** 분석 파라미터 이름 전체 */
const ALL_QUERY_PARAMS = Object.values(QUERY_PARAM);

/** 두 문자열 목록이 같은 내용인지 */
const isSameList = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((item, index) => item === b[index]);

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

/**
 * 빠진 파라미터를 채울 기준값.
 * 분석 파라미터가 하나라도 있으면 "생략 = 기본값"인 링크로 보고 정적 기본값을 쓴다.
 * 파라미터가 전혀 없을 때만(첫 방문) 기본 템플릿 쿼리를 따른다.
 */
const selectBase = (params: URLSearchParams, fallback: AnalysisQuery): AnalysisQuery =>
  ALL_QUERY_PARAMS.some((name) => params.has(name)) ? { ...fallback, ...STATIC_QUERY_DEFAULTS } : fallback;

/** 캐시 없는 파싱 */
const parseAnalysisQueryUncached = (
  params: URLSearchParams,
  fallback: AnalysisQuery,
): AnalysisQuery => {
  const base = selectBase(params, fallback);
  return {
    view: parseEnum(viewSchema, params.get(QUERY_PARAM.VIEW), base.view),
    /** 연도 목록은 데이터에 따라 달라져 정적 기본값을 둘 수 없다 — 항상 폴백 시간 */
    time: parseTime(params, fallback.time),
    align: parseEnum(alignSchema, params.get(QUERY_PARAM.ALIGN), base.align),
    regions: parseList(params.get(QUERY_PARAM.REGIONS), base.regions),
    unions: parseList(params.get(QUERY_PARAM.UNIONS), base.unions),
    grades: parseGrades(params.get(QUERY_PARAM.GRADES), base.grades),
    metric: parseEnum(metricSchema, params.get(QUERY_PARAM.METRIC), base.metric),
    groupBy: parseEnum(groupBySchema, params.get(QUERY_PARAM.GROUP_BY), base.groupBy),
    granularity: parseEnum(
      granularitySchema,
      params.get(QUERY_PARAM.GRANULARITY),
      base.granularity,
    ),
    compare: parseEnum(compareSchema, params.get(QUERY_PARAM.COMPARE), base.compare),
    commonUnitsOnly:
      params.has(QUERY_PARAM.COMMON_UNITS)
        ? params.get(QUERY_PARAM.COMMON_UNITS) === "1"
        : base.commonUnitsOnly,
  };
};

/**
 * 분석 쿼리를 URL 파라미터로 변환한다.
 * 기본값과 같은 키는 생략해 공유 링크를 짧게 유지한다. (view·기간은 항상 명시)
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

  if (query.align !== STATIC_QUERY_DEFAULTS.align) params.set(QUERY_PARAM.ALIGN, query.align);
  if (!isSameList(query.regions, STATIC_QUERY_DEFAULTS.regions)) {
    params.set(QUERY_PARAM.REGIONS, query.regions.join(LIST_SEPARATOR));
  }
  if (!isSameList(query.unions, STATIC_QUERY_DEFAULTS.unions)) {
    params.set(QUERY_PARAM.UNIONS, query.unions.join(LIST_SEPARATOR));
  }
  if (!isSameList(query.grades, STATIC_QUERY_DEFAULTS.grades)) {
    params.set(QUERY_PARAM.GRADES, query.grades.join(LIST_SEPARATOR));
  }
  if (query.metric !== STATIC_QUERY_DEFAULTS.metric) params.set(QUERY_PARAM.METRIC, query.metric);
  if (query.groupBy !== STATIC_QUERY_DEFAULTS.groupBy) params.set(QUERY_PARAM.GROUP_BY, query.groupBy);
  if (query.granularity !== STATIC_QUERY_DEFAULTS.granularity) {
    params.set(QUERY_PARAM.GRANULARITY, query.granularity);
  }
  if (query.compare !== STATIC_QUERY_DEFAULTS.compare) params.set(QUERY_PARAM.COMPARE, query.compare);
  if (query.commonUnitsOnly !== STATIC_QUERY_DEFAULTS.commonUnitsOnly) {
    params.set(QUERY_PARAM.COMMON_UNITS, query.commonUnitsOnly ? "1" : "0");
  }
  return params;
};
