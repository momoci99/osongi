import { describe, expect, it } from "vitest";
import {
  addDays,
  findCommonUnits,
  findSeasonStarts,
  selectByPlaceAndGrade,
  selectByTime,
  toGradeRows,
  toSeasonDay,
} from "../rows";
import { makeRecord, makeRow } from "./fixtures";

describe("toGradeRows", () => {
  it("수량이 있는 등급만 행으로 펼치고 금액을 계산한다", () => {
    const rows = toGradeRows([
      makeRecord("2024-09-20", {
        grade1Quantity: 2,
        grade1UnitPrice: 500_000,
        gradeBelowQuantity: 1.5,
        gradeBelowUnitPrice: 100_000,
      }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      year: 2024,
      monthDay: "09-20",
      grade: "grade1",
      amount: 1_000_000,
    });
    expect(rows[1].grade).toBe("gradeBelow");
  });

  it("무공판일 레코드는 행을 만들지 않는다", () => {
    expect(toGradeRows([makeRecord("2024-09-21")])).toEqual([]);
  });
});

describe("필터", () => {
  const rows = [
    makeRow("2023-09-10", { region: "강원", union: "양양" }),
    makeRow("2024-09-10", { region: "경북", union: "봉화", grade: "grade2" }),
    makeRow("2024-10-01", { region: "경북", union: "울진" }),
  ];

  it("조합을 지정하면 지역보다 우선한다", () => {
    const result = selectByPlaceAndGrade(rows, {
      regions: ["강원"],
      unions: ["봉화"],
      grades: [],
    });
    expect(result.map((row) => row.union)).toEqual(["봉화"]);
  });

  it("등급이 빈 배열이면 전체 등급", () => {
    expect(selectByPlaceAndGrade(rows, { regions: [], unions: [], grades: [] })).toHaveLength(3);
    expect(
      selectByPlaceAndGrade(rows, { regions: [], unions: [], grades: ["grade2"] }),
    ).toHaveLength(1);
  });

  it("시즌 선택과 달력 기간을 모두 지원한다", () => {
    expect(selectByTime(rows, { kind: "seasons", years: [2024] })).toHaveLength(2);
    expect(
      selectByTime(rows, { kind: "range", start: "2023-09-10", end: "2024-09-10" }),
    ).toHaveLength(2);
  });
});

describe("findCommonUnits", () => {
  it("모든 시즌에 등장한 조합만 반환한다", () => {
    const rows = [
      makeRow("2023-09-10", { union: "양양" }),
      makeRow("2023-09-10", { union: "울진" }),
      makeRow("2024-09-10", { union: "양양" }),
    ];
    expect(findCommonUnits(rows)).toEqual(["양양"]);
  });
});

describe("시즌 일차", () => {
  it("연도별 첫 공판일을 찾는다", () => {
    const starts = findSeasonStarts([
      makeRow("2024-09-25"),
      makeRow("2024-09-19"),
      makeRow("2023-09-11"),
    ]);
    expect(starts).toEqual({ 2024: "2024-09-19", 2023: "2023-09-11" });
  });

  it("첫 공판일이 1일차, 월이 바뀌어도 이어서 센다", () => {
    expect(toSeasonDay("2024-09-19", "2024-09-19")).toBe(1);
    expect(toSeasonDay("2024-10-01", "2024-09-19")).toBe(13);
  });

  it("addDays는 월말을 넘긴다", () => {
    expect(addDays("2024-09-28", 3)).toBe("2024-10-01");
  });
});
