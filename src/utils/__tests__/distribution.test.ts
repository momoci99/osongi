import { describe, it, expect } from "vitest";
import { calculatePriceDistribution } from "../analysis/distribution";
import { createMockWeeklyPriceDatum } from "./fixtures";

describe("calculatePriceDistribution", () => {
  it("빈 배열 반환 — 입력 데이터 없음", () => {
    expect(calculatePriceDistribution([])).toEqual([]);
  });

  it("빈 배열 반환 — 유효한 가격 데이터 없음 (unitPriceWon=0)", () => {
    const data = [createMockWeeklyPriceDatum({ unitPriceWon: 0 })];
    expect(calculatePriceDistribution(data)).toEqual([]);
  });

  it("빈 배열 반환 — 모든 가격이 동일한 경우", () => {
    const data = Array.from({ length: 5 }, () =>
      createMockWeeklyPriceDatum({ unitPriceWon: 100000 })
    );
    expect(calculatePriceDistribution(data)).toEqual([]);
  });

  it("Sturges' rule로 bin 수 결정 — n=10 → 5개 bin", () => {
    // ceil(1 + 3.322 * log10(10)) = ceil(4.322) = 5
    const data = Array.from({ length: 10 }, (_, i) =>
      createMockWeeklyPriceDatum({ unitPriceWon: 100000 + i * 50000, gradeKey: "grade1" })
    );
    const result = calculatePriceDistribution(data);
    const uniqueBins = [...new Set(result.map((d) => d.x0))];
    expect(uniqueBins.length).toBe(5);
  });

  it("binCount 파라미터로 bin 수 직접 지정", () => {
    const data = Array.from({ length: 10 }, (_, i) =>
      createMockWeeklyPriceDatum({ unitPriceWon: 100000 + i * 50000, gradeKey: "grade1" })
    );
    const result = calculatePriceDistribution(data, 3);
    const uniqueBins = [...new Set(result.map((d) => d.x0))];
    expect(uniqueBins.length).toBe(3);
  });

  it("단일 등급 count 합산 = 전체 데이터 수", () => {
    const data = Array.from({ length: 20 }, (_, i) =>
      createMockWeeklyPriceDatum({ unitPriceWon: 100000 + i * 30000, gradeKey: "grade1" })
    );
    const result = calculatePriceDistribution(data);
    const total = result
      .filter((b) => b.gradeKey === "grade1")
      .reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(20);
  });

  it("다중 등급이 동일한 bin 경계를 공유한다", () => {
    const grade1Data = Array.from({ length: 5 }, (_, i) =>
      createMockWeeklyPriceDatum({ unitPriceWon: 100000 + i * 100000, gradeKey: "grade1" })
    );
    const grade2Data = Array.from({ length: 5 }, (_, i) =>
      createMockWeeklyPriceDatum({ unitPriceWon: 150000 + i * 100000, gradeKey: "grade2" })
    );
    const result = calculatePriceDistribution([...grade1Data, ...grade2Data]);

    const grade1Bins = result.filter((b) => b.gradeKey === "grade1");
    const grade2Bins = result.filter((b) => b.gradeKey === "grade2");

    expect(grade1Bins.length).toBeGreaterThan(0);
    expect(grade1Bins.length).toBe(grade2Bins.length);

    const grade1Total = grade1Bins.reduce((sum, b) => sum + b.count, 0);
    const grade2Total = grade2Bins.reduce((sum, b) => sum + b.count, 0);
    expect(grade1Total).toBe(5);
    expect(grade2Total).toBe(5);
  });

  it("quantityKg=0 인 레코드는 제외한다", () => {
    const data = [
      createMockWeeklyPriceDatum({ unitPriceWon: 100000, quantityKg: 0 }),
      createMockWeeklyPriceDatum({ unitPriceWon: 200000, quantityKg: 10 }),
      createMockWeeklyPriceDatum({ unitPriceWon: 300000, quantityKg: 5 }),
    ];
    const result = calculatePriceDistribution(data, 2);
    const total = result.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(2);
  });
});
