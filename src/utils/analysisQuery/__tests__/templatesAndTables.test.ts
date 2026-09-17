import { describe, expect, it } from "vitest";
import { buildCoverage, buildSeasonSummaries } from "../seasonTables";
import {
  ANALYSIS_TEMPLATES,
  buildTemplateQuery,
  findMatchingTemplateId,
  getDefaultTemplateId,
} from "../templates";
import { makeRow } from "./fixtures";

const context = {
  availableYears: Array.from({ length: 14 }, (_, i) => 2013 + i),
  inSeason: true,
};

describe("질문 템플릿", () => {
  it("시즌 중이면 올해 vs 평년, 비시즌이면 전 시즌 히트맵이 기본", () => {
    expect(getDefaultTemplateId(context)).toBe("thisYearVsNormal");
    expect(getDefaultTemplateId({ ...context, inSeason: false })).toBe("allSeasonsHeatmap");
  });

  it("올해 vs 평년은 최신 시즌·1등품·평년 비교", () => {
    const query = buildTemplateQuery("thisYearVsNormal", context);
    expect(query.time).toEqual({ kind: "seasons", years: [2026] });
    expect(query).toMatchObject({ grades: ["grade1"], compare: "normal", align: "seasonDay" });
  });

  it("누계 페이스는 최근 6개 시즌", () => {
    const query = buildTemplateQuery("cumulativePace", context);
    expect(query.time).toEqual({ kind: "seasons", years: [2021, 2022, 2023, 2024, 2025, 2026] });
  });

  it("모든 템플릿은 자기 자신과 매칭되고, 수정하면 매칭이 풀린다", () => {
    for (const template of ANALYSIS_TEMPLATES) {
      const query = template.build(context);
      expect(findMatchingTemplateId(query, context)).toBe(template.id);
      expect(findMatchingTemplateId({ ...query, commonUnitsOnly: true }, context)).toBeNull();
    }
  });
});

describe("시즌 요약·커버리지", () => {
  const rows = [
    makeRow("2024-09-19", { quantity: 1, unitPrice: 100 }),
    makeRow("2024-09-20", { quantity: 5, unitPrice: 200 }),
    makeRow("2024-09-20", { quantity: 2, unitPrice: 200, union: "강릉" }),
    makeRow("2023-09-11", { quantity: 3, unitPrice: 300, region: "경북", union: "울진" }),
  ];

  it("시즌별 개시·종료·피크·가중 단가", () => {
    const summaries = buildSeasonSummaries(rows);
    expect(summaries.map((s) => s.year)).toEqual([2023, 2024]);
    expect(summaries[1]).toMatchObject({
      firstDate: "2024-09-19",
      lastDate: "2024-09-20",
      tradingDays: 2,
      peakDate: "2024-09-20",
      peakQuantity: 7,
      quantity: 8,
      unions: 2,
    });
    expect(summaries[1].unitPrice).toBeCloseTo(1500 / 8);
  });

  it("조합 × 시즌 공판일 수", () => {
    const coverage = buildCoverage(rows);
    expect(coverage.years).toEqual([2023, 2024]);
    expect(coverage.unions[0]).toEqual({ region: "강원", union: "강릉" });
    expect(coverage.cells.find((c) => c.union === "양양" && c.year === 2024)?.tradingDays).toBe(2);
  });
});
