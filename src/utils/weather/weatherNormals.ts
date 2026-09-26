import { WEATHER_NORMAL } from "../../const/Weather";
import { weatherWindowDates, type StationWeatherFile } from "./publicWeather";
import { buildSeasonWeather, type WeatherDay } from "./seasonWeather";
import { median } from "./seriesStats";

/** 평년 비교 지표 */
export type NormalMetricKey = "rain" | "avgTa" | "groundTemp";

/** 순위 — 위쪽 절반이면 큰 쪽부터, 아래쪽이면 작은 쪽부터 센다 */
export type NormalRank = { position: number; total: number; side: "high" | "low" };

export type YearValue = { year: number; value: number };

/** 한 지표·한 달 줄 */
export type MonthStrip = {
  month: number;
  /** 관측이 충분한 해들 (선택 시즌이 끝난 달이면 포함) */
  values: YearValue[];
  median: number | null;
  /** 선택 시즌 값. 진행 중인 달이면 partialUntil 에 마지막 관측일 */
  selected: { value: number; partialUntil: string | null } | null;
  rank: NormalRank | null;
};

export type MetricStrips = { key: NormalMetricKey; months: MonthStrip[] };

/** 누적 강수 하루 */
export type CumulativeRainDay = {
  offset: number;
  /** YYYY-MM-DD 중 월-일 (MM-DD) */
  monthDay: string;
  min: number | null;
  max: number | null;
  median: number | null;
  selected: number | null;
  rank: NormalRank | null;
};

export type CumulativeRainModel = {
  days: CumulativeRainDay[];
  /** 띠를 만든 시즌 수 (선택 시즌 제외) */
  bandYears: number;
};

/** 지표 메타 — 월 집계 방식과 순위 문구 */
export const NORMAL_METRICS: Record<
  NormalMetricKey,
  { label: string; unit: string; aggregate: "sum" | "mean"; words: Record<NormalRank["side"], string> }
> = {
  rain: { label: "강수 합", unit: "mm", aggregate: "sum", words: { high: "많음", low: "적음" } },
  avgTa: { label: "평균기온", unit: "°C", aggregate: "mean", words: { high: "높음", low: "낮음" } },
  groundTemp: { label: "평균 지면온도", unit: "°C", aggregate: "mean", words: { high: "높음", low: "낮음" } },
};

const METRIC_ORDER: NormalMetricKey[] = ["rain", "avgTa", "groundTemp"];

/** 연도별 수집 창 전체 날씨 (관측소 평균) */
export const seasonDaysByYear = (files: StationWeatherFile[]): Map<number, WeatherDay[]> => {
  const years = [...new Set(files.flatMap((f) => Object.keys(f.years).map(Number)))].sort((a, b) => a - b);
  return new Map(years.map((year) => [year, buildSeasonWeather(files, weatherWindowDates(year))]));
};

/** 강수 관측이 있는 마지막 날 (없으면 null) */
const lastObservedDate = (days: WeatherDay[]): string | null =>
  days.reduce<string | null>((last, d) => (d.rain !== null ? d.date : last), null);

/** 순위 — 큰 쪽·작은 쪽 중 가까운 쪽 기준. 비교 대상이 2개 미만이면 null */
export const rankOf = (value: number, values: number[]): NormalRank | null => {
  if (values.length < 2) return null;
  const fromHigh = 1 + values.filter((v) => v > value).length;
  const fromLow = 1 + values.filter((v) => v < value).length;
  return fromHigh <= fromLow
    ? { position: fromHigh, total: values.length, side: "high" }
    : { position: fromLow, total: values.length, side: "low" };
};

/** "14년 중 3번째로 많음" / "14년 중 가장 적음". withTotal=false 면 "N년 중" 을 뺀다 */
export const describeRank = (rank: NormalRank, key: NormalMetricKey, withTotal = true): string => {
  const word = NORMAL_METRICS[key].words[rank.side];
  const order = rank.position === 1 ? `가장 ${word}` : `${rank.position}번째로 ${word}`;
  return withTotal ? `${rank.total}년 중 ${order}` : order;
};

/** 한 해·한 달 집계 — 관측일 비율과 함께 */
const aggregateMonth = (
  days: WeatherDay[],
  month: number,
  key: NormalMetricKey,
): { value: number | null; coverage: number } => {
  const monthDays = days.filter((d) => Number(d.date.slice(5, 7)) === month);
  const observed = monthDays.map((d) => d[key]).filter((v): v is number => v !== null);
  if (observed.length === 0) return { value: null, coverage: 0 };
  const sum = observed.reduce((a, b) => a + b, 0);
  return {
    value: NORMAL_METRICS[key].aggregate === "sum" ? sum : sum / observed.length,
    coverage: observed.length / monthDays.length,
  };
};

/** 달의 마지막 날 (YYYY-MM-DD) */
const monthEndDate = (year: number, month: number): string =>
  new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

const buildMonthStrip = (
  byYear: Map<number, WeatherDay[]>,
  selectedYear: number,
  month: number,
  key: NormalMetricKey,
): MonthStrip => {
  const values: YearValue[] = [];
  let selected: MonthStrip["selected"] = null;

  for (const [year, days] of byYear) {
    const last = lastObservedDate(days);
    if (last === null || last.slice(5, 7) < String(month).padStart(2, "0")) continue;
    const { value, coverage } = aggregateMonth(days, month, key);
    if (value === null) continue;
    const complete = last >= monthEndDate(year, month);
    if (year === selectedYear) selected = { value, partialUntil: complete ? null : last };
    if (complete && coverage >= WEATHER_NORMAL.MIN_COVERAGE) values.push({ year, value });
  }

  const allValues = values.map((v) => v.value);
  return {
    month,
    values,
    median: median(allValues),
    selected,
    rank: selected && selected.partialUntil === null && values.some((v) => v.year === selectedYear)
      ? rankOf(selected.value, allValues)
      : null,
  };
};

/** (a) 월별 점 분포 — 지표 3개 × WEATHER_NORMAL.MONTHS */
export const buildMonthlyStrips = (byYear: Map<number, WeatherDay[]>, selectedYear: number): MetricStrips[] =>
  METRIC_ORDER.map((key) => ({
    key,
    months: WEATHER_NORMAL.MONTHS.map((month) => buildMonthStrip(byYear, selectedYear, month, key)),
  }));

/** 결측을 0 으로 쌓은 누적 강수. 마지막 관측일 뒤는 null */
const cumulativeRain = (days: WeatherDay[], lastIndex: number): (number | null)[] => {
  let total = 0;
  return days.map((d, index) => {
    if (index > lastIndex) return null;
    total += d.rain ?? 0;
    return total;
  });
};

/** (b) 누적 강수 곡선 — 07-01 ~ WEATHER_NORMAL.CUMULATIVE_END_MMDD */
export const buildCumulativeRain = (byYear: Map<number, WeatherDay[]>, selectedYear: number): CumulativeRainModel => {
  const end = `${WEATHER_NORMAL.CUMULATIVE_END_MMDD.slice(0, 2)}-${WEATHER_NORMAL.CUMULATIVE_END_MMDD.slice(2)}`;
  const length = weatherWindowDates(2001).indexOf(`2001-${end}`) + 1;

  const bandSeries: (number | null)[][] = [];
  let selectedSeries: (number | null)[] = Array(length).fill(null);

  for (const [year, allDays] of byYear) {
    const days = allDays.slice(0, length);
    const last = lastObservedDate(days);
    if (last === null) continue;
    const lastIndex = days.findIndex((d) => d.date === last);
    const series = cumulativeRain(days, lastIndex);
    if (year === selectedYear) {
      selectedSeries = series;
      continue;
    }
    const complete = lastIndex === length - 1;
    const coverage = days.filter((d) => d.rain !== null).length / length;
    if (complete && coverage >= WEATHER_NORMAL.MIN_COVERAGE) bandSeries.push(series);
  }

  const monthDays = weatherWindowDates(2001).slice(0, length).map((date) => date.slice(5));
  const days = monthDays.map((monthDay, offset): CumulativeRainDay => {
    const others = bandSeries.map((s) => s[offset]).filter((v): v is number => v !== null);
    const selected = selectedSeries[offset];
    return {
      offset,
      monthDay,
      min: others.length > 0 ? Math.min(...others) : null,
      max: others.length > 0 ? Math.max(...others) : null,
      median: median(others),
      selected,
      rank: selected === null ? null : rankOf(selected, [...others, selected]),
    };
  });
  return { days, bandYears: bandSeries.length };
};
