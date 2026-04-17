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
      const recordDate = new Date(record.date);
      if (!isDateInRange(recordDate, filters.startDate, filters.endDate)) {
        return false;
      }
    }

    return true;
  });
};
