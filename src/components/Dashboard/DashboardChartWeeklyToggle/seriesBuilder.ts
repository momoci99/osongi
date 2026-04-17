import * as d3 from "d3";
import type { WeeklyPriceDatum } from "../../../types/data";

export type ChartMode = "price" | "quantity";

export type ParsedWeeklyPriceDatum = WeeklyPriceDatum & {
  parsedDate: Date;
};

export type WeeklyTogglePoint = {
  date: Date;
  price: number;
  quantity: number;
  originalDate: string;
  gradeKey: string;
};

export type WeeklyToggleSeries = {
  gradeKey: string;
  color: string;
  points: WeeklyTogglePoint[];
};

/**
 * 주간 차트 원본 데이터를 Date 객체를 포함한 형태로 변환합니다.
 */
export const parseWeeklyData = (
  data: WeeklyPriceDatum[]
): ParsedWeeklyPriceDatum[] => {
  const dateFormat = d3.timeParse("%Y-%m-%d");

  return data
    .map((datum) => {
      const parsedDate = dateFormat(datum.date);

      if (!parsedDate) {
        return null;
      }

      return {
        ...datum,
        parsedDate,
      };
    })
    .filter((datum): datum is ParsedWeeklyPriceDatum => datum !== null);
};

/**
 * 데이터에서 실제로 존재하는 날짜 목록을 오름차순으로 정렬합니다.
 */
export const getSortedUniqueDates = (
  data: ParsedWeeklyPriceDatum[]
): Date[] =>
  Array.from(new Set(data.map((datum) => datum.parsedDate.getTime())))
    .map((time) => new Date(time))
    .sort((left, right) => left.getTime() - right.getTime());

/**
 * 등급 키 목록을 정렬된 상태로 반환합니다.
 */
export const getSortedGradeKeys = (
  data: ParsedWeeklyPriceDatum[]
): string[] => Array.from(new Set(data.map((datum) => datum.gradeKey))).sort();

/**
 * 날짜와 등급 기준으로 선형 차트용 시리즈를 생성합니다.
 */
export const buildWeeklySeries = (
  data: ParsedWeeklyPriceDatum[],
  gradeKeys: string[],
  colors: readonly string[]
): WeeklyToggleSeries[] => {
  const colorScale = d3.scaleOrdinal<string, string>().domain(gradeKeys).range(colors);

  return gradeKeys
    .map((gradeKey) => {
      const points = data
        .filter((datum) => datum.gradeKey === gradeKey)
        .sort((left, right) => left.parsedDate.getTime() - right.parsedDate.getTime())
        .map((datum) => ({
          date: datum.parsedDate,
          price: datum.unitPriceWon,
          quantity: datum.quantityKg,
          originalDate: datum.date,
          gradeKey: datum.gradeKey,
        }));

      if (points.length === 0) {
        return null;
      }

      return {
        gradeKey,
        color: colorScale(gradeKey),
        points,
      };
    })
    .filter((series): series is WeeklyToggleSeries => series !== null);
};

/**
 * 현재 모드에 맞는 y축 최대값을 계산합니다.
 */
export const getYMaxByMode = (
  data: ParsedWeeklyPriceDatum[],
  chartMode: ChartMode
): number =>
  chartMode === "price"
    ? d3.max(data, (datum) => datum.unitPriceWon) || 0
    : d3.max(data, (datum) => datum.quantityKg) || 0;

export default {
  parseWeeklyData,
  getSortedUniqueDates,
  getSortedGradeKeys,
  buildWeeklySeries,
  getYMaxByMode,
};
