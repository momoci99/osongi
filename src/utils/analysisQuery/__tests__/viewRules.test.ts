import { describe, expect, it } from "vitest";
import { ANALYSIS_TEMPLATES } from "../templates";
import { coerceQueryToView, VIEW_RULES } from "../viewRules";
import { makeQuery } from "./fixtures";

describe("coerceQueryToView", () => {
  it("허용되지 않는 값은 뷰 기본값으로 보정한다", () => {
    const query = makeQuery({ groupBy: "union", granularity: "season", compare: "prevYear" });
    expect(coerceQueryToView(query, "overlay")).toMatchObject({
      view: "overlay",
      groupBy: "year",
      granularity: "day",
      compare: "none",
    });
  });

  it("허용되는 값은 유지한다", () => {
    const query = makeQuery({ metric: "cumQuantity", commonUnitsOnly: true });
    expect(coerceQueryToView(query, "overlay")).toMatchObject({
      metric: "cumQuantity",
      commonUnitsOnly: true,
    });
  });

  it("공통 조합 토글이 없는 뷰는 끈다", () => {
    expect(coerceQueryToView(makeQuery({ commonUnitsOnly: true }), "rank").commonUnitsOnly).toBe(false);
  });

  it("모든 템플릿 쿼리는 자기 뷰 규칙을 이미 만족한다", () => {
    const context = { availableYears: [2024, 2025, 2026], inSeason: true };
    for (const template of ANALYSIS_TEMPLATES) {
      const query = template.build(context);
      expect(coerceQueryToView(query, query.view)).toEqual(query);
      expect(VIEW_RULES[query.view]).toBeDefined();
    }
  });
});
