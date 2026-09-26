import { WEATHER_CHART } from "../../const/AnalysisLayout";
import type { AggregateSeries } from "../analysisQuery/types";
import { weatherWindowDates } from "./publicWeather";
import type { WeatherDay } from "./seasonWeather";

/** 한 시즌 하루 — 공판량 + 날씨 */
export type WeatherChartDay = WeatherDay & {
  /** 수집 창 첫날(07-01)부터의 일수 — 연도가 달라도 같은 x */
  offset: number;
  quantity: number | null;
};

/** 시즌 패널 */
export type WeatherPanel = {
  year: number;
  days: WeatherChartDay[];
};

/** 날씨 뷰 전체 모델 */
export type WeatherChartModel = {
  panels: WeatherPanel[];
  /** 선택했지만 패널 수 제한으로 빠진 시즌 */
  hiddenYears: number[];
  /** 모든 패널 공통 x 범위 (offset) */
  domain: [number, number];
  maxQuantity: number;
  maxRain: number;
  temperatureDomain: [number, number];
};

/** 날짜 → 07-01 기준 일수 (7월 이후라 윤년 영향 없음) */
export const offsetOfDate = (date: string): number => weatherWindowDates(2001).indexOf(`2001${date.slice(4)}`);

/**
 * 공판이 있는 날의 일 공판량 (날짜 → kg).
 * 시리즈 키가 아니라 점의 날짜로 모은다 — 묶기 기준이 무엇이든(연도·전체) 같은 결과가 나온다.
 */
const quantityByDate = (series: AggregateSeries[]): Map<string, number> => {
  const byDate = new Map<string, number>();
  for (const point of series.flatMap((s) => s.points)) {
    if ((point.value ?? 0) <= 0) continue;
    const date = String(point.x);
    byDate.set(date, (byDate.get(date) ?? 0) + (point.value ?? 0));
  }
  return byDate;
};

/** 공판 있는 시즌 → 최근 시즌부터, 패널 수 제한 */
export const selectPanelYears = (series: AggregateSeries[]): { shown: number[]; hidden: number[] } => {
  const years = [...new Set([...quantityByDate(series).keys()].map((date) => Number(date.slice(0, 4))))].sort(
    (a, b) => b - a,
  );
  return { shown: years.slice(0, WEATHER_CHART.MAX_PANELS), hidden: years.slice(WEATHER_CHART.MAX_PANELS) };
};

/** 공판이 있는 날 범위에 여백을 더한 공통 x 범위 (수집 창 안으로 자름) */
const panelDomain = (quantities: Map<string, number>, years: number[]): [number, number] => {
  const offsets = [...quantities.keys()]
    .filter((date) => years.includes(Number(date.slice(0, 4))))
    .map(offsetOfDate);
  const last = weatherWindowDates(2001).length - 1;
  if (offsets.length === 0) return [0, last];
  return [
    Math.max(0, Math.min(...offsets) - WEATHER_CHART.DOMAIN_PAD_DAYS),
    Math.min(last, Math.max(...offsets) + WEATHER_CHART.DOMAIN_PAD_DAYS),
  ];
};

const finiteMax = (values: (number | null)[], fallback: number): number => {
  const observed = values.filter((v): v is number => v !== null);
  return observed.length ? Math.max(...observed) : fallback;
};

/**
 * 날씨 뷰 모델.
 * 모든 패널이 같은 x 범위·같은 y 눈금을 써서 위아래로 시즌을 바로 비교할 수 있게 한다.
 * @param weatherOf 연도의 날짜 목록 → 날씨 (지점 평균)
 */
export const buildWeatherChartModel = (
  series: AggregateSeries[],
  weatherOf: (dates: string[]) => WeatherDay[],
  includeShiftedRain: boolean,
): WeatherChartModel => {
  const { shown, hidden } = selectPanelYears(series);
  const quantities = quantityByDate(series);
  const domain = panelDomain(quantities, shown);

  const panels = shown.map((year) => {
    const dates = weatherWindowDates(year).slice(domain[0], domain[1] + 1);
    const days = weatherOf(dates).map((day, index) => ({
      ...day,
      offset: domain[0] + index,
      quantity: quantities.get(day.date) ?? null,
    }));
    return { year, days };
  });

  const allDays = panels.flatMap((p) => p.days);
  const temperatures = allDays.flatMap((d) => [d.minTa, d.maxTa, d.groundTemp]).filter((v): v is number => v !== null);
  const temperatureDomain: [number, number] = temperatures.length
    ? [Math.floor(Math.min(...temperatures) - WEATHER_CHART.TEMPERATURE_PAD), Math.ceil(Math.max(...temperatures) + WEATHER_CHART.TEMPERATURE_PAD)]
    : [0, 1];

  return {
    panels,
    hiddenYears: hidden,
    domain,
    maxQuantity: finiteMax(allDays.map((d) => d.quantity), 1),
    maxRain: finiteMax(allDays.flatMap((d) => (includeShiftedRain ? [d.rain, d.shiftedRain] : [d.rain])), 1),
    temperatureDomain,
  };
};
