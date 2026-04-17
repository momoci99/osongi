import * as d3 from "d3";
import type { WeeklyPriceDatum } from "../../../types/data";

export type ParsedPriceQuantityDatum = WeeklyPriceDatum & {
  parsedDate: Date;
};

export type PriceQuantityPoint = {
  date: Date;
  price: number;
  quantity: number;
  originalDate: string;
  gradeKey: string;
};

export type PriceQuantitySeries = {
  gradeKey: string;
  color: string;
  points: PriceQuantityPoint[];
};

/**
 * 원본 데이터를 Date 파싱된 형태로 변환합니다.
 */
export const parsePriceQuantityData = (
  data: WeeklyPriceDatum[],
): ParsedPriceQuantityDatum[] => {
  const dateFormat = d3.timeParse("%Y-%m-%d");

  return data
    .map((datum) => {
      const parsedDate = dateFormat(datum.date);
      if (!parsedDate) return null;
      return { ...datum, parsedDate };
    })
    .filter((datum): datum is ParsedPriceQuantityDatum => datum !== null);
};

/**
 * 정렬된 고유 날짜 문자열 목록을 반환합니다.
 */
export const getSortedDates = (data: ParsedPriceQuantityDatum[]): string[] =>
  Array.from(new Set(data.map((d) => d.date))).sort();

/**
 * 정렬된 등급 키 목록을 반환합니다.
 */
export const getSortedGradeKeys = (
  data: ParsedPriceQuantityDatum[],
): string[] => Array.from(new Set(data.map((d) => d.gradeKey))).sort();

/**
 * 등급별 시리즈를 생성합니다. 비어있는 등급은 제외됩니다.
 */
export const buildPriceQuantitySeries = (
  data: ParsedPriceQuantityDatum[],
  dates: string[],
  gradeKeys: string[],
  colors: string[],
): PriceQuantitySeries[] => {
  const colorScale = d3.scaleOrdinal<string>().domain(gradeKeys).range(colors);

  return gradeKeys
    .map((gradeKey) => {
      const points = dates
        .map((date) => {
          const point = data.find(
            (d) => d.date === date && d.gradeKey === gradeKey,
          );
          if (!point) return null;
          return {
            date: point.parsedDate,
            price: point.unitPriceWon,
            quantity: point.quantityKg,
            originalDate: date,
            gradeKey,
          };
        })
        .filter((p): p is PriceQuantityPoint => p !== null);

      return { gradeKey, color: colorScale(gradeKey), points };
    })
    .filter((s) => s.points.length > 0);
};
