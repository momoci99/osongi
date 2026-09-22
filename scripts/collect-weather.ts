#!/usr/bin/env node
/*
  기상청 ASOS 일자료 수집기 → data/weather/raw/{stationId}/{year}.json

  조합 매핑 지점 + 지온 검증 지점을 연도별 수집 창(07-01~11-30) 단위로 받는다.
  완료된 연도 파일은 건너뛰므로 중단 후 다시 실행하면 이어서 받는다.
  호출 한도 초과(22)를 만나면 받은 데까지 저장하고 멈춘다.

  실행: npm run collect-weather                 (전 기간)
        npm run collect-weather -- --from 2025  (특정 연도부터)
  환경변수: KMA_SERVICE_KEY (.env 또는 CI 시크릿)
*/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { KMA_ASOS_DAILY, KMA_RESULT_CODE, WEATHER_FIRST_YEAR } from "../src/const/Weather";
import {
  buildDailyRequestUrl,
  collectionRange,
  collectionStationIds,
  KmaApiError,
  maskServiceKey,
  needsFetch,
  parseDailyResponse,
  type CollectionRange,
  type KmaDailyRow,
  type KmaRawYearFile,
} from "../src/utils/weather/kmaAsos";

const RAW_ROOT = join(process.cwd(), "data", "weather", "raw");

/** .env 가 있으면 읽는다 (CI 에서는 시크릿이 환경변수로 들어온다) */
const loadServiceKey = (): string => {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const key = process.env.KMA_SERVICE_KEY?.trim();
  if (!key) {
    console.error("❌ KMA_SERVICE_KEY 가 없습니다. .env 또는 환경변수를 확인하세요.");
    process.exit(1);
  }
  return key;
};

/** --from YYYY / --to YYYY 인자 */
const parseYearArgs = (now: Date): { from: number; to: number } => {
  const args = process.argv.slice(2);
  const valueOf = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? Number(args[index + 1]) : undefined;
  };
  return {
    from: valueOf("--from") ?? WEATHER_FIRST_YEAR,
    to: valueOf("--to") ?? now.getFullYear(),
  };
};

const rawPath = (stationId: number, year: number) =>
  join(RAW_ROOT, String(stationId), `${year}.json`);

const readRaw = (stationId: number, year: number): KmaRawYearFile | null => {
  const path = rawPath(stationId, year);
  return existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf-8")) as KmaRawYearFile)
    : null;
};

const writeRaw = (file: KmaRawYearFile) => {
  mkdirSync(join(RAW_ROOT, String(file.stationId)), { recursive: true });
  writeFileSync(rawPath(file.stationId, file.year), `${JSON.stringify(file)}\n`);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 한 지점·기간의 전 페이지를 받는다 */
const fetchStationRange = async (
  serviceKey: string,
  stationId: number,
  range: CollectionRange,
): Promise<KmaDailyRow[]> => {
  const rows: KmaDailyRow[] = [];
  for (let pageNo = 1; ; pageNo++) {
    const response = await fetch(buildDailyRequestUrl(serviceKey, stationId, range, pageNo));
    const page = parseDailyResponse(await response.text());
    rows.push(...page.rows);
    if (rows.length >= page.totalCount || page.rows.length === 0) return rows;
    await sleep(KMA_ASOS_DAILY.REQUEST_INTERVAL_MS);
  }
};

const main = async () => {
  const serviceKey = loadServiceKey();
  const now = new Date();
  const { from, to } = parseYearArgs(now);
  const stationIds = collectionStationIds();

  console.log(`🌦️  ASOS 일자료 수집: 지점 ${stationIds.length}개 × ${from}~${to}`);
  let fetched = 0;
  let skipped = 0;

  for (const stationId of stationIds) {
    for (let year = from; year <= to; year++) {
      const range = collectionRange(year, now);
      if (!range || !needsFetch(readRaw(stationId, year))) {
        skipped++;
        continue;
      }

      try {
        const rows = await fetchStationRange(serviceKey, stationId, range);
        writeRaw({ stationId, year, ...range, fetchedAt: now.toISOString(), rows });
        fetched++;
        console.log(`  ✓ ${stationId} ${year} (${rows.length}일)`);
      } catch (error) {
        const message = maskServiceKey(String(error), serviceKey);
        if (error instanceof KmaApiError && error.code === KMA_RESULT_CODE.QUOTA_EXCEEDED) {
          console.error(`⛔ 호출 한도 초과 — 여기까지 저장. 내일 다시 실행하면 이어서 받습니다.\n   ${message}`);
          process.exit(1);
        }
        console.error(`  ✗ ${stationId} ${year}: ${message}`);
        process.exitCode = 1;
      }
      await sleep(KMA_ASOS_DAILY.REQUEST_INTERVAL_MS);
    }
  }

  console.log(`✅ 완료: 수집 ${fetched}건, 건너뜀 ${skipped}건`);
};

main();
