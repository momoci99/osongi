import { describe, expect, it } from "vitest";
import { buildHeatmapModel } from "../heatmapModel";
import { runAnalysisQuery } from "../runQuery";
import { makeQuery, makeRow } from "./fixtures";

describe("buildHeatmapModel", () => {
  const rows = [
    makeRow("2023-09-11", { quantity: 2 }),
    makeRow("2023-09-15", { quantity: 4 }),
    makeRow("2024-09-12", { quantity: 8 }),
  ];

  it("최근 시즌이 위, 열은 도메인 전체를 빈틈 없이 센다", () => {
    const query = makeQuery({
      view: "heatmap",
      groupBy: "year",
      metric: "quantity",
      time: { kind: "seasons", years: [2023, 2024] },
    });
    const model = buildHeatmapModel(runAnalysisQuery(rows, query), query);

    expect(model.rows.map((row) => row.key)).toEqual(["2024", "2023"]);
    expect(model.columnCount).toBe(5);
    expect(model.cells.find((cell) => cell.rowKey === "2024")?.column).toBe(1);
    expect(model.valueDomain).toEqual([2, 8]);
  });

  it("주 단위는 7일 칸", () => {
    const query = makeQuery({
      view: "heatmap",
      groupBy: "year",
      metric: "quantity",
      granularity: "week",
      align: "seasonDay",
      time: { kind: "seasons", years: [2023] },
    });
    const weekRows = [makeRow("2023-09-11"), makeRow("2023-09-30")];
    const model = buildHeatmapModel(runAnalysisQuery(weekRows, query), query);

    expect(model.columnCount).toBe(3);
    expect(model.columnPosition(2)).toBe(15);
  });
});
