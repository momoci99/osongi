import {
  WEATHER_COLLECTION_WINDOW,
  WEATHER_PUBLIC_DECIMALS,
  WEATHER_PUBLIC_FIELDS,
} from "../../const/Weather";
import { rainfallMm, type KmaRawYearFile } from "./kmaAsos";
import { toNumberOrNull } from "./seriesStats";

export type WeatherPublicField = (typeof WEATHER_PUBLIC_FIELDS)[number];

/** 한 시즌의 일별 값 — 인덱스 0 = 수집 창 첫날(07-01) */
export type WeatherYearValues = Partial<Record<WeatherPublicField, (number | null)[]>>;

/** 지점별 공개 파일 */
export type StationWeatherFile = {
  stationId: number;
  generatedAt: string;
  /** 배열 인덱스 0 의 월-일 (MM-DD) */
  startMonthDay: string;
  years: Record<string, WeatherYearValues>;
};

const MS_PER_DAY = 86_400_000;
const ROUND_FACTOR = 10 ** WEATHER_PUBLIC_DECIMALS;

const round = (value: number | null): number | null =>
  value === null ? null : Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;

/** 수집 창 시작 월-일 (MM-DD) */
export const WEATHER_START_MONTH_DAY = `${WEATHER_COLLECTION_WINDOW.START_MMDD.slice(0, 2)}-${WEATHER_COLLECTION_WINDOW.START_MMDD.slice(2)}`;

/** 연도의 수집 창 날짜 목록 (YYYY-MM-DD), 마지막 날짜까지 */
export const weatherWindowDates = (year: number, lastDate?: string): string[] => {
  const toUtc = (mmdd: string) => Date.UTC(year, Number(mmdd.slice(0, 2)) - 1, Number(mmdd.slice(2)));
  const end = toUtc(WEATHER_COLLECTION_WINDOW.END_MMDD);
  const dates: string[] = [];
  for (let t = toUtc(WEATHER_COLLECTION_WINDOW.START_MMDD); t <= end; t += MS_PER_DAY) {
    const date = new Date(t).toISOString().slice(0, 10);
    if (lastDate && date > lastDate) break;
    dates.push(date);
  }
  return dates;
};

/**
 * 원본 연도 파일 → 공개용 일별 배열.
 * 강수 빈 값은 무강수(0), 행이 없는 날은 null. 전 기간 결측인 필드(지중온도 미관측 지점 등)는 뺀다.
 */
export const toPublicYearValues = (raw: KmaRawYearFile): WeatherYearValues => {
  const byDate = new Map(raw.rows.map((row) => [row.tm, row]));
  const lastDate = raw.rows.reduce((max, row) => (row.tm > max ? row.tm : max), "");
  const dates = weatherWindowDates(raw.year, lastDate || undefined);

  const values: WeatherYearValues = {};
  for (const field of WEATHER_PUBLIC_FIELDS) {
    const series = dates.map((date) => {
      const row = byDate.get(date);
      return round(field === "sumRn" ? rainfallMm(row) : toNumberOrNull(row?.[field]));
    });
    if (series.some((v) => v !== null)) values[field] = series;
  }
  return values;
};

/** 지점의 연도 파일들을 묶어 공개 파일로 */
export const buildStationWeatherFile = (
  stationId: number,
  raws: KmaRawYearFile[],
  generatedAt: string,
): StationWeatherFile => ({
  stationId,
  generatedAt,
  startMonthDay: WEATHER_START_MONTH_DAY,
  years: Object.fromEntries(
    [...raws].sort((a, b) => a.year - b.year).map((raw) => [String(raw.year), toPublicYearValues(raw)]),
  ),
});
