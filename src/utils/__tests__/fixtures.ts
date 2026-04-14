import type { MushroomAuctionDataRaw, WeeklyPriceDatum } from "../../types/data";
import type { AuctionRecord } from "../database";

// 기본 등급 데이터
const DEFAULT_GRADE = { quantity: "0", unitPrice: "0" };

// 기본 공판량/금액 데이터
const DEFAULT_AUCTION = { untilYesterday: "0", today: "0", total: "0" };

// MushroomAuctionDataRaw 팩토리
export const createMockAuctionRecord = (
  overrides?: Partial<MushroomAuctionDataRaw>
): MushroomAuctionDataRaw => ({
  region: "강원",
  union: "양양군산림조합",
  date: "2024-10-01",
  lastUpdated: "2024-10-01T10:00:00",
  auctionQuantity: { ...DEFAULT_AUCTION },
  auctionAmount: { ...DEFAULT_AUCTION },
  grade1: { quantity: "10", unitPrice: "100,000" },
  grade2: { quantity: "20", unitPrice: "50,000" },
  grade3Stopped: { ...DEFAULT_GRADE },
  grade3Estimated: { ...DEFAULT_GRADE },
  gradeBelow: { ...DEFAULT_GRADE },
  mixedGrade: { ...DEFAULT_GRADE },
  ...overrides,
});

// WeeklyPriceDatum 팩토리
export const createMockWeeklyPriceDatum = (
  overrides?: Partial<WeeklyPriceDatum>
): WeeklyPriceDatum => ({
  date: "2024-10-01",
  gradeKey: "grade1",
  quantityKg: 10,
  unitPriceWon: 100000,
  region: "강원",
  union: "양양군산림조합",
  ...overrides,
});

// AuctionRecord (DB 포맷) 팩토리
export const createMockAuctionDBRecord = (
  overrides?: Partial<AuctionRecord>
): AuctionRecord => ({
  date: "2024-10-01",
  region: "강원",
  union: "양양군산림조합",
  lastUpdated: "2024-10-01T10:00:00",
  auctionQuantityUntilYesterday: 0,
  auctionQuantityToday: 100,
  auctionQuantityTotal: 100,
  auctionAmountUntilYesterday: 0,
  auctionAmountToday: 5000000,
  auctionAmountTotal: 5000000,
  grade1Quantity: 10,
  grade1UnitPrice: 100000,
  grade2Quantity: 20,
  grade2UnitPrice: 50000,
  grade3StoppedQuantity: 0,
  grade3StoppedUnitPrice: 0,
  grade3EstimatedQuantity: 0,
  grade3EstimatedUnitPrice: 0,
  gradeBelowQuantity: 0,
  gradeBelowUnitPrice: 0,
  mixedGradeQuantity: 0,
  mixedGradeUnitPrice: 0,
  ...overrides,
});

// 테스트용 등급 키 목록
export const SAMPLE_GRADES = ["grade1", "grade2"];

export const SAMPLE_ALL_GRADES = [
  "grade1",
  "grade2",
  "grade3Stopped",
  "grade3Estimated",
  "gradeBelow",
  "mixedGrade",
];
