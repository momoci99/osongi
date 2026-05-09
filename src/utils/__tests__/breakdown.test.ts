import { describe, it, expect } from "vitest";
import { calculateGradeBreakdown } from "../analysis/breakdown";
import { createMockAuctionRecord } from "./fixtures";

describe("calculateGradeBreakdown", () => {
  it("빈 데이터면 빈 배열을 반환한다", () => {
    expect(calculateGradeBreakdown([], ["grade1"])).toEqual([]);
  });

  it("quantity=0인 레코드는 결과에서 제외된다", () => {
    const data = [
      createMockAuctionRecord({ grade1: { quantity: "0", unitPrice: "100,000" } }),
    ];
    expect(calculateGradeBreakdown(data, ["grade1"])).toHaveLength(0);
  });

  it("등급별 quantity와 amount를 올바르게 집계한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "10", unitPrice: "100,000" },
        grade2: { quantity: "20", unitPrice: "50,000" },
      }),
      createMockAuctionRecord({
        grade1: { quantity: "5", unitPrice: "200,000" },
        grade2: { quantity: "0", unitPrice: "50,000" },
      }),
    ];

    const result = calculateGradeBreakdown(data, ["grade1", "grade2"]);

    const g1 = result.find((r) => r.gradeKey === "grade1")!;
    const g2 = result.find((r) => r.gradeKey === "grade2")!;

    expect(g1.quantity).toBe(15);
    expect(g1.amount).toBe(10 * 100000 + 5 * 200000); // 2,000,000
    expect(g2.quantity).toBe(20);
    expect(g2.amount).toBe(20 * 50000); // 1,000,000
  });

  it("quantityRatio 합산이 1이다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "30", unitPrice: "100,000" },
        grade2: { quantity: "70", unitPrice: "50,000" },
      }),
    ];

    const result = calculateGradeBreakdown(data, ["grade1", "grade2"]);
    const total = result.reduce((s, r) => s + r.quantityRatio, 0);

    expect(total).toBeCloseTo(1, 10);
  });

  it("amountRatio 합산이 1이다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "10", unitPrice: "200,000" },
        grade2: { quantity: "10", unitPrice: "100,000" },
      }),
    ];

    const result = calculateGradeBreakdown(data, ["grade1", "grade2"]);
    const total = result.reduce((s, r) => s + r.amountRatio, 0);

    expect(total).toBeCloseTo(1, 10);
  });

  it("selectedGrades에 없는 등급은 결과에 포함되지 않는다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "10", unitPrice: "100,000" },
        grade2: { quantity: "20", unitPrice: "50,000" },
      }),
    ];

    const result = calculateGradeBreakdown(data, ["grade1"]);

    expect(result).toHaveLength(1);
    expect(result[0].gradeKey).toBe("grade1");
  });

  it("단일 등급이면 quantityRatio=1, amountRatio=1이다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "50", unitPrice: "150,000" },
        grade2: { quantity: "0", unitPrice: "50,000" },
      }),
    ];

    const result = calculateGradeBreakdown(data, ["grade1", "grade2"]);

    expect(result).toHaveLength(1);
    expect(result[0].quantityRatio).toBe(1);
    expect(result[0].amountRatio).toBe(1);
  });

  it("쉼표 포함 숫자 문자열을 올바르게 파싱한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "1,000", unitPrice: "1,000,000" },
      }),
    ];

    const result = calculateGradeBreakdown(data, ["grade1"]);

    expect(result[0].quantity).toBe(1000);
    expect(result[0].amount).toBe(1000 * 1000000);
  });
});
