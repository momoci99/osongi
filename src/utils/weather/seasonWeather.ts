import { RAIN_LAG_HINT, UNION_WEATHER_STATION, type WeatherStation } from "../../const/Weather";
import type { StationWeatherFile, WeatherPublicField } from "./publicWeather";

/** 날씨 뷰 하루 값 (여러 지점이면 평균). 관측 없으면 null */
export type WeatherDay = {
  date: string;
  maxTa: number | null;
  minTa: number | null;
  avgTa: number | null;
  rain: number | null;
  humidity: number | null;
  groundTemp: number | null;
  /** 약 3주 전 7일 누적 강수 (RAIN_LAG_HINT) — 툴팁용 */
  lagRain: number | null;
  /** LAG_DAYS 일 전 하루 강수 — 강수를 시차만큼 뒤로 옮겨 겹쳐 보는 참고 막대용 */
  shiftedRain: number | null;
};

/** 날씨 뷰가 쓰는 관측소 — 조합 목록에서 중복 제거 */
export type ScopeStation = WeatherStation & { unions: string[] };

const MS_PER_DAY = 86_400_000;

/** 조합들이 대응되는 관측소 (지점번호 오름차순) */
export const stationsForUnions = (unions: string[]): ScopeStation[] => {
  const byId = new Map<number, ScopeStation>();
  for (const union of unions) {
    const station = UNION_WEATHER_STATION[union];
    if (!station) continue;
    const existing = byId.get(station.stationId);
    if (existing) {
      existing.unions.push(union);
      existing.isSubstitute = existing.isSubstitute && station.isSubstitute;
    } else {
      byId.set(station.stationId, { ...station, unions: [union] });
    }
  }
  return [...byId.values()].sort((a, b) => a.stationId - b.stationId);
};

/** 연도 파일 배열에서 날짜의 인덱스 (시작 월-일 기준) */
const indexOfDate = (file: StationWeatherFile, date: string): number => {
  const year = Number(date.slice(0, 4));
  const start = Date.UTC(year, Number(file.startMonthDay.slice(0, 2)) - 1, Number(file.startMonthDay.slice(3)));
  const target = Date.UTC(year, Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
  return Math.round((target - start) / MS_PER_DAY);
};

/** 여러 지점 값의 평균 (결측 제외) */
const meanOf = (values: (number | null | undefined)[]): number | null => {
  const observed = values.filter((v): v is number => v !== null && v !== undefined);
  return observed.length === 0 ? null : observed.reduce((a, b) => a + b, 0) / observed.length;
};

const fieldAt = (file: StationWeatherFile, field: WeatherPublicField, date: string): number | null | undefined => {
  const series = file.years[date.slice(0, 4)]?.[field];
  const index = indexOfDate(file, date);
  return index < 0 || !series ? undefined : series[index];
};

/** 지점별 d−offset 일의 강수 */
const rainAt = (file: StationWeatherFile, date: string, offsetDays: number): number | null | undefined => {
  const shifted = new Date(Date.parse(`${date}T00:00:00Z`) - offsetDays * MS_PER_DAY).toISOString().slice(0, 10);
  return fieldAt(file, "sumRn", shifted);
};

/** 지점 하나의 약 3주 전 7일 누적 강수 — 창 안에 결측이 있으면 null */
const lagRainAt = (file: StationWeatherFile, date: string): number | null => {
  let sum = 0;
  for (let offset = RAIN_LAG_HINT.LAG_DAYS; offset < RAIN_LAG_HINT.LAG_DAYS + RAIN_LAG_HINT.WINDOW_DAYS; offset++) {
    const value = rainAt(file, date, offset);
    if (value === null || value === undefined) return null;
    sum += value;
  }
  return sum;
};

/**
 * 날짜 목록에 대한 날씨 — 여러 지점이면 날마다 관측된 지점끼리 평균한다.
 * 수집 창(07-01~11-30) 밖 날짜는 모두 null.
 */
export const buildSeasonWeather = (files: StationWeatherFile[], dates: string[]): WeatherDay[] =>
  dates.map((date) => ({
    date,
    maxTa: meanOf(files.map((f) => fieldAt(f, "maxTa", date))),
    minTa: meanOf(files.map((f) => fieldAt(f, "minTa", date))),
    avgTa: meanOf(files.map((f) => fieldAt(f, "avgTa", date))),
    rain: meanOf(files.map((f) => fieldAt(f, "sumRn", date))),
    humidity: meanOf(files.map((f) => fieldAt(f, "avgRhm", date))),
    groundTemp: meanOf(files.map((f) => fieldAt(f, "avgTs", date))),
    lagRain: meanOf(files.map((f) => lagRainAt(f, date))),
    shiftedRain: meanOf(files.map((f) => rainAt(f, date, RAIN_LAG_HINT.LAG_DAYS))),
  }));
