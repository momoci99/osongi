import { describe, expect, it } from "vitest";
import { buildRankModel } from "../rankModel";
import { runAnalysisQuery, shiftTimeByYears } from "../runQuery";
import { makeQuery, makeRow } from "./fixtures";

describe("buildRankModel", () => {
  const rows = [
    makeRow("2024-09-20", { union: "양양", region: "강원", quantity: 1, unitPrice: 500_000 }),
    makeRow("2024-09-21", { union: "양양", region: "강원", quantity: 1, unitPrice: 700_000 }),
    makeRow("2024-09-20", { union: "봉화", region: "경북", quantity: 2, unitPrice: 400_000 }),
    makeRow("2023-09-20", { union: "양양", region: "강원", quantity: 1, unitPrice: 400_000 }),
  ];
  const query = makeQuery({
    view: "rank",
    groupBy: "union",
    granularity: "season",
    compare: "prevYear",
    time: { kind: "seasons", years: [2024] },
  });

  it("기간 전체 가중 단가로 큰 순 정렬하고 지역을 붙인다", () => {
    const items = buildRankModel(runAnalysisQuery(rows, query), query, null);
    expect(items.map((item) => [item.key, item.value, item.region])).toEqual([
      ["양양", 600_000, "강원"],
      ["봉화", 400_000, "경북"],
    ]);
  });

  it("전년 결과가 있으면 변화율을 계산한다 (없는 키는 null)", () => {
    const comparison = runAnalysisQuery(rows, { ...query, time: shiftTimeByYears(query.time, -1) });
    const items = buildRankModel(runAnalysisQuery(rows, query), query, comparison);
    expect(items[0]).toMatchObject({ previous: 400_000, change: 0.5 });
    expect(items[1]).toMatchObject({ previous: null, change: null });
  });

  it("등급 묶기는 한국어 라벨", () => {
    const gradeQuery = { ...query, groupBy: "grade" as const, compare: "none" as const };
    expect(buildRankModel(runAnalysisQuery(rows, gradeQuery), gradeQuery, null)[0].label).toBe("1등품");
  });
});
