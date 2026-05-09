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

describe("generateSeasonReport — gradeAnalysis", () => {
  it("등급별 가중평균 단가를 올바르게 계산한다", () => {
    /** grade1: 10kg×100,000 + 10kg×200,000 → 총량 20kg, 가중평균 150,000 */
    const data = [
      createMockWeeklyPriceDatum({ gradeKey: "grade1", quantityKg: 10, unitPriceWon: 100000 }),
      createMockWeeklyPriceDatum({ gradeKey: "grade1", quantityKg: 10, unitPriceWon: 200000 }),
      createMockWeeklyPriceDatum({ gradeKey: "grade2", quantityKg: 5,  unitPriceWon: 80000 }),
    ];

    const report = generateSeasonReport(data, ["grade1", "grade2"]);
    const g1 = report.gradeAnalysis.find((g) => g.gradeKey === "grade1")!;
    const g2 = report.gradeAnalysis.find((g) => g.gradeKey === "grade2")!;

    expect(g1.avgPrice).toBe(150000);
    expect(g1.totalQuantity).toBe(20);
    expect(g2.avgPrice).toBe(80000);
    expect(g2.totalQuantity).toBe(5);
  });

  it("selectedGrades에 데이터 없는 등급이 포함되면 avgPrice=0, totalQuantity=0이다", () => {
    const data = [
      createMockWeeklyPriceDatum({ gradeKey: "grade1", quantityKg: 10, unitPriceWon: 100000 }),
    ];

    const report = generateSeasonReport(data, ["grade1", "grade2"]);
    const g2 = report.gradeAnalysis.find((g) => g.gradeKey === "grade2")!;

    expect(g2.avgPrice).toBe(0);
    expect(g2.totalQuantity).toBe(0);
    expect(g2.quantityShare).toBe(0);
  });

  it("비교 데이터의 등급별 priceChange를 올바르게 계산한다", () => {
    const current = [
      createMockWeeklyPriceDatum({ gradeKey: "grade1", quantityKg: 10, unitPriceWon: 110000 }),
    ];
    const comparison = [
      createMockWeeklyPriceDatum({ gradeKey: "grade1", quantityKg: 10, unitPriceWon: 100000 }),
    ];

    const report = generateSeasonReport(current, ["grade1"], comparison);
    const g1 = report.gradeAnalysis.find((g) => g.gradeKey === "grade1")!;

    /** (110000-100000)/100000 × 100 = 10.0 */
    expect(g1.priceChange).toBeCloseTo(10.0, 1);
  });
});

describe("generateSeasonReport — volatility", () => {
  it("가격이 모두 동일하면 priceStdDev=0, priceCV=0이다", () => {
    const data = Array.from({ length: 5 }, () =>
      createMockWeeklyPriceDatum({ gradeKey: "grade1", unitPriceWon: 100000 })
    );

    const report = generateSeasonReport(data, ["grade1"]);

    expect(report.volatility.priceStdDev).toBe(0);
    expect(report.volatility.priceCV).toBe(0);
  });

  it("gradeMetrics에 selectedGrades별 변동성이 포함된다", () => {
    /** grade1: 고변동 / grade2: 저변동 */
    const data = [
      createMockWeeklyPriceDatum({ gradeKey: "grade1", unitPriceWon: 50000 }),
      createMockWeeklyPriceDatum({ gradeKey: "grade1", unitPriceWon: 300000 }),
      createMockWeeklyPriceDatum({ gradeKey: "grade2", unitPriceWon: 100000 }),
      createMockWeeklyPriceDatum({ gradeKey: "grade2", unitPriceWon: 105000 }),
    ];

    const report = generateSeasonReport(data, ["grade1", "grade2"]);

    expect(report.volatility.gradeMetrics).toHaveLength(2);
    expect(report.volatility.volatileGrade).toBe("grade1");
    expect(report.volatility.stableGrade).toBe("grade2");
  });

  it("데이터 없는 등급은 gradeMetrics에서 제외된다", () => {
    const data = [
      createMockWeeklyPriceDatum({ gradeKey: "grade1", unitPriceWon: 100000 }),
    ];

    const report = generateSeasonReport(data, ["grade1", "grade2"]);

    expect(report.volatility.gradeMetrics).toHaveLength(1);
    expect(report.volatility.gradeMetrics[0].gradeKey).toBe("grade1");
  });
});
