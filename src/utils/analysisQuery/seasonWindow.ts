import { SEASON_STRIP } from "../../const/AnalysisLayout";
import { addDays, toSeasonDay } from "./rows";
import type { AnalysisTime, GradeRow } from "./types";

/** 해당 연도 시즌 창 시작일 */
export const seasonWindowStart = (year: number): string =>
  `${year}-${SEASON_STRIP.WINDOW_START}`;

/** 날짜의 시즌 창 내 오프셋 (0 ~ WINDOW_DAYS-1로 고정) */
export const toWindowOffset = (date: string): number => {
  const year = Number(date.slice(0, 4));
  const offset = toSeasonDay(date, seasonWindowStart(year)) - 1;
  return Math.min(Math.max(offset, 0), SEASON_STRIP.WINDOW_DAYS - 1);
};

/** 연도와 오프셋으로 날짜 */
export const fromWindowOffset = (year: number, offset: number): string => {
  const clamped = Math.min(Math.max(Math.round(offset), 0), SEASON_STRIP.WINDOW_DAYS - 1);
  return addDays(seasonWindowStart(year), clamped);
};

/** 날짜별 공판량 합계 (시즌 스트립 막대용) */
export const sumQuantityByDate = (rows: GradeRow[]): Map<string, number> => {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.date, (totals.get(row.date) ?? 0) + row.quantity);
  }
  return totals;
};

/**
 * 클릭한 연도를 시즌 선택에 반영한다.
 * 보조키 없이 누르면 그 시즌만, 보조키를 누르면 토글한다.
 */
export const toggleSeason = (time: AnalysisTime, year: number, additive: boolean): AnalysisTime => {
  if (!additive || time.kind === "range") return { kind: "seasons", years: [year] };
  const next = time.years.includes(year)
    ? time.years.filter((item) => item !== year)
    : [...time.years, year].sort((a, b) => a - b);
  return { kind: "seasons", years: next.length > 0 ? next : [year] };
};
