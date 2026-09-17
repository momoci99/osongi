import { describe, expect, it } from "vitest";
import { buildRelationModel } from "../relationModel";
import { runAnalysisQuery } from "../runQuery";
import { makeQuery, makeRow } from "./fixtures";

describe("buildRelationModel", () => {
  it("날짜와 조합별로 수량 가중 단가를 계산한다", () => {
    const rows = [
      makeRow("2024-09-10", { union: "양양", grade: "grade1", quantity: 2, unitPrice: 100 }),
      makeRow("2024-09-10", { union: "양양", grade: "grade2", quantity: 1, unitPrice: 400 }),
      makeRow("2024-09-10", { union: "강릉", quantity: 4, unitPrice: 200 }),
    ];
    const query = makeQuery({ view: "relation", groupBy: "region" });
    const model = buildRelationModel(runAnalysisQuery(rows, query), query);
    const point = model.points.find((item) => item.union === "양양");

    expect(point).toMatchObject({
      key: "2024-09-10|양양",
      label: "양양 · 2024-09-10",
      quantity: 3,
      unitPrice: 200,
      records: 1,
      seriesKey: "강원",
    });
    expect(model.xDomain).toEqual([3, 4]);
    expect(model.enoughPoints).toBe(false);
  });

  it("시즌 단위는 연도와 조합별로 합치고 공판일을 센다", () => {
    const rows = [
      makeRow("2023-09-10", { quantity: 2 }),
      makeRow("2023-09-11", { quantity: 3 }),
      makeRow("2024-09-12", { quantity: 5 }),
    ];
    const query = makeQuery({
      view: "relation",
      granularity: "season",
      groupBy: "year",
      time: { kind: "seasons", years: [2023, 2024] },
    });
    const model = buildRelationModel(runAnalysisQuery(rows, query), query);

    expect(model.points.map((point) => point.key)).toEqual(["2023|양양", "2024|양양"]);
    expect(model.points[0]).toMatchObject({ quantity: 5, records: 2, seriesKey: "2023" });
  });

  it("최소 열 점부터 관계 판단에 충분하다고 본다", () => {
    const rows = Array.from({ length: 10 }, (_, index) =>
      makeRow(`2024-09-${String(index + 1).padStart(2, "0")}`, { quantity: index + 1 }),
    );
    const query = makeQuery({ view: "relation" });

    expect(buildRelationModel(runAnalysisQuery(rows, query), query).enoughPoints).toBe(true);
  });
});
