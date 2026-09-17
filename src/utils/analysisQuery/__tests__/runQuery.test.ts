import { describe, expect, it } from "vitest";
import { runAnalysisQuery, shiftTimeByYears } from "../runQuery";
import { makeQuery, makeRow } from "./fixtures";

describe("runAnalysisQuery", () => {
  it("시즌 시작일은 지역 필터 적용 후 기준이다 (M3)", () => {
    const rows = [
      makeRow("2024-09-19", { region: "강원", union: "양양" }),
      makeRow("2024-10-01", { region: "경북", union: "봉화" }),
    ];
    const result = runAnalysisQuery(
      rows,
      makeQuery({ view: "overlay", align: "seasonDay", regions: ["경북"] }),
    );
    expect(result.seasonStarts).toEqual({ 2024: "2024-10-01" });
    expect(result.series[0].points[0].x).toBe(1);
  });

  it("공통 조합만 모드는 모든 선택 시즌에 있는 조합으로 제한한다", () => {
    const rows = [
      makeRow("2023-09-10", { union: "양양", quantity: 1 }),
      makeRow("2023-09-10", { union: "울진", quantity: 10 }),
      makeRow("2024-09-10", { union: "양양", quantity: 2 }),
    ];
    const result = runAnalysisQuery(
      rows,
      makeQuery({
        time: { kind: "seasons", years: [2023, 2024] },
        metric: "quantity",
        commonUnitsOnly: true,
      }),
    );
    expect(result.includedUnions).toEqual(["양양"]);
    expect(result.summary.quantity).toBe(3);
  });

  it("평년은 선택 시즌을 빼고 같은 필터로 계산한다", () => {
    const rows = [
      makeRow("2021-09-06", { unitPrice: 100 }),
      makeRow("2022-09-07", { unitPrice: 200 }),
      makeRow("2023-09-11", { unitPrice: 300 }),
      makeRow("2023-09-11", { unitPrice: 999, region: "경북", union: "봉화" }),
      makeRow("2024-09-19", { unitPrice: 1000 }),
    ];
    const result = runAnalysisQuery(
      rows,
      makeQuery({
        view: "overlay",
        align: "seasonDay",
        groupBy: "year",
        regions: ["강원"],
        compare: "normal",
      }),
    );
    expect(result.normalYears).toEqual([2021, 2022, 2023]);
    expect(result.normalBand).toEqual([{ x: 1, lower: 150, median: 200, upper: 250, seasons: 3 }]);
  });

  it("비교가 평년이 아니면 밴드가 없다", () => {
    const result = runAnalysisQuery([makeRow("2024-09-19")], makeQuery());
    expect(result.normalBand).toBeNull();
    expect(result.summary.tradingDays).toBe(1);
    expect(result.summary.lowSample).toBe(true);
  });

  it("등급 비중은 등급 필터 전 수량을 분모로 쓴다", () => {
    const rows = [
      makeRow("2024-09-19", { grade: "grade1", quantity: 1 }),
      makeRow("2024-09-19", { grade: "gradeBelow", quantity: 3 }),
    ];
    const result = runAnalysisQuery(
      rows,
      makeQuery({ metric: "gradeShare", grades: ["grade1"] }),
    );
    expect(result.series[0].points[0].value).toBe(0.25);
  });
});

describe("shiftTimeByYears", () => {
  it("시즌과 기간을 모두 이동한다", () => {
    expect(shiftTimeByYears({ kind: "seasons", years: [2025, 2026] }, -1)).toEqual({
      kind: "seasons",
      years: [2024, 2025],
    });
    expect(
      shiftTimeByYears({ kind: "range", start: "2026-09-01", end: "2026-09-30" }, -1),
    ).toEqual({ kind: "range", start: "2025-09-01", end: "2025-09-30" });
  });
});
