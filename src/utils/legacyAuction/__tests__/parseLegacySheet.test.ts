import { describe, expect, it } from "vitest";
import { normalizeLabel, parseLegacyNumber, parseLegacySheet } from "../parseLegacySheet";
import { SAMPLE_SHEET_ROWS } from "./fixtures";

describe("parseLegacyNumber", () => {
  it("콤마와 공백을 걷어 숫자로 읽는다", () => {
    expect(parseLegacyNumber(" 1,234.56 ")).toBe(1234.56);
  });

  it("'-' 는 0, 빈 칸은 null", () => {
    expect(parseLegacyNumber(" -   ")).toBe(0);
    expect(parseLegacyNumber("")).toBeNull();
    expect(parseLegacyNumber(null)).toBeNull();
  });

  it("숫자가 아니면 null", () => {
    expect(parseLegacyNumber("소계")).toBeNull();
  });
});

describe("normalizeLabel", () => {
  it("글자 사이 공백까지 지운다", () => {
    expect(normalizeLabel(" 강  원 ")).toBe("강원");
  });
});

describe("parseLegacySheet", () => {
  const sheet = parseLegacySheet(SAMPLE_SHEET_ROWS)!;

  it("머리글에서 연도·날짜·단가 기준을 읽는다", () => {
    expect(sheet.titleYear).toBe(2009);
    expect(sheet.headerDate).toBe("2009-09-25");
    expect(sheet.priceBasis).toBe("max");
  });

  it("계·소계·조합 행을 나눈다", () => {
    expect(sheet.total?.quantity.total).toBe(110);
    expect(sheet.subtotals.map((row) => row.region)).toEqual(["강원"]);
    expect(sheet.unions.map((row) => `${row.region}/${row.union}`)).toEqual(["강원/인제", "강원/고성"]);
  });

  it("등급별 수량·단가를 현행 등급 키로 옮긴다", () => {
    const inje = sheet.unions[0];
    expect(inje.grades.grade1).toEqual({ quantity: 2, unitPrice: 200000 });
    expect(inje.grades.grade3Stopped).toEqual({ quantity: null, unitPrice: null });
    expect(inje.grades.grade3Estimated).toEqual({ quantity: 5, unitPrice: 80000 });
  });

  it("평균가격 행에서 멈춘다", () => {
    expect(sheet.unions).toHaveLength(2);
  });

  it("집계표가 아니면 null", () => {
    expect(parseLegacySheet([["결재", "팀장"], ["연도별", "공판실적"]])).toBeNull();
  });

  it("평균 단가 문구를 avg 로 읽는다", () => {
    const rows = SAMPLE_SHEET_ROWS.map((row, index) =>
      index === 1 ? [" (2012. 10. 19) ", null, " ※ 단가는 등급별 낙찰 평균 단가이며, 현지 판매가격이 아님 "] : row,
    );
    expect(parseLegacySheet(rows)?.priceBasis).toBe("avg");
  });
});
