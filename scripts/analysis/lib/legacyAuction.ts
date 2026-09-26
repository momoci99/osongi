/*
  옛 공판 정제 자료(data/legacy-auction/refined, 2008~2012) 로더 — 기획서 9-6 독립 검증용.
*/
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { LegacyRow } from "../../../src/utils/legacyAuction/parseLegacySheet";
import type { Series } from "../../../src/utils/weather/seriesStats";
import { windowDates } from "./analysisData";

const REFINED_DIR = join(process.cwd(), "data", "legacy-auction", "refined");

export const LEGACY_YEARS = [2008, 2009, 2010, 2011, 2012];

/** 기상 결측 허용 비율 (9-6 공통 규칙) */
const MAX_MISSING_SHARE = 0.2;

type LegacyDay = { date: string; unions: LegacyRow[] };

const cache = new Map<number, LegacyDay[]>();

export const loadLegacyDays = (year: number): LegacyDay[] => {
  const cached = cache.get(year);
  if (cached) return cached;
  const path = join(REFINED_DIR, `${year}.json`);
  const days = existsSync(path) ? (JSON.parse(readFileSync(path, "utf-8")) as LegacyDay[]) : [];
  cache.set(year, days);
  return days;
};

/** 조합·날짜 → 금일 공판량(kg) 항목들 (금일 > 0 만) */
export const legacyQuantityEntries = (): { union: string; date: string; quantity: number }[] =>
  LEGACY_YEARS.flatMap((year) =>
    loadLegacyDays(year).flatMap((day) =>
      day.unions
        .filter((row) => (row.quantity.today ?? 0) > 0)
        .map((row) => ({ union: row.union, date: day.date, quantity: row.quantity.today as number })),
    ),
  );

/** 조합 시즌 누계 흐름: 게시일별 누계, 첫 게시일의 전일까지, 최종 누계 */
export const legacyCumulative = (union: string, year: number) => {
  const rows = loadLegacyDays(year)
    .map((day) => ({ date: day.date, row: day.unions.find((r) => r.union === union) }))
    .filter((entry): entry is { date: string; row: LegacyRow } => entry.row !== undefined);
  if (rows.length === 0) return null;
  return {
    points: rows.map(({ date, row }) => ({ date, total: row.quantity.total ?? 0 })),
    firstUntilYesterday: rows[0].row.quantity.untilYesterday ?? 0,
    finalTotal: rows[rows.length - 1].row.quantity.total ?? 0,
  };
};

/** 구간 [from, to] 안 결측 비율이 기준을 넘으면 전부 결측으로 바꾼다 */
export const maskIfSparse = (series: Series, from = 0, to = series.length - 1): Series => {
  const slice = series.slice(from, to + 1);
  const missing = slice.filter((v) => v === null).length;
  return missing / slice.length > MAX_MISSING_SHARE ? series.map(() => null) : series;
};

/** 수집 창 날짜 인덱스 (연도 무관 MM-DD) */
export const windowIndexOfDate = (date: string): number =>
  windowDates(Number(date.slice(0, 4))).indexOf(date);
