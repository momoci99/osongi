import type { MushroomAuctionDataRaw } from "../../types/data";
import { isDateInRange } from "./dateRange";

/**
 * 분석 필터 상태 타입
 */
export type AnalysisFilters = {
  regions: string[];
  unions: string[];
  grades: string[];
  startDate: Date;
  endDate: Date;
  comparisonEnabled: boolean;
  comparisonStartDate: Date | null;
  comparisonEndDate: Date | null;
};

/** "2013-9-26" 처럼 zero-pad 없는 날짜 문자열을 "2013-09-26" 형식으로 정규화한다. */
const normalizeDate = (dateStr: string): string =>
  dateStr.replace(/(\d{4})-(\d{1,2})-(\d{1,2})/, (_, y, m, d) =>
    `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  );

/**
 * 필터를 적용한다.
 */
export const applyFilters = (
  data: MushroomAuctionDataRaw[],
  filters: AnalysisFilters
): MushroomAuctionDataRaw[] => {
  return data.filter((record) => {
    if (filters.regions.length > 0 && !filters.regions.includes(record.region)) {
      return false;
    }

    if (filters.unions.length > 0 && !filters.unions.includes(record.union)) {
      return false;
    }

    if (record.date) {
      const recordDate = new Date(normalizeDate(record.date));
      if (!isDateInRange(recordDate, filters.startDate, filters.endDate)) {
        return false;
      }
    }

    return true;
  });
};
