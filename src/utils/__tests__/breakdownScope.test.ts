import { describe, it, expect } from "vitest";
import { resolveBreakdownScope, tradedUnionsOf } from "../breakdownScope";
import type { DailyDataType } from "../../types/DailyData";

const grade = (unitPriceWon: number) => [
  { gradeKey: "grade1", quantityKg: 10, unitPriceWon },
];

const dayComparison = {
  previousDate: "2026-10-04",
  gradeChanges: [
    {
      gradeKey: "grade1",
      currentPrice: 300000,
      previousPrice: 280000,
      changePercent: 7.1,
    },
  ],
};

const latestDaily = {
  regionGradeBreakdown: { 경북: grade(300000) },
  unionGradeBreakdown: { 봉화: grade(420000), 울진: grade(380000) },
  previousDayComparison: dayComparison,
} as unknown as DailyDataType["latestDaily"];

describe("resolveBreakdownScope", () => {
  it("지역이 없으면 표를 그리지 않는다", () => {
    expect(resolveBreakdownScope(latestDaily, null, null)).toBeNull();
  });

  it("조합을 고르지 않으면 지역 시세와 전일 대비를 쓴다", () => {
    expect(resolveBreakdownScope(latestDaily, "경북", null)).toEqual({
      label: "경북",
      rows: grade(300000),
      dayComparison,
    });
  });

  it("조합을 고르면 그 조합 시세를 쓰고 전국 기준 전일 대비는 뺀다", () => {
    expect(resolveBreakdownScope(latestDaily, "경북", "봉화")).toEqual({
      label: "봉화 조합",
      rows: grade(420000),
      dayComparison: null,
    });
  });

  it("고른 조합에 거래가 없으면 빈 표로 안내한다", () => {
    expect(resolveBreakdownScope(latestDaily, "경북", "청송")?.rows).toEqual([]);
  });

  it("다른 지역 조합이 남아 있으면 지역 시세로 돌아간다", () => {
    expect(resolveBreakdownScope(latestDaily, "경북", "홍천")?.label).toBe("경북");
  });

  it("지역에 거래가 없으면 표를 숨긴다", () => {
    expect(resolveBreakdownScope(latestDaily, "강원", null)).toBeNull();
  });
});

describe("tradedUnionsOf", () => {
  it("거래가 있었던 조합 이름을 돌려준다", () => {
    expect(tradedUnionsOf(latestDaily)).toEqual(["봉화", "울진"]);
  });

  it("조합 집계가 없는 옛 매니페스트면 빈 목록", () => {
    expect(
      tradedUnionsOf({} as DailyDataType["latestDaily"]),
    ).toEqual([]);
  });
});
