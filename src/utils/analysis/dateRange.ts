import type { MushroomAuctionDataRaw } from "../../types/data";
import {
  MUSHROOM_SEASON,
  DEFAULT_DATE_RANGE,
  DATE_CONSTANTS,
} from "../../const/Numbers";

/**
 * 송이버섯 시즌 기본 날짜 범위를 반환한다.
 */
export const getDefaultDateRange = (): { startDate: Date; endDate: Date } => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + DATE_CONSTANTS.MONTH_OFFSET;

  if (
    currentMonth >= MUSHROOM_SEASON.START_MONTH &&
    currentMonth <= MUSHROOM_SEASON.END_MONTH
  ) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - DEFAULT_DATE_RANGE.DAYS_OFFSET);
    return { startDate, endDate };
  }

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
};

/**
 * 날짜 범위를 생성한다.
 */
export const generateDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + DATE_CONSTANTS.DATE_INCREMENT);
  }

  return dates;
};

/**
 * 송이버섯 시즌인지 확인한다.
 */
export const isMushroomSeason = (date: Date): boolean => {
  const month = date.getMonth() + DATE_CONSTANTS.MONTH_OFFSET;
  return (
    month >= MUSHROOM_SEASON.START_MONTH && month <= MUSHROOM_SEASON.END_MONTH
  );
};

/**
 * 날짜만 남긴 Date 객체를 반환한다.
 */
export const getDateOnly = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * 두 날짜가 같은 날인지 확인한다.
 */
export const isSameDate = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * 날짜가 범위 내에 있는지 확인한다.
 */
export const isDateInRange = (
  date: Date,
  startDate: Date,
  endDate: Date
): boolean => {
  const dateOnly = getDateOnly(date);
  const startDateOnly = getDateOnly(startDate);
  const endDateOnly = getDateOnly(endDate);
  return dateOnly >= startDateOnly && dateOnly <= endDateOnly;
};

/**
 * 비교 기간을 작년 동기간으로 계산한다.
 */
export const getComparisonDateRange = (
  startDate: Date,
  endDate: Date
): { startDate: Date; endDate: Date } => {
  const compStart = new Date(startDate);
  compStart.setFullYear(compStart.getFullYear() - 1);
  const compEnd = new Date(endDate);
  compEnd.setFullYear(compEnd.getFullYear() - 1);
  return { startDate: compStart, endDate: compEnd };
};

/**
 * 직전 1주 비교 기간을 반환한다. (mainStart 기준 7일 전~1일 전)
 */
export const getPresetLastWeek = (
  startDate: Date
): { startDate: Date; endDate: Date } => {
  const compEnd = new Date(startDate);
  compEnd.setDate(compEnd.getDate() - 1);
  const compStart = new Date(startDate);
  compStart.setDate(compStart.getDate() - 7);
  return { startDate: compStart, endDate: compEnd };
};

/**
 * 시즌 시작부터 비교 기간을 반환한다. (해당 연도 시즌 시작일 ~ mainEndDate)
 */
export const getPresetSeasonStart = (
  startDate: Date,
  endDate: Date
): { startDate: Date; endDate: Date } => {
  const compStart = new Date(
    startDate.getFullYear(),
    MUSHROOM_SEASON.START_MONTH - 1,
    1
  );
  return { startDate: compStart, endDate: new Date(endDate) };
};

/**
 * 단일 날짜 데이터를 HTTP로 로드한다.
 */
export const loadDateData = async (
  date: Date
): Promise<MushroomAuctionDataRaw[]> => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

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
};
