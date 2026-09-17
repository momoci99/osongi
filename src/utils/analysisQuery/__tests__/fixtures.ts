import type { AuctionRecord } from "../../database";
import type { AnalysisQuery, GradeKey, GradeRow } from "../types";

/** 테스트용 등급 행 생성 */
export const makeRow = (
  date: string,
  overrides: Partial<Omit<GradeRow, "date" | "year" | "monthDay" | "amount">> & {
    grade?: GradeKey;
  } = {},
): GradeRow => {
  const quantity = overrides.quantity ?? 1;
  const unitPrice = overrides.unitPrice ?? 100;
  return {
    date,
    year: Number(date.slice(0, 4)),
    monthDay: date.slice(5),
    region: overrides.region ?? "강원",
    union: overrides.union ?? "양양",
    grade: overrides.grade ?? "grade1",
    quantity,
    unitPrice,
    amount: quantity * unitPrice,
  };
};

/** 테스트용 공판 레코드 생성 (모든 등급 0) */
export const makeRecord = (
  date: string,
  overrides: Partial<AuctionRecord> = {},
): AuctionRecord => ({
  date,
  region: "강원",
  union: "양양",
  auctionQuantityUntilYesterday: 0,
  auctionQuantityToday: 0,
  auctionQuantityTotal: 0,
  auctionAmountUntilYesterday: 0,
  auctionAmountToday: 0,
  auctionAmountTotal: 0,
  grade1Quantity: 0,
  grade1UnitPrice: 0,
  grade2Quantity: 0,
  grade2UnitPrice: 0,
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

/** 테스트용 기본 쿼리 */
export const makeQuery = (overrides: Partial<AnalysisQuery> = {}): AnalysisQuery => ({
  view: "timeline",
  time: { kind: "seasons", years: [2024] },
  align: "calendar",
  regions: [],
  unions: [],
  grades: [],
  metric: "unitPrice",
  groupBy: "none",
  granularity: "day",
  compare: "none",
  commonUnitsOnly: false,
  ...overrides,
});
