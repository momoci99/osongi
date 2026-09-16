import { describe, expect, it } from "vitest";
import { buildLineChartModel, nearestPosition } from "../lineChartModel";
import { runAnalysisQuery } from "../runQuery";
import { makeQuery, makeRow } from "./fixtures";

describe("buildLineChartModel", () => {
  const rows = [
    makeRow("2022-09-07", { unitPrice: 300_000 }),
    makeRow("2023-09-11", { unitPrice: 400_000 }),
    makeRow("2024-09-19", { unitPrice: 500_000 }),
    makeRow("2024-09-20", { unitPrice: 600_000 }),
    makeRow("2024-09-30", { unitPrice: 700_000 }),
  ];

  it("시즌별 겹침은 최근 시즌이 focus, 나머지는 오래될수록 흐린 context", () => {
    const query = makeQuery({
      view: "overlay",
      align: "seasonDay",
      groupBy: "year",
      time: { kind: "seasons", years: [2022, 2023, 2024] },
    });
    const model = buildLineChartModel(runAnalysisQuery(rows, query), query);
    const byKey = Object.fromEntries(model.series.map((series) => [series.key, series]));

    expect(byKey["2024"].role).toBe("focus");
    expect(byKey["2022"].role).toBe("context");
    expect(byKey["2022"].opacity).toBeLessThan(byKey["2023"].opacity);
  });

  it("긴 공백에서 선을 끊는다 (누계는 예외)", () => {
    const query = makeQuery({ view: "timeline", time: { kind: "seasons", years: [2024] } });
    const model = buildLineChartModel(runAnalysisQuery(rows, query), query);
    expect(model.series[0].segments).toHaveLength(2);

    const cumulative = { ...query, metric: "cumQuantity" as const };
    const cumModel = buildLineChartModel(runAnalysisQuery(rows, cumulative), cumulative);
    expect(cumModel.series[0].segments).toHaveLength(1);
  });

  it("단가 축은 0을 포함하지 않고, 물량 축은 0부터", () => {
    const query = makeQuery({ view: "timeline", time: { kind: "seasons", years: [2024] } });
    const priceModel = buildLineChartModel(runAnalysisQuery(rows, query), query);
    expect(priceModel.yDomain[0]).toBeGreaterThan(0);

    const quantity = { ...query, metric: "quantity" as const };
    expect(buildLineChartModel(runAnalysisQuery(rows, quantity), quantity).yDomain[0]).toBe(0);
  });

  it("묶기가 시즌이 아니면 entity 역할", () => {
    const query = makeQuery({ view: "timeline", groupBy: "grade", time: { kind: "seasons", years: [2024] } });
    const model = buildLineChartModel(runAnalysisQuery(rows, query), query);
    expect(model.series.every((series) => series.role === "entity")).toBe(true);
  });
});

describe("nearestPosition", () => {
  it("가장 가까운 위치를 이진 탐색으로 찾는다", () => {
    expect(nearestPosition([1, 5, 9], 6.9)).toBe(5);
    expect(nearestPosition([1, 5, 9], 7.1)).toBe(9);
    expect(nearestPosition([1, 5, 9], -3)).toBe(1);
    expect(nearestPosition([], 3)).toBeNull();
  });
});
