import { aggregateRows, resolveAxis } from "./aggregate";
import { buildNormalBand, pickNormalYears } from "./normalBand";
import {
  findCommonUnits,
  findSeasonStarts,
  listYears,
  selectByPlaceAndGrade,
  selectByTime,
} from "./rows";
import { summarizeRows } from "./summary";
import type { AnalysisQuery, AnalysisResult, AnalysisTime, GradeRow } from "./types";

/** 조합 목록으로 행을 제한한다 */
const restrictUnions = (rows: GradeRow[], unions: string[]): GradeRow[] => {
  const unionSet = new Set(unions);
  return rows.filter((row) => unionSet.has(row.union));
};

/** 시간 범위를 연 단위로 이동한다 (전년 비교용) */
export const shiftTimeByYears = (time: AnalysisTime, years: number): AnalysisTime => {
  if (time.kind === "seasons") {
    return { kind: "seasons", years: time.years.map((year) => year + years) };
  }
  const shift = (date: string) => `${Number(date.slice(0, 4)) + years}${date.slice(4)}`;
  return { kind: "range", start: shift(time.start), end: shift(time.end) };
};

/**
 * 분석 쿼리를 실행한다.
 * 1. 지역·조합·등급 필터 → 2. 시간 필터 → 3. (선택) 공통 조합 제한
 * → 4. 시즌 시작일 → 5. 집계 → 6. 요약 → 7. (선택) 평년 밴드
 */
export const runAnalysisQuery = (
  allRows: GradeRow[],
  query: AnalysisQuery,
): AnalysisResult => {
  const scoped = selectByPlaceAndGrade(allRows, query);
  let timed = selectByTime(scoped, query.time);

  const needsDenominator = query.metric === "gradeShare";
  const scopedAllGrades = needsDenominator
    ? selectByPlaceAndGrade(allRows, { ...query, grades: [] })
    : scoped;
  let timedAllGrades = needsDenominator
    ? selectByTime(scopedAllGrades, query.time)
    : timed;

  const includedUnions = query.commonUnitsOnly
    ? findCommonUnits(timed)
    : [...new Set(timed.map((row) => row.union))].sort();

  if (query.commonUnitsOnly) {
    timed = restrictUnions(timed, includedUnions);
    timedAllGrades = restrictUnions(timedAllGrades, includedUnions);
  }

  const seasonStarts = findSeasonStarts(timed);
  const axis = resolveAxis(query);
  const aggregateOptions = {
    axis,
    groupBy: query.groupBy,
    granularity: query.granularity,
    metric: query.metric,
    seasonStarts,
  };

  const series = aggregateRows(timed, aggregateOptions, timedAllGrades);
  const summary = summarizeRows(timed);

  if (query.compare !== "normal") {
    return {
      axis,
      series,
      summary,
      seasonStarts,
      normalBand: null,
      normalYears: [],
      includedUnions,
      rows: timed,
    };
  }

  const baselineRows = query.commonUnitsOnly
    ? restrictUnions(scoped, includedUnions)
    : scoped;
  const baselineDenominators = query.commonUnitsOnly
    ? restrictUnions(scopedAllGrades, includedUnions)
    : scopedAllGrades;
  const normalYears = pickNormalYears(listYears(baselineRows), listYears(timed));

  return {
    axis,
    series,
    summary,
    seasonStarts,
    normalBand: buildNormalBand(
      baselineRows,
      normalYears,
      {
        axis,
        granularity: query.granularity,
        metric: query.metric,
      },
      baselineDenominators,
    ),
    normalYears,
    includedUnions,
    rows: timed,
  };
};
