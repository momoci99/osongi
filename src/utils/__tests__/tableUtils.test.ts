import { describe, it, expect } from "vitest";
import {
  getGradeName,
  formatNumber,
  formatPrice,
  transformToTableData,
} from "../tableUtils";
import { createMockAuctionRecord, SAMPLE_GRADES, SAMPLE_ALL_GRADES } from "./fixtures";

/** getGradeName */
describe("getGradeName", () => {
  it.each([
    ["grade1", "1등품"],
    ["grade2", "2등품"],
    ["grade3Stopped", "3등품(생장정지)"],
    ["grade3Estimated", "3등품(개산)"],
    ["gradeBelow", "등외품"],
    ["mixedGrade", "혼합품"],
  ])("%s → %s 한글명을 반환한다", (key, expected) => {
    expect(getGradeName(key)).toBe(expected);
  });

  it("미지 키는 키 자체를 반환한다", () => {
    expect(getGradeName("unknownGrade")).toBe("unknownGrade");
  });
});

/** formatNumber */
describe("formatNumber", () => {
  it("천단위 구분자를 추가한다", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
  });

  it("0을 포맷팅한다", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("1000 미만은 구분자 없이 반환한다", () => {
    expect(formatNumber(999)).toBe("999");
  });
});

/** formatPrice */
describe("formatPrice", () => {
  it('"N원" 형식으로 반환한다', () => {
    expect(formatPrice(100000)).toBe("100,000원");
  });

  it("0원을 포맷팅한다", () => {
    expect(formatPrice(0)).toBe("0원");
  });

  it("큰 금액도 올바르게 포맷팅한다", () => {
    expect(formatPrice(1500000)).toBe("1,500,000원");
  });
});

/** transformToTableData */
describe("transformToTableData", () => {
  it("날짜 내림차순으로 정렬한다", () => {
    const data = [
      createMockAuctionRecord({ date: "2024-10-01", grade1: { quantity: "10", unitPrice: "100,000" } }),
      createMockAuctionRecord({ date: "2024-10-03", grade1: { quantity: "5", unitPrice: "90,000" } }),
      createMockAuctionRecord({ date: "2024-10-02", grade1: { quantity: "8", unitPrice: "95,000" } }),
    ];
    const result = transformToTableData(data, ["grade1"]);
    expect(result[0].date).toBe("2024-10-03");
    expect(result[1].date).toBe("2024-10-02");
    expect(result[2].date).toBe("2024-10-01");
  });

  it("같은 날짜면 등급 순서로 정렬한다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        grade2: { quantity: "20", unitPrice: "50,000" },
        grade1: { quantity: "10", unitPrice: "100,000" },
      }),
    ];
    const result = transformToTableData(data, SAMPLE_GRADES);
    expect(result[0].grade).toBe("grade1");
    expect(result[1].grade).toBe("grade2");
  });

  it("수량과 단가가 모두 0이면 제외한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "0", unitPrice: "0" },
        grade2: { quantity: "10", unitPrice: "50,000" },
      }),
    ];
    const result = transformToTableData(data, SAMPLE_GRADES);
    expect(result).toHaveLength(1);
    expect(result[0].grade).toBe("grade2");
  });

  it("콤마 포함 문자열을 파싱한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "1,000", unitPrice: "100,000" },
      }),
    ];
    const result = transformToTableData(data, ["grade1"]);
    expect(result[0].quantity).toBe(1000);
    expect(result[0].unitPrice).toBe(100000);
  });

  it("빈 데이터면 빈 배열을 반환한다", () => {
    const result = transformToTableData([], SAMPLE_GRADES);
    expect(result).toHaveLength(0);
  });

  it("올바른 id를 생성한다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        region: "강원",
        union: "양양군산림조합",
        grade1: { quantity: "10", unitPrice: "100,000" },
      }),
    ];
    const result = transformToTableData(data, ["grade1"]);
    expect(result[0].id).toBe("2024-10-01-강원-양양군산림조합-grade1");
  });

  it("gradeName을 올바르게 설정한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "10", unitPrice: "100,000" },
      }),
    ];
    const result = transformToTableData(data, ["grade1"]);
    expect(result[0].gradeName).toBe("1등품");
  });

  it("date가 없으면 '날짜 미상'으로 표시한다", () => {
    const data = [
      createMockAuctionRecord({
        date: undefined,
        grade1: { quantity: "10", unitPrice: "100,000" },
      }),
    ];
    const result = transformToTableData(data, ["grade1"]);
    expect(result[0].date).toBe("날짜 미상");
  });
});
