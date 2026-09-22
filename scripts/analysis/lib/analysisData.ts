/*
  탐색 분석 스크립트 공용 데이터 로더.
  날씨 원본(data/weather/raw)과 공판 통합 데이터셋을 수집 창 날짜축에 맞춰 읽는다.
*/
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { WEATHER_COLLECTION_WINDOW } from "../../../src/const/Weather";
import { rainfallMm, type KmaDailyRow, type KmaRawYearFile } from "../../../src/utils/weather/kmaAsos";
import { toNumberOrNull, type Series } from "../../../src/utils/weather/seriesStats";

const RAW_ROOT = join(process.cwd(), "data", "weather", "raw");
const AUCTION_DATASET = join(process.cwd(), "public", "auction-data", "complete-dataset.json");
const MS_PER_DAY = 86_400_000;

/** 진행 중인 시즌은 창이 잘려 있어 분석에서 제외 */
export const LAST_COMPLETE_YEAR = 2025;

export const yearRange = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const mmddToUtc = (year: number, mmdd: string) =>
  new Date(Date.UTC(year, Number(mmdd.slice(0, 2)) - 1, Number(mmdd.slice(2))));

/** 수집 창(07-01~11-30)의 날짜 목록 (YYYY-MM-DD) */
export const windowDates = (year: number): string[] => {
  const end = mmddToUtc(year, WEATHER_COLLECTION_WINDOW.END_MMDD);
  const dates: string[] = [];
  for (let d = mmddToUtc(year, WEATHER_COLLECTION_WINDOW.START_MMDD); d <= end; d = new Date(d.getTime() + MS_PER_DAY)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

/** 수집 창 안에서 MMDD 의 인덱스 (윤년 영향 없음 — 창이 7월부터라서) */
export const windowIndexOf = (mmdd: string): number =>
  windowDates(2001).findIndex((d) => d.slice(5).replace("-", "") === mmdd);

const rowsCache = new Map<string, Map<string, KmaDailyRow>>();

const loadRowsByDate = (stationId: number, year: number): Map<string, KmaDailyRow> => {
  const key = `${stationId}/${year}`;
  const cached = rowsCache.get(key);
  if (cached) return cached;
  const path = join(RAW_ROOT, String(stationId), `${year}.json`);
  const rows = existsSync(path) ? (JSON.parse(readFileSync(path, "utf-8")) as KmaRawYearFile).rows : [];
  const byDate = new Map(rows.map((row) => [row.tm, row]));
  rowsCache.set(key, byDate);
  return byDate;
};

/** 날짜축에 맞춘 필드 시계열 (행이 빠진 날도 결측으로 자리 유지) */
export const weatherSeries = (stationId: number, year: number, field: keyof KmaDailyRow): Series => {
  const byDate = loadRowsByDate(stationId, year);
  return windowDates(year).map((date) => toNumberOrNull(byDate.get(date)?.[field]));
};

/** 날짜축에 맞춘 일강수량 (빈 값 = 0, 행 없음 = 결측) */
export const rainSeries = (stationId: number, year: number): Series => {
  const byDate = loadRowsByDate(stationId, year);
  return windowDates(year).map((date) => rainfallMm(byDate.get(date)));
};

type AuctionRecord = { date: string; union: string; auctionQuantityToday: number };

let auctionIndex: Map<string, number> | null = null;

/** 조합·날짜 → 금일 공판량(kg). 같은 키가 여러 행이면 합산 */
const loadAuctionIndex = (): Map<string, number> => {
  if (auctionIndex) return auctionIndex;
  const { data } = JSON.parse(readFileSync(AUCTION_DATASET, "utf-8")) as { data: AuctionRecord[] };
  auctionIndex = new Map();
  for (const record of data) {
    const key = `${record.union}|${record.date}`;
    auctionIndex.set(key, (auctionIndex.get(key) ?? 0) + record.auctionQuantityToday);
  }
  return auctionIndex;
};

/** 날짜축에 맞춘 조합 일 공판량. 공판 없는 날(0 또는 행 없음)은 결측 */
export const auctionQuantitySeries = (union: string, year: number): Series => {
  const index = loadAuctionIndex();
  return windowDates(year).map((date) => {
    const quantity = index.get(`${union}|${date}`) ?? 0;
    return quantity > 0 ? quantity : null;
  });
};
