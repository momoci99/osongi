import { describe, expect, it } from "vitest";
import { aggregateRows, resolveAxis, type AggregateOptions } from "../aggregate";
import { makeRow } from "./fixtures";

const options = (overrides: Partial<AggregateOptions> = {}): AggregateOptions => ({
  axis: "date",
  groupBy: "none",
  granularity: "day",
  metric: "unitPrice",
  seasonStarts: {},
  ...overrides,
});

describe("resolveAxis", () => {
  it("시즌 단위면 연도 축", () => {
    expect(resolveAxis({ view: "overlay", align: "seasonDay", granularity: "season" })).toBe("year");
  });

  it("겹침·히트맵은 정렬 기준을 따른다", () => {
    expect(resolveAxis({ view: "overlay", align: "seasonDay", granularity: "day" })).toBe("seasonDay");
    expect(resolveAxis({ view: "heatmap", align: "calendar", granularity: "day" })).toBe("monthDay");
  });

  it("그 외 뷰는 날짜 축", () => {
    expect(resolveAxis({ view: "timeline", align: "seasonDay", granularity: "week" })).toBe("date");
  });
});

describe("aggregateRows", () => {
  it("단가는 수량 가중 평균", () => {
    const [series] = aggregateRows(
      [
        makeRow("2024-09-20", { quantity: 1, unitPrice: 100 }),
        makeRow("2024-09-20", { quantity: 3, unitPrice: 200, union: "강릉" }),
      ],
      options(),
    );
    expect(series.points[0].value).toBe(175);
    expect(series.points[0].records).toBe(2);
    expect(series.points[0].unions).toBe(2);
  });

  it("레코드 수가 임계 미만이면 표본 부족", () => {
    const [series] = aggregateRows([makeRow("2024-09-20")], options());
    expect(series.points[0].lowSample).toBe(true);
  });

  it("시즌 일차 축은 연도별 첫 공판일 기준", () => {
    const series = aggregateRows(
      [makeRow("2023-09-11"), makeRow("2024-09-19"), makeRow("2024-09-21")],
      options({
        axis: "seasonDay",
        groupBy: "year",
        seasonStarts: { 2023: "2023-09-11", 2024: "2024-09-19" },
      }),
    );
    expect(series.map((s) => s.key)).toEqual(["2023", "2024"]);
    expect(series[1].points.map((p) => p.x)).toEqual([1, 3]);
  });

  it("주 단위는 시즌 일차 7일씩 묶고 x는 주 시작일", () => {
    const [series] = aggregateRows(
      [makeRow("2024-09-19"), makeRow("2024-09-25"), makeRow("2024-09-26")],
      options({ granularity: "week", seasonStarts: { 2024: "2024-09-19" } }),
    );
    expect(series.points.map((p) => p.x)).toEqual(["2024-09-19", "2024-09-26"]);
    expect(series.points[0].tradingDays).toBe(2);
  });

  it("달력 주 단위는 시즌 시작 월 1일 기준으로 연도 간 x가 같다", () => {
    const series = aggregateRows(
      [makeRow("2023-09-02"), makeRow("2024-09-03")],
      options({ axis: "monthDay", granularity: "week", groupBy: "year" }),
    );
    expect(series[0].points[0].x).toBe(series[1].points[0].x);
  });

  it("누계는 연도가 바뀌면 초기화된다", () => {
    const [series] = aggregateRows(
      [
        makeRow("2023-10-01", { quantity: 2 }),
        makeRow("2023-10-02", { quantity: 3 }),
        makeRow("2024-09-20", { quantity: 4 }),
      ],
      options({ metric: "cumQuantity" }),
    );
    expect(series.points.map((p) => p.value)).toEqual([2, 5, 4]);
  });

  it("등급으로 묶은 비중은 같은 x 전체 수량 대비", () => {
    const rows = [
      makeRow("2024-09-20", { grade: "grade1", quantity: 1 }),
      makeRow("2024-09-20", { grade: "grade2", quantity: 3 }),
    ];
    const series = aggregateRows(rows, options({ metric: "gradeShare", groupBy: "grade" }));
    expect(series.find((s) => s.key === "grade1")?.points[0].value).toBe(0.25);
    expect(series.find((s) => s.key === "grade2")?.label).toBe("2등품");
  });

  it("지역으로 묶은 비중은 지역별 전체 수량 대비 (분모는 등급 필터 제외 행)", () => {
    const all = [
      makeRow("2024-09-20", { region: "강원", grade: "grade1", quantity: 1 }),
      makeRow("2024-09-20", { region: "강원", grade: "grade2", quantity: 1 }),
      makeRow("2024-09-20", { region: "경북", grade: "grade1", quantity: 3 }),
      makeRow("2024-09-20", { region: "경북", grade: "grade2", quantity: 1 }),
    ];
    const grade1 = all.filter((row) => row.grade === "grade1");
    const series = aggregateRows(grade1, options({ metric: "gradeShare", groupBy: "region" }), all);
    expect(series.map((s) => s.points[0].value)).toEqual([0.5, 0.75]);
  });
});
