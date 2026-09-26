import { describe, expect, it } from "vitest";
import { buildWeatherChartModel, offsetOfDate, selectPanelYears } from "../weatherChartModel";
import type { AggregatePoint, AggregateSeries } from "../../analysisQuery/types";
import type { WeatherDay } from "../seasonWeather";

const point = (x: string, value: number): AggregatePoint => ({
  x,
  year: Number(x.slice(0, 4)),
  value,
  quantity: value,
  amount: 0,
  records: 1,
  tradingDays: 1,
  unions: 1,
  lowSample: false,
});

const season = (year: number, entries: [string, number][]): AggregateSeries => ({
  key: String(year),
  label: String(year),
  points: entries.map(([md, v]) => point(`${year}-${md}`, v)),
});

/** 날짜마다 강수 = 일(day), 기온 10~20, 옮긴 강수 = 100 */
const weatherOf = (dates: string[]): WeatherDay[] =>
  dates.map((date) => ({
    date,
    maxTa: 20,
    minTa: 10,
    avgTa: 15,
    rain: Number(date.slice(8)),
    humidity: 80,
    groundTemp: 18,
    lagRain: 5,
    shiftedRain: 100,
  }));

describe("offsetOfDate", () => {
  it("07-01 = 0, 연도와 무관", () => {
    expect(offsetOfDate("2025-07-01")).toBe(0);
    expect(offsetOfDate("2024-09-01")).toBe(62);
    expect(offsetOfDate("2025-09-01")).toBe(62);
  });
});

describe("selectPanelYears", () => {
  it("공판 있는 시즌만, 최근부터 최대 4개", () => {
    const series = [2019, 2020, 2021, 2022, 2023].map((y) => season(y, [["09-10", 5]]));
    series.push(season(2024, [["09-10", 0]]));
    expect(selectPanelYears(series)).toEqual({ shown: [2023, 2022, 2021, 2020], hidden: [2019] });
  });
});

describe("묶기 기준과 무관", () => {
  it("연도가 섞인 단일 시리즈(묶기 없음)도 점의 날짜로 시즌을 나눈다", () => {
    const mixed: AggregateSeries = {
      key: "all",
      label: "전체",
      points: [point("2025-09-10", 5), point("2024-09-12", 7)],
    };
    const model = buildWeatherChartModel([mixed], weatherOf, false);
    expect(model.panels.map((p) => p.year)).toEqual([2025, 2024]);
    expect(model.panels[1].days.find((d) => d.date === "2024-09-12")!.quantity).toBe(7);
  });
});

describe("buildWeatherChartModel", () => {
  const series = [season(2025, [["09-10", 50], ["09-20", 80]]), season(2024, [["09-05", 30]])];

  it("모든 패널 공통 x 범위 = 가장 이른 공판 −10일 ~ 가장 늦은 공판 +10일", () => {
    const model = buildWeatherChartModel(series, weatherOf, false);
    expect(model.domain).toEqual([offsetOfDate("2024-09-05") - 10, offsetOfDate("2025-09-20") + 10]);
    expect(model.panels.map((p) => p.year)).toEqual([2025, 2024]);
    expect(model.panels[0].days[0].date).toBe("2025-08-26");
    expect(model.panels[1].days[0].date).toBe("2024-08-26");
  });

  it("공판 없는 날은 quantity null, 눈금 최대는 전 패널 공통", () => {
    const model = buildWeatherChartModel(series, weatherOf, false);
    const day = model.panels[0].days.find((d) => d.date === "2025-09-10")!;
    expect(day.quantity).toBe(50);
    expect(model.panels[0].days.find((d) => d.date === "2025-09-11")!.quantity).toBeNull();
    expect(model.maxQuantity).toBe(80);
  });

  it("옮긴 강수 표시 여부가 강수 눈금에 반영된다", () => {
    expect(buildWeatherChartModel(series, weatherOf, false).maxRain).toBe(31);
    expect(buildWeatherChartModel(series, weatherOf, true).maxRain).toBe(100);
  });

  it("기온 범위는 최저·최고·지면온도를 감싸고 여유를 둔다", () => {
    expect(buildWeatherChartModel(series, weatherOf, false).temperatureDomain).toEqual([9, 21]);
  });
});
