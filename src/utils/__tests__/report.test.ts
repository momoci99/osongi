import { describe, expect, it } from "vitest";
import { generateSeasonReport } from "../analysis/report";
import { createMockWeeklyPriceDatum } from "./fixtures";

describe("generateSeasonReport", () => {
  it("summary를 올바르게 계산한다", () => {
    const data = [
      createMockWeeklyPriceDatum({
        date: "2024-10-01",
        gradeKey: "grade1",
        quantityKg: 10,
        unitPriceWon: 100000,
      }),
      createMockWeeklyPriceDatum({
        date: "2024-10-01",
        gradeKey: "grade2",
        quantityKg: 20,
        unitPriceWon: 50000,
      }),
      createMockWeeklyPriceDatum({
        date: "2024-10-02",
        gradeKey: "grade1",
        quantityKg: 10,
        unitPriceWon: 150000,
      }),
    ];

    const report = generateSeasonReport(data, ["grade1", "grade2"]);

    expect(report.period).toEqual({
      start: "2024-10-01",
      end: "2024-10-02",
    });
    expect(report.summary).toEqual({
      totalTradingDays: 2,
      totalQuantityKg: 40,
      totalAmountWon: 3500000,
      avgPricePerKg: 87500,
    });
  });

  it("gradeAnalysis의 quantityShare 합산이 1이다", () => {
    const data = [
      createMockWeeklyPriceDatum({
        gradeKey: "grade1",
        quantityKg: 10,
        unitPriceWon: 100000,
      }),
      createMockWeeklyPriceDatum({
        gradeKey: "grade2",
        quantityKg: 30,
        unitPriceWon: 70000,
      }),
    ];

    const report = generateSeasonReport(data, ["grade1", "grade2"]);
    const totalShare = report.gradeAnalysis.reduce(
      (sum, item) => sum + item.quantityShare,
      0
    );

    expect(totalShare).toBeCloseTo(1, 10);
  });

  it("insights가 비어 있지 않다", () => {
    const data = [
      createMockWeeklyPriceDatum({
        date: "2024-10-01",
        gradeKey: "grade1",
        quantityKg: 10,
        unitPriceWon: 100000,
      }),
      createMockWeeklyPriceDatum({
        date: "2024-10-02",
        gradeKey: "grade1",
        quantityKg: 10,
        unitPriceWon: 120000,
      }),
      createMockWeeklyPriceDatum({
        date: "2024-10-02",
        gradeKey: "grade2",
        quantityKg: 5,
        unitPriceWon: 90000,
        region: "경북",
      }),
    ];

    const report = generateSeasonReport(data, ["grade1", "grade2"]);

    expect(report.insights.length).toBeGreaterThan(0);
  });

  it("comparisonData가 없으면 yoyComparison은 null이다", () => {
    const data = [createMockWeeklyPriceDatum()];

    const report = generateSeasonReport(data, ["grade1"]);

    expect(report.yoyComparison).toBeNull();
    expect(report.gradeAnalysis[0].priceChange).toBeNull();
  });

  it("comparisonData가 있으면 yoyComparison을 계산한다", () => {
    const currentData = [
      createMockWeeklyPriceDatum({
        date: "2024-10-01",
        gradeKey: "grade1",
        quantityKg: 10,
        unitPriceWon: 100000,
      }),
      createMockWeeklyPriceDatum({
        date: "2024-10-02",
        gradeKey: "grade1",
        quantityKg: 10,
        unitPriceWon: 100000,
      }),
    ];
    const comparisonData = [
      createMockWeeklyPriceDatum({
        date: "2023-10-01",
        gradeKey: "grade1",
        quantityKg: 10,
        unitPriceWon: 80000,
      }),
    ];

    const report = generateSeasonReport(
      currentData,
      ["grade1"],
      comparisonData
    );

    expect(report.yoyComparison).not.toBeNull();
    expect(report.yoyComparison?.avgPriceChange).toBeCloseTo(25, 10);
    expect(report.yoyComparison?.quantityChange).toBeCloseTo(100, 10);
    expect(report.yoyComparison?.tradingDaysChange).toBeCloseTo(100, 10);
    expect(report.gradeAnalysis[0].priceChange).toBeCloseTo(25, 10);
  });

  it("빈 데이터면 기본값을 반환한다", () => {
    const report = generateSeasonReport([], ["grade1"]);

    expect(report.period).toEqual({ start: "", end: "" });
    expect(report.summary).toEqual({
      totalTradingDays: 0,
      totalQuantityKg: 0,
      totalAmountWon: 0,
      avgPricePerKg: 0,
    });
    expect(report.priceHighlights).toEqual({
      peakDate: "",
      peakPrice: 0,
      peakGrade: "",
      troughDate: "",
      troughPrice: 0,
      troughGrade: "",
    });
    expect(report.regionAnalysis).toEqual([]);
    expect(report.insights).toEqual([]);
  });
});
