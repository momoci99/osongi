import * as d3 from "d3";
import { describe, expect, it } from "vitest";
import { buildTimeAxis } from "../timeAxisTicks";

const createDates = (count: number, start = "2024-01-01"): Date[] => {
  const baseDate = new Date(start);

  return Array.from({ length: count }, (_, index) =>
    d3.timeDay.offset(baseDate, index)
  );
};

describe("buildTimeAxis", () => {
  it("날짜가 없을 때 빈 tick 설정을 유지한다", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-01-07");
    const xScale = d3.scaleTime().domain([start, end]).range([0, 100]);
    const axis = buildTimeAxis(xScale, []);

    expect(axis.tickValues()).toBeNull();
  });

  it("7일 이하일 때 모든 날짜를 tick으로 사용한다", () => {
    const dates = createDates(7);
    const xScale = d3.scaleTime().domain([dates[0], dates[6]]).range([0, 100]);
    const axis = buildTimeAxis(xScale, dates);
    const tickValues = axis.tickValues() as Date[];

    expect(tickValues).toHaveLength(7);
    expect(tickValues.map((date) => date.getTime())).toEqual(
      dates.map((date) => date.getTime())
    );
  });

  it("31일 이하일 때 최대 8개로 간격을 두고 마지막 날짜를 포함한다", () => {
    const dates = createDates(31);
    const xScale = d3.scaleTime().domain([dates[0], dates[30]]).range([0, 100]);
    const axis = buildTimeAxis(xScale, dates);
    const tickValues = axis.tickValues() as Date[];

    expect(tickValues.length).toBeLessThanOrEqual(8);
    expect(tickValues[tickValues.length - 1].getTime()).toBe(
      dates[dates.length - 1].getTime()
    );
  });

  it("31일 이하일 때 tick 개수를 8개 이하로 제한한다", () => {
    const dates = createDates(24);
    const xScale = d3
      .scaleTime()
      .domain([dates[0], dates[dates.length - 1]])
      .range([0, 100]);
    const axis = buildTimeAxis(xScale, dates);
    const tickValues = axis.tickValues() as Date[];

    expect(tickValues.length).toBeLessThanOrEqual(8);
    expect(tickValues[0].getTime()).toBe(dates[0].getTime());
  });

  it("92일 이하일 때 주 단위 tick을 사용한다", () => {
    const dates = createDates(60);
    const xScale = d3.scaleTime().domain([dates[0], dates[59]]).range([0, 100]);
    const axis = buildTimeAxis(xScale, dates);
    const tickValues = axis.tickValues() as Date[];

    expect(tickValues.length).toBeGreaterThan(5);

    // 주 단위 간격 검증 (첫 tick은 start가 아닐 수 있으므로 제외)
    for (let index = 1; index < tickValues.length; index += 1) {
      const diffDays = d3.timeDay.count(
        tickValues[index - 1],
        tickValues[index]
      );

      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(7);
    }
  });

  it("93일 이상 200일 이하일 때 월 단위 tick을 사용한다", () => {
    const dates = createDates(120);
    const xScale = d3
      .scaleTime()
      .domain([dates[0], dates[dates.length - 1]])
      .range([0, 100]);
    const axis = buildTimeAxis(xScale, dates);
    const tickValues = axis.tickValues() as Date[];

    expect(tickValues[0].getTime()).toBe(dates[0].getTime());

    for (let index = 1; index < tickValues.length; index += 1) {
      const previous = tickValues[index - 1];
      const current = tickValues[index];
      const monthDiff =
        current.getFullYear() * 12 +
        current.getMonth() -
        (previous.getFullYear() * 12 + previous.getMonth());

      expect(monthDiff).toBeGreaterThanOrEqual(1);
    }
  });

  it("200일 초과일 때 2개월 간격 tick을 사용한다", () => {
    const dates = createDates(240);
    const xScale = d3
      .scaleTime()
      .domain([dates[0], dates[dates.length - 1]])
      .range([0, 100]);
    const axis = buildTimeAxis(xScale, dates);
    const tickValues = axis.tickValues() as Date[];

    expect(tickValues[0].getTime()).toBe(dates[0].getTime());

    for (let index = 1; index < tickValues.length; index += 1) {
      const previous = tickValues[index - 1];
      const current = tickValues[index];
      const monthDiff =
        current.getFullYear() * 12 +
        current.getMonth() -
        (previous.getFullYear() * 12 + previous.getMonth());

      expect(monthDiff).toBeGreaterThanOrEqual(2);
    }
  });

  it("tick 포맷은 월/일 형식을 사용한다", () => {
    const dates = createDates(7);
    const xScale = d3.scaleTime().domain([dates[0], dates[6]]).range([0, 100]);
    const axis = buildTimeAxis(xScale, dates);
    const formatter = axis.tickFormat();

    expect(formatter?.(dates[0], 0)).toBe("01/01");
  });
});
