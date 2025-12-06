import type { MushroomAuctionDataRaw } from "../types/data";
import type { AuctionRecord } from "./database";
import { dataLoader } from "./dataLoader";
import {
  convertAuctionRecordToRaw,
  generateDateRange,
  isMushroomSeason,
  loadDateData,
} from "./analysisUtils";
import { DATE_CONSTANTS } from "../const/Numbers";

// 날짜 범위의 모든 데이터 로드 (IndexedDB 사용)
export async function loadDateRangeData(
  startDate: Date,
  endDate: Date
): Promise<MushroomAuctionDataRaw[]> {
  const startDateStr = startDate.toISOString().split("T")[
    DATE_CONSTANTS.ISO_DATE_PART_INDEX
  ]; // YYYY-MM-DD
  const endDateStr = endDate.toISOString().split("T")[
    DATE_CONSTANTS.ISO_DATE_PART_INDEX
  ];

  try {
    // IndexedDB에서 날짜 범위 쿼리
    const auctionRecords = await dataLoader.queryByDateRange({
      startDate: startDateStr,
      endDate: endDateStr,
    });

    // 송이버섯 시즌 필터링
    const seasonFilteredRecords = auctionRecords.filter(
      (record: AuctionRecord) => {
        const recordDate = new Date(record.date);
        return isMushroomSeason(recordDate);
      }
    );

    // AuctionRecord를 MushroomAuctionDataRaw 형태로 변환
    const rawData = seasonFilteredRecords.map(convertAuctionRecordToRaw);

    return rawData;
  } catch (error) {
    console.error("IndexedDB 데이터 로드 실패:", error);
    // 폴백: 기존 HTTP 방식으로 시도
    console.log("📡 HTTP 폴백 모드로 전환...");
    return loadDateRangeDataHTTP(startDate, endDate);
  }
}

// 기존 HTTP 방식 (폴백용)
export async function loadDateRangeDataHTTP(
  startDate: Date,
  endDate: Date
): Promise<MushroomAuctionDataRaw[]> {
  const dates = generateDateRange(startDate, endDate);
  const promises = dates.map((date) => loadDateData(date));
  const results = await Promise.all(promises);
  const allData = results.flat();
  return allData;
}
