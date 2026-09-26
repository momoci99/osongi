import { describe, expect, it } from "vitest";
import { parseLegacySheet, type LegacySheet } from "../parseLegacySheet";
import { checkLegacyChain, checkLegacySheet, inferPriceBasis } from "../legacyIntegrity";
import { SAMPLE_SHEET_ROWS } from "./fixtures";

const baseSheet = () => parseLegacySheet(SAMPLE_SHEET_ROWS)!;

const codesOf = (sheet: LegacySheet, date = "2009-09-25", basis: "max" | "avg" | null = "max") =>
  checkLegacySheet(sheet, date, basis).map((issue) => issue.code);

describe("checkLegacySheet", () => {
  it("맞는 집계표는 문제 없음", () => {
    expect(codesOf(baseSheet())).toEqual([]);
  });

  it("머리글 날짜가 게시물 날짜와 다르면 header-mismatch", () => {
    expect(codesOf(baseSheet(), "2009-09-26")).toContain("header-mismatch");
  });

  it("전일까지 + 금일 ≠ 누계", () => {
    const sheet = baseSheet();
    sheet.unions[0].quantity.total = 71;
    expect(codesOf(sheet)).toContain("triple-sum");
  });

  it("조합 합이 소계와 다르면 subtotal-sum", () => {
    const sheet = baseSheet();
    sheet.subtotals[0].amount.today = 999;
    expect(codesOf(sheet)).toContain("subtotal-sum");
  });

  it("등급 수량 합이 금일 공판량과 다르면 grade-quantity-sum", () => {
    const sheet = baseSheet();
    sheet.unions[0].grades.grade1.quantity = 4;
    expect(codesOf(sheet)).toContain("grade-quantity-sum");
  });

  it("수량은 있고 단가가 없으면 missing-price", () => {
    const sheet = baseSheet();
    sheet.unions[0].grades.grade2.unitPrice = null;
    expect(codesOf(sheet)).toContain("missing-price");
  });

  it("평균 단가 기준에서 Σ수량×단가가 금일 금액과 크게 다르면 grade-amount", () => {
    expect(codesOf(baseSheet(), "2009-09-25", "avg")).toContain("grade-amount");
    expect(codesOf(baseSheet(), "2009-09-25", "max")).not.toContain("grade-amount");
  });
});

describe("inferPriceBasis", () => {
  it("Σ수량×단가가 금일 금액과 같으면 avg", () => {
    const sheet = baseSheet();
    /** 2×200,000 + 3×150,000 + 5×80,000 = 1,250,000 */
    sheet.unions[0].amount.today = 1250000;
    expect(inferPriceBasis(sheet)).toBe("avg");
  });

  it("뚜렷이 크면 max", () => {
    expect(inferPriceBasis(baseSheet())).toBe("max");
  });

  it("금일 공판 조합이 없으면 null", () => {
    const sheet = baseSheet();
    sheet.unions.forEach((row) => (row.quantity.today = 0));
    expect(inferPriceBasis(sheet)).toBeNull();
  });
});

describe("checkLegacyChain", () => {
  it("전날 누계가 오늘 전일까지로 이어지면 문제 없음", () => {
    const previous = baseSheet();
    const current = baseSheet();
    current.unions[0].quantity.untilYesterday = 70;
    current.unions[0].amount.untilYesterday = 7000000;
    expect(checkLegacyChain(previous, current)).toEqual([]);
  });

  it("끊기면 조합별 chain-break", () => {
    const issues = checkLegacyChain(baseSheet(), baseSheet());
    expect(issues.map((issue) => issue.target)).toEqual(["강원/인제", "강원/인제"]);
    expect(issues.every((issue) => issue.code === "chain-break")).toBe(true);
  });
});
