import type { AuctionRecord } from "../database";
import { MS_PER_DAY } from "../../const/Analysis";
import { GradeKeyToKorean } from "../../const/Common";
import type { AnalysisQuery, AnalysisTime, GradeKey, GradeRow } from "./types";

/** 등급 키 목록 (표시 순서) */
export const GRADE_KEYS = Object.keys(GradeKeyToKorean) as GradeKey[];

/**
 * 공판 레코드를 등급 단위 롱 포맷으로 펼친다.
 * 수량이 0인 등급(무공판일·미거래 등급)은 제외한다.
 */
export const toGradeRows = (records: AuctionRecord[]): GradeRow[] => {
  const rows: GradeRow[] = [];

  for (const record of records) {
    const year = Number(record.date.slice(0, 4));
    const monthDay = record.date.slice(5);

    for (const grade of GRADE_KEYS) {
      const quantity = record[`${grade}Quantity`];
      if (!(quantity > 0)) continue;

      const unitPrice = record[`${grade}UnitPrice`];
      rows.push({
        date: record.date,
        year,
        monthDay,
        region: record.region,
        union: record.union,
        grade,
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
      });
    }
  }

  return rows;
};

/** 시간 범위에 포함되는 행인지 */
const isInTime = (row: GradeRow, time: AnalysisTime): boolean =>
  time.kind === "seasons"
    ? time.years.includes(row.year)
    : row.date >= time.start && row.date <= time.end;

/**
 * 지역·조합 범위에 포함되는 행인지.
 * 조합을 지정하면 조합이 우선, 아니면 지역, 둘 다 없으면 전체.
 */
const isInPlace = (
  row: GradeRow,
  regions: string[],
  unions: string[],
): boolean => {
  if (unions.length > 0) return unions.includes(row.union);
  if (regions.length > 0) return regions.includes(row.region);
  return true;
};

/** 등급 범위에 포함되는 행인지. 빈 배열이면 전체 */
const isInGrades = (row: GradeRow, grades: GradeKey[]): boolean =>
  grades.length === 0 || grades.includes(row.grade);

/** 시간을 제외한 지역·조합·등급 필터 */
export const selectByPlaceAndGrade = (
  rows: GradeRow[],
  query: Pick<AnalysisQuery, "regions" | "unions" | "grades">,
): GradeRow[] =>
  rows.filter(
    (row) =>
      isInPlace(row, query.regions, query.unions) &&
      isInGrades(row, query.grades),
  );

/** 시간 필터 */
export const selectByTime = (rows: GradeRow[], time: AnalysisTime): GradeRow[] =>
  rows.filter((row) => isInTime(row, time));

/**
 * 행에 등장하는 모든 시즌(연도)에 공판이 있는 조합만 남긴다.
 * 조합 구성이 해마다 달라 지역 합산 비교가 왜곡되는 것을 막는다.
 */
export const findCommonUnits = (rows: GradeRow[]): string[] => {
  const yearsByUnion = new Map<string, Set<number>>();
  const allYears = new Set<number>();

  for (const row of rows) {
    allYears.add(row.year);
    const years = yearsByUnion.get(row.union) ?? new Set<number>();
    years.add(row.year);
    yearsByUnion.set(row.union, years);
  }

  return [...yearsByUnion.entries()]
    .filter(([, years]) => years.size === allYears.size)
    .map(([union]) => union)
    .sort();
};

/** 연도별 첫 공판일 (M3: 전달된 행 기준) */
export const findSeasonStarts = (rows: GradeRow[]): Record<number, string> => {
  const starts: Record<number, string> = {};
  for (const row of rows) {
    const current = starts[row.year];
    if (!current || row.date < current) starts[row.year] = row.date;
  }
  return starts;
};

/** YYYY-MM-DD 두 날짜의 일수 차이 */
const diffDays = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);

/** 시즌 일차 (첫 공판일 = 1) */
export const toSeasonDay = (date: string, seasonStart: string): number =>
  diffDays(seasonStart, date) + 1;

/** YYYY-MM-DD에 일수를 더한다 */
export const addDays = (date: string, days: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);

/** 행 목록에 등장하는 연도 (오름차순) */
export const listYears = (rows: GradeRow[]): number[] =>
  [...new Set(rows.map((row) => row.year))].sort((a, b) => a - b);
