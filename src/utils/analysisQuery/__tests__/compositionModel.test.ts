import { describe, expect, it } from "vitest";
import { buildCompositionModel } from "../compositionModel";
import { runAnalysisQuery } from "../runQuery";
import { makeQuery, makeRow } from "./fixtures";

describe("buildCompositionModel", () => {
  it("구간별로 등급 고정 순서로 쌓고 합이 1", () => {
    const rows = [
      makeRow("2024-09-20", { grade: "gradeBelow", quantity: 3 }),
      makeRow("2024-09-20", { grade: "grade1", quantity: 1 }),
      makeRow("2023-09-20", { grade: "grade2", quantity: 2 }),
    ];
    const query = makeQuery({
      view: "composition",
      metric: "gradeShare",
      groupBy: "grade",
      granularity: "season",
      time: { kind: "seasons", years: [2023, 2024] },
    });
    const columns = buildCompositionModel(runAnalysisQuery(rows, query));

    expect(columns.map((column) => column.year)).toEqual([2023, 2024]);
    expect(columns[1].segments.map((segment) => [segment.grade, segment.share, segment.offset])).toEqual([
      ["grade1", 0.25, 0],
      ["gradeBelow", 0.75, 0.25],
    ]);
  });
});
