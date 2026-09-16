import { describe, expect, it } from "vitest";
import { buildNormalBand, pickNormalYears, quantileSorted } from "../normalBand";
import { makeRow } from "./fixtures";

describe("quantileSorted", () => {
  it("선형 보간 분위수", () => {
    expect(quantileSorted([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(quantileSorted([10, 20, 30], 0.25)).toBe(15);
    expect(quantileSorted([7], 0.75)).toBe(7);
  });
});

describe("pickNormalYears", () => {
  it("가장 최근 선택 시즌 이전, 선택 제외, 최근 10개", () => {
    const available = Array.from({ length: 14 }, (_, i) => 2013 + i);
    expect(pickNormalYears(available, [2026])).toEqual([
      2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
    ]);
    expect(pickNormalYears(available, [2024, 2026])).not.toContain(2024);
  });

  it("선택이 없으면 빈 배열", () => {
    expect(pickNormalYears([2020, 2021], [])).toEqual([]);
  });
});

describe("buildNormalBand", () => {
  const seasonOptions = { axis: "seasonDay" as const, granularity: "day" as const };

  it("같은 시즌 일차 값의 분위 밴드를 만든다", () => {
    const rows = [
      makeRow("2020-09-18", { unitPrice: 100 }),
      makeRow("2021-09-06", { unitPrice: 200 }),
      makeRow("2022-09-07", { unitPrice: 300 }),
    ];
    const band = buildNormalBand(rows, [2020, 2021, 2022], { ...seasonOptions, metric: "unitPrice" });
    expect(band).toEqual([{ x: 1, lower: 150, median: 200, upper: 250, seasons: 3 }]);
  });

  it("시즌 수가 최소 기준 미만인 x는 제외한다", () => {
    const rows = [
      makeRow("2020-09-18"),
      makeRow("2021-09-06"),
      makeRow("2022-09-07"),
      makeRow("2022-09-08"),
    ];
    const band = buildNormalBand(rows, [2020, 2021, 2022], { ...seasonOptions, metric: "unitPrice" });
    expect(band.map((point) => point.x)).toEqual([1]);
  });

  it("누계는 공판 없는 날·시즌 종료 후에도 직전 누계를 유지한다", () => {
    const rows = [
      makeRow("2020-09-18", { quantity: 1 }),
      makeRow("2021-09-06", { quantity: 2 }),
      makeRow("2022-09-07", { quantity: 3 }),
      makeRow("2022-09-09", { quantity: 3 }),
    ];
    const band = buildNormalBand(rows, [2020, 2021, 2022], {
      ...seasonOptions,
      metric: "cumQuantity",
    });
    expect(band.find((point) => point.x === 3)).toMatchObject({ median: 2, upper: 4, seasons: 3 });
  });

  it("날짜 축에서는 밴드를 만들지 않는다", () => {
    expect(
      buildNormalBand([makeRow("2020-09-18")], [2020], {
        axis: "date",
        granularity: "day",
        metric: "unitPrice",
      }),
    ).toEqual([]);
  });
});
