import { describe, expect, it } from "vitest";
import {
  anomaly,
  climatology,
  correlationPValue,
  laggedWindowSum,
  firstIndexAtOrBelow,
  meanDifference,
  median,
  movingAverage,
  pearson,
  toNumberOrNull,
} from "../seriesStats";

describe("toNumberOrNull", () => {
  it("숫자 문자열은 숫자로, 빈 값은 결측으로", () => {
    expect(toNumberOrNull("25.9")).toBe(25.9);
    expect(toNumberOrNull("0.0")).toBe(0);
    expect(toNumberOrNull("")).toBeNull();
    expect(toNumberOrNull("  ")).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
    expect(toNumberOrNull("abc")).toBeNull();
  });
});

describe("movingAverage", () => {
  it("후행 창 평균", () => {
    expect(movingAverage([1, 2, 3, 4], 2, 1)).toEqual([1, 1.5, 2.5, 3.5]);
  });

  it("창 안 관측값이 부족하면 결측", () => {
    expect(movingAverage([1, null, null, 4], 3, 2)).toEqual([null, null, null, null]);
    expect(movingAverage([1, null, 3, 5], 3, 2)).toEqual([null, null, 2, 4]);
  });
});

describe("pearson", () => {
  it("완전 양·음 상관", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])?.r).toBeCloseTo(1);
    expect(pearson([1, 2, 3], [3, 2, 1])?.r).toBeCloseTo(-1);
  });

  it("양쪽 모두 관측된 짝만 쓴다", () => {
    expect(pearson([1, 2, null, 4], [2, 4, 100, 8])).toEqual({ r: expect.closeTo(1), n: 3 });
  });

  it("표본 부족·분산 0 이면 null", () => {
    expect(pearson([1, 2], [1, 2])).toBeNull();
    expect(pearson([1, 1, 1], [1, 2, 3])).toBeNull();
  });
});

describe("meanDifference", () => {
  it("양쪽 관측일의 평균 차이", () => {
    expect(meanDifference([3, 5, null], [1, 2, 9])).toBe(2.5);
    expect(meanDifference([null], [1])).toBeNull();
  });
});

describe("climatology · anomaly", () => {
  it("일자별로 관측된 연도만 평균하고 편차를 낸다", () => {
    const normal = climatology([
      [10, 20, null],
      [14, null, 6],
    ]);
    expect(normal).toEqual([12, 20, 6]);
    expect(anomaly([13, null, 4], normal)).toEqual([1, null, -2]);
  });
});

describe("firstIndexAtOrBelow", () => {
  it("처음 기준 이하가 되는 인덱스", () => {
    expect(firstIndexAtOrBelow([22, 20, null, 19, 18], 19)).toBe(3);
    expect(firstIndexAtOrBelow([18, 22, 17], 19, 1)).toBe(2);
    expect(firstIndexAtOrBelow([22, 21], 19)).toBeNull();
  });
});

describe("median", () => {
  it("홀수·짝수 개수", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe("climatology 최소 연도", () => {
  it("관측 연도가 minYears 미만인 일자는 결측", () => {
    expect(climatology([[1, 2], [3, null], [5, null]], 3)).toEqual([3, null]);
  });
});

describe("laggedWindowSum", () => {
  it("시차만큼 앞선 창의 합", () => {
    // i=3, lag=1, window=2 → series[1..2]
    expect(laggedWindowSum([1, 2, 3, 4], 2, 1)).toEqual([null, null, 3, 5]);
  });

  it("시차 0 은 당일 포함 후행 합", () => {
    expect(laggedWindowSum([1, 2, 3], 2, 0)).toEqual([null, 3, 5]);
  });

  it("창 안 결측이 있으면 결측", () => {
    expect(laggedWindowSum([1, null, 3, 4], 2, 0)).toEqual([null, null, null, 7]);
  });
});

describe("correlationPValue", () => {
  it("r=0 이면 1, 강한 상관·대표본이면 0 에 가깝다", () => {
    expect(correlationPValue(0, 100)).toBeCloseTo(1, 5);
    expect(correlationPValue(0.3, 1000)).toBeLessThan(1e-10);
  });

  it("알려진 값 근사 (r=0.2, n=100 → 약 0.046)", () => {
    expect(correlationPValue(0.2, 100)).toBeCloseTo(0.046, 2);
  });
});
