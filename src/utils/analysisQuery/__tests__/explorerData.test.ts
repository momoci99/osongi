import { describe, expect, it } from "vitest";
import { computeExplorerData, computeExplorerMeta } from "../explorerData";
import { makeQuery, makeRow } from "./fixtures";

const rows = [
  makeRow("2023-09-20", { union: "양양", region: "강원" }),
  makeRow("2024-09-20", { union: "양양", region: "강원" }),
  makeRow("2024-09-20", { union: "봉화", region: "경북", grade: "grade2" }),
];

describe("computeExplorerMeta", () => {
  it("연도·최신일·공판 건수", () => {
    expect(computeExplorerMeta(rows)).toEqual({
      availableYears: [2023, 2024],
      latestDate: "2024-09-20",
      recordCount: 3,
    });
  });
});

describe("computeExplorerData", () => {
  it("원본 행은 넘기지 않고 행 수만 남긴다", () => {
    const data = computeExplorerData(rows, makeQuery({ time: { kind: "seasons", years: [2024] } }));
    expect(data.result).not.toHaveProperty("rows");
    expect(data.result.rowCount).toBe(2);
    expect(data.scopeUnionCount).toBe(2);
    expect(data.dailyQuantity.get("2023-09-20")).toBe(1);
  });

  it("뷰에 필요한 모델만 미리 만든다", () => {
    const rank = computeExplorerData(
      rows,
      makeQuery({ view: "rank", groupBy: "union", granularity: "season", compare: "prevYear", time: { kind: "seasons", years: [2024] } }),
    );
    expect(rank.rankItems?.map((item) => item.key)).toEqual(["양양", "봉화"]);
    expect(rank.comparison?.rowCount).toBe(1);
    expect(rank.relation).toBeNull();

    const summary = computeExplorerData(
      rows,
      makeQuery({ view: "table", groupBy: "year", granularity: "season", time: { kind: "seasons", years: [2023, 2024] } }),
    );
    expect(summary.seasonSummaries).toHaveLength(2);
    expect(summary.coverage).toBeNull();
  });
});
