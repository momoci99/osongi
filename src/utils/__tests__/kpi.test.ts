import { describe, it, expect } from "vitest";
import { calculateKPI, calculateKPIComparison } from "../analysisUtils";
import { createMockAuctionRecord } from "./fixtures";

describe("calculateKPI — 변동성 지표", () => {
  it("정상 데이터에서 중앙값·표준편차·변동계수를 올바르게 계산한다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        grade1: { quantity: "1", unitPrice: "100,000" },
      }),
      createMockAuctionRecord({
        date: "2024-10-02",
        grade1: { quantity: "1", unitPrice: "200,000" },
      }),
      createMockAuctionRecord({
        date: "2024-10-03",
        grade1: { quantity: "1", unitPrice: "300,000" },
      }),
    ];

    const kpi = calculateKPI(data, ["grade1"]);

    expect(kpi.avgPrice).toBe(200000);
    expect(kpi.medianPrice).toBe(200000);
    // variance = ((100000-200000)^2 + 0 + (300000-200000)^2) / 3 ≈ 6666666667
    // stdDev ≈ 81650
    expect(kpi.priceStdDev).toBe(81650);
    // CV = 81650 / 200000 * 100 = 40.825 → 40.8
    expect(kpi.priceCV).toBeCloseTo(40.8, 0);
  });

  it("짝수 개 데이터의 중앙값은 두 중간값의 평균이다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        grade1: { quantity: "1", unitPrice: "100,000" },
      }),
      createMockAuctionRecord({
        date: "2024-10-02",
        grade1: { quantity: "1", unitPrice: "300,000" },
      }),
    ];

    const kpi = calculateKPI(data, ["grade1"]);
    expect(kpi.medianPrice).toBe(200000);
  });

  it("단일 데이터 포인트면 stdDev=0, CV=0이다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        grade1: { quantity: "5", unitPrice: "500,000" },
      }),
    ];

    const kpi = calculateKPI(data, ["grade1"]);

    expect(kpi.medianPrice).toBe(500000);
    expect(kpi.priceStdDev).toBe(0);
    expect(kpi.priceCV).toBe(0);
  });

  it("빈 데이터면 모든 지표가 0이다", () => {
    const kpi = calculateKPI([], ["grade1"]);

    expect(kpi.avgPrice).toBe(0);
    expect(kpi.medianPrice).toBe(0);
    expect(kpi.priceStdDev).toBe(0);
    expect(kpi.priceCV).toBe(0);
  });

  it("quantity=0 또는 unitPrice=0인 레코드는 무시한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "0", unitPrice: "500,000" },
      }),
      createMockAuctionRecord({
        grade1: { quantity: "5", unitPrice: "0" },
      }),
    ];

    const kpi = calculateKPI(data, ["grade1"]);
    expect(kpi.medianPrice).toBe(0);
    expect(kpi.priceStdDev).toBe(0);
  });
});

describe("calculateKPIComparison — 신규 필드 포함", () => {
  it("changes에 medianPrice, priceStdDev, priceCV 변동률이 포함된다", () => {
    const current = calculateKPI(
      [createMockAuctionRecord({ grade1: { quantity: "1", unitPrice: "200,000" } })],
      ["grade1"]
    );
    const previous = calculateKPI(
      [createMockAuctionRecord({ grade1: { quantity: "1", unitPrice: "100,000" } })],
      ["grade1"]
    );

    const comparison = calculateKPIComparison(current, previous);

    expect(comparison.changes.medianPrice).toBeCloseTo(100, 0);
    expect(comparison.changes.priceStdDev).toBe(0);
    expect(comparison.changes.priceCV).toBe(0);
  });
});
