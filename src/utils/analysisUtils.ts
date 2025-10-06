import type { MushroomAuctionDataRaw, WeeklyPriceDatum } from "../types/data";
import type { AuctionRecord } from "./database";
import {
  MUSHROOM_SEASON,
  DEFAULT_DATE_RANGE,
  DATE_CONSTANTS,
  PARSING,
} from "../const/Numbers";

// 필터 상태 타입 정의
export interface AnalysisFilters {
  region: string; // 단일 지역 선택
  union: string;
  grades: string[];
  startDate: Date;
  endDate: Date;
}

// AuctionRecord를 기존 MushroomAuctionDataRaw 형태로 변환하는 함수
export function convertAuctionRecordToRaw(
  record: AuctionRecord
): MushroomAuctionDataRaw {
  return {
    region: record.region,
    union: record.union,
    date: record.date,
    lastUpdated: record.lastUpdated,
    auctionQuantity: {
      untilYesterday: record.auctionQuantityUntilYesterday.toString(),
      today: record.auctionQuantityToday.toString(),
      total: record.auctionQuantityTotal.toString(),
    },
    auctionAmount: {
      untilYesterday: record.auctionAmountUntilYesterday.toString(),
      today: record.auctionAmountToday.toString(),
      total: record.auctionAmountTotal.toString(),
    },
    grade1: {
      quantity: record.grade1Quantity.toString(),
      unitPrice: record.grade1UnitPrice.toString(),
    },
    grade2: {
      quantity: record.grade2Quantity.toString(),
      unitPrice: record.grade2UnitPrice.toString(),
    },
    grade3Stopped: {
      quantity: record.grade3StoppedQuantity.toString(),
      unitPrice: record.grade3StoppedUnitPrice.toString(),
    },
    grade3Estimated: {
      quantity: record.grade3EstimatedQuantity.toString(),
      unitPrice: record.grade3EstimatedUnitPrice.toString(),
    },
    gradeBelow: {
      quantity: record.gradeBelowQuantity.toString(),
      unitPrice: record.gradeBelowUnitPrice.toString(),
    },
    mixedGrade: {
      quantity: record.mixedGradeQuantity.toString(),
      unitPrice: record.mixedGradeUnitPrice.toString(),
    },
  };
}

// 유틸리티 함수: 송이버섯 시즌 기본 날짜 범위
export function getDefaultDateRange(): { startDate: Date; endDate: Date } {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + DATE_CONSTANTS.MONTH_OFFSET;

  // 현재가 송이버섯 시즌이면 최근 N일
  if (
    currentMonth >= MUSHROOM_SEASON.START_MONTH &&
    currentMonth <= MUSHROOM_SEASON.END_MONTH
  ) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - DEFAULT_DATE_RANGE.DAYS_OFFSET);
    return { startDate, endDate };
  }

  // 송이버섯 시즌이 아니면 작년 10월 일주일로 설정
  const lastYear = currentYear - DATE_CONSTANTS.MONTH_OFFSET;
  const startDate = new Date(
    lastYear,
    DEFAULT_DATE_RANGE.FALLBACK_MONTH,
    DEFAULT_DATE_RANGE.FALLBACK_START_DAY
  );
  const endDate = new Date(
    lastYear,
    DEFAULT_DATE_RANGE.FALLBACK_MONTH,
    DEFAULT_DATE_RANGE.FALLBACK_END_DAY
  );
  return { startDate, endDate };
}

// 날짜 범위 생성 함수 (startDate부터 endDate까지의 모든 날짜)
export function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + DATE_CONSTANTS.DATE_INCREMENT);
  }

  return dates;
}

// 송이버섯 시즌 확인 함수
export function isMushroomSeason(date: Date): boolean {
  const month = date.getMonth() + DATE_CONSTANTS.MONTH_OFFSET;
  return (
    month >= MUSHROOM_SEASON.START_MONTH && month <= MUSHROOM_SEASON.END_MONTH
  );
}

// 단일 날짜 데이터 로드 함수 (HTTP)
export async function loadDateData(
  date: Date
): Promise<MushroomAuctionDataRaw[]> {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  // 송이버섯 시즌이 아니면 빈 배열 반환
  if (!isMushroomSeason(date)) {
    return [];
  }

  try {
    const response = await fetch(`/auction-data/${year}/${month}/${day}.json`);

    if (!response.ok) {
      console.warn(`데이터 없음: ${year}-${month}-${day}`);
      return [];
    }

    const data: MushroomAuctionDataRaw[] = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`데이터 로드 실패: ${year}-${month}-${day}`, error);
    return [];
  }
}

// 필터 적용 함수
export function applyFilters(
  data: MushroomAuctionDataRaw[],
  filters: AnalysisFilters
): MushroomAuctionDataRaw[] {
  return data.filter((record) => {
    // 지역 필터 (단일 선택)
    if (filters.region && record.region !== filters.region) {
      return false;
    }

    // 조합 필터
    if (filters.union && record.union !== filters.union) {
      return false;
    }

    // 날짜 필터 (기본적으로 로드 시 적용되지만 추가 안전장치)
    if (record.date) {
      const recordDate = new Date(record.date);
      if (recordDate < filters.startDate || recordDate > filters.endDate) {
        return false;
      }
    }

    return true;
  });
}

// 차트 데이터 변환 함수
export function transformToChartData(
  data: MushroomAuctionDataRaw[],
  selectedGrades: string[]
): WeeklyPriceDatum[] {
  // 데이터를 날짜-지역-조합별로 그룹화
  const grouped = new Map<string, MushroomAuctionDataRaw>();

  data.forEach((record) => {
    const key = `${record.date}-${record.region}-${record.union}`;
    grouped.set(key, record);
  });

  // 차트 데이터 생성
  const chartData: WeeklyPriceDatum[] = [];

  grouped.forEach((record) => {
    selectedGrades.forEach((gradeKey) => {
      const gradeData = record[gradeKey as keyof MushroomAuctionDataRaw] as {
        quantity: string;
        unitPrice: string;
      };

      if (gradeData && gradeData.quantity && gradeData.unitPrice) {
        // 수량과 가격 파싱
        const quantity = parseFloat(gradeData.quantity.replace(/,/g, "")) || 0;
        const unitPrice =
          parseFloat(gradeData.unitPrice.replace(/,/g, "")) || 0;

        // 유효한 데이터만 추가
        if (
          quantity > PARSING.MIN_VALID_VALUE &&
          unitPrice > PARSING.MIN_VALID_VALUE &&
          record.date
        ) {
          chartData.push({
            date: record.date,
            region: record.region,
            union: record.union,
            gradeKey: gradeKey,
            quantityKg: quantity,
            unitPriceWon: unitPrice,
          });
        }
      }
    });
  });

  // 날짜를 Date 객체로 변환하여 시간순 정렬 (차트의 x축과 일치)
  return chartData.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
}
