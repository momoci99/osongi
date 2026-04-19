import * as d3 from "d3";
import type { WeeklyPriceDatum } from "../../../types/data";
import {
  getGradeDashPattern,
  getGradeColorArray,
} from "../../../utils/chartUtils";
import type { Theme } from "@mui/material/styles";
import { MUSHROOM_SEASON, DATE_CONSTANTS } from "../../../const/Numbers";

export type ChartMode = "price" | "quantity";

export type ChartLayout = "subplot" | "overlay";

/** 등급 우선순위 정렬 기준 */
export const GRADE_ORDER = [
  "grade1",
  "grade2",
  "grade3Stopped",
  "grade3Estimated",
  "gradeBelow",
  "mixedGrade",
] as const;

export type AnalysisSeries = {
  region: string;
  gradeKey: string;
  data: WeeklyPriceDatum[];
  color: string;
  dashPattern: string;
};

export type LegendItem = {
  region: string;
  gradeKey: string;
  color: string;
  dashPattern: string;
};

/**
 * 송이버섯 시즌(8~12월) 데이터만 필터링합니다.
 */
export const filterMushroomSeason = (
  data: WeeklyPriceDatum[],
): WeeklyPriceDatum[] =>
  data.filter((d) => {
    const month = new Date(d.date).getMonth() + DATE_CONSTANTS.MONTH_OFFSET;
    return (
      month >= MUSHROOM_SEASON.START_MONTH && month <= MUSHROOM_SEASON.END_MONTH
    );
  });

/**
 * 연도별로 데이터를 그룹화합니다.
 */
export const groupByYear = (
  data: WeeklyPriceDatum[],
): Map<number, WeeklyPriceDatum[]> => {
  const groups = new Map<number, WeeklyPriceDatum[]>();
  data.forEach((d) => {
    const year = new Date(d.date).getFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(d);
  });
  return groups;
};

/**
 * 등급 키를 우선순위에 따라 정렬합니다.
 */
export const sortGradeKeys = (grades: string[]): string[] =>
  [...grades].sort((a, b) => {
    const indexA = GRADE_ORDER.indexOf(a as (typeof GRADE_ORDER)[number]);
    const indexB = GRADE_ORDER.indexOf(b as (typeof GRADE_ORDER)[number]);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

/**
 * 등급 색상 스케일을 생성합니다.
 */
export const buildColorScale = (
  data: WeeklyPriceDatum[],
  theme: Theme,
): d3.ScaleOrdinal<string, string> => {
  const uniqueGrades = Array.from(
    new Set(data.map((d) => d.gradeKey).filter(Boolean)),
  );
  const sortedGrades = sortGradeKeys(uniqueGrades);
  return d3
    .scaleOrdinal<string>()
    .domain(sortedGrades)
    .range(getGradeColorArray(theme));
};

/**
 * Y값 접근자를 반환합니다.
 */
export const getYAccessor = (
  mode: ChartMode,
): ((d: WeeklyPriceDatum) => number) =>
  mode === "price" ? (d) => d.unitPriceWon : (d) => d.quantityKg;

/**
 * 차트 데이터에서 고유 시리즈(지역-등급 조합) 수를 계산합니다.
 */
export const countUniqueSeries = (data: WeeklyPriceDatum[]): number =>
  new Set(data.map((d) => `${d.region}-${d.gradeKey}`)).size;

/**
 * 연도 내 데이터를 지역/등급별 시리즈로 변환합니다.
 */
export const buildYearSeries = (
  yearData: WeeklyPriceDatum[],
  colorScale: d3.ScaleOrdinal<string, string>,
): AnalysisSeries[] => {
  const seriesMap = new Map<string, AnalysisSeries>();

  yearData.forEach((d) => {
    if (!d.region || !d.gradeKey) return;
    const key = `${d.region}-${d.gradeKey}`;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        region: d.region,
        gradeKey: d.gradeKey,
        data: [],
        color: colorScale(d.gradeKey),
        dashPattern: getGradeDashPattern(d.gradeKey),
      });
    }
    seriesMap.get(key)!.data.push(d);
  });

  seriesMap.forEach((series) => {
    series.data.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  });

  return Array.from(seriesMap.values());
};

/**
 * 범례 항목을 지역/등급 우선순위로 정렬하여 수집합니다.
 */
export const collectLegendItems = (
  yearGroups: Map<number, WeeklyPriceDatum[]>,
  colorScale: d3.ScaleOrdinal<string, string>,
): LegendItem[] => {
  const itemMap = new Map<string, LegendItem>();

  yearGroups.forEach((yearData) => {
    yearData.forEach((d) => {
      if (!d.region || !d.gradeKey) return;
      const key = `${d.region}-${d.gradeKey}`;
      if (!itemMap.has(key)) {
        itemMap.set(key, {
          region: d.region,
          gradeKey: d.gradeKey,
          color: colorScale(d.gradeKey),
          dashPattern: getGradeDashPattern(d.gradeKey),
        });
      }
    });
  });

  return Array.from(itemMap.values()).sort((a, b) => {
    if (a.region !== b.region) return a.region.localeCompare(b.region);
    const indexA = GRADE_ORDER.indexOf(
      a.gradeKey as (typeof GRADE_ORDER)[number],
    );
    const indexB = GRADE_ORDER.indexOf(
      b.gradeKey as (typeof GRADE_ORDER)[number],
    );
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
};

/** 오버레이 모드용 정규화 데이터 */
export type NormalizedDatum = WeeklyPriceDatum & { normalizedDate: Date };

export type OverlaySeries = {
  year: number;
  region: string;
  gradeKey: string;
  data: NormalizedDatum[];
  color: string;
  dashPattern: string;
  seriesKey: string;
};

/** 날짜의 월-일을 기준년(2000)으로 정규화합니다. */
export const normalizeToBaseYear = (dateStr: string): Date => {
  const d = new Date(dateStr);
  return new Date(2000, d.getMonth(), d.getDate());
};

/** 연도별 색상 팔레트 */
export const YEAR_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

/**
 * 오버레이 모드용 시리즈를 생성합니다.
 * 색상은 연도별, 대시 패턴은 등급별로 구분합니다.
 */
export const buildOverlayYearSeries = (
  normalizedData: NormalizedDatum[],
  year: number,
  yearColorScale: d3.ScaleOrdinal<number, string>,
): OverlaySeries[] => {
  const seriesMap = new Map<string, OverlaySeries>();

  normalizedData.forEach((d) => {
    if (!d.region || !d.gradeKey) return;
    const key = `${year}-${d.region}-${d.gradeKey}`;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        year,
        region: d.region,
        gradeKey: d.gradeKey,
        data: [],
        color: yearColorScale(year),
        dashPattern: getGradeDashPattern(d.gradeKey),
        seriesKey: key,
      });
    }
    seriesMap.get(key)!.data.push(d);
  });

  seriesMap.forEach((s) => {
    s.data.sort(
      (a, b) => a.normalizedDate.getTime() - b.normalizedDate.getTime(),
    );
  });

  return Array.from(seriesMap.values());
};
