#!/usr/bin/env node
/*
  산림청 산불발생통계 수집기 → data/wildfire/raw/{year}.json

  연도 단위로 받는다. 지난해까지는 한 번 받으면 건너뛰고, 올해는 매번 다시 받는다.
  위치는 발화 지점 기준 — 번진 시군은 들어 있지 않다(대형 산불은 별도 보정 표 필요).

  실행: npm run collect-wildfire                 (전 기간)
        npm run collect-wildfire -- --from 2025  (특정 연도부터)
  환경변수: KMA_SERVICE_KEY (공공데이터포털 공용 키)
*/
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { FOREST_FIRE_API, FOREST_FIRE_FIRST_YEAR } from "../src/const/Wildfire";
import { buildForestFireUrl, parseForestFireResponse, type ForestFire } from "../src/utils/wildfire/forestFireApi";

const RAW_ROOT = join(process.cwd(), "data", "wildfire", "raw");

const loadServiceKey = (): string => {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const key = process.env.KMA_SERVICE_KEY?.trim();
  if (!key) {
    console.error("❌ KMA_SERVICE_KEY 가 없습니다. .env 또는 환경변수를 확인하세요.");
    process.exit(1);
  }
  return key;
};

const fromYearArg = (): number => {
  const args = process.argv.slice(2);
  const index = args.indexOf("--from");
  return index >= 0 ? Number(args[index + 1]) : FOREST_FIRE_FIRST_YEAR;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchYear = async (serviceKey: string, year: number): Promise<ForestFire[]> => {
  const fires: ForestFire[] = [];
  for (let pageNo = 1; ; pageNo++) {
    const response = await fetch(buildForestFireUrl(serviceKey, `${year}0101`, `${year}1231`, pageNo));
    const page = parseForestFireResponse(await response.text());
    fires.push(...page.fires);
    if (fires.length >= page.totalCount || page.fires.length === 0) return fires;
    await sleep(FOREST_FIRE_API.REQUEST_INTERVAL_MS);
  }
};

const main = async () => {
  const serviceKey = loadServiceKey();
  const thisYear = new Date().getFullYear();
  mkdirSync(RAW_ROOT, { recursive: true });

  for (let year = fromYearArg(); year <= thisYear; year++) {
    const path = join(RAW_ROOT, `${year}.json`);
    if (year < thisYear && existsSync(path)) continue;
    try {
      const fires = await fetchYear(serviceKey, year);
      writeFileSync(path, `${JSON.stringify({ year, fetchedAt: new Date().toISOString(), fires })}\n`);
      console.log(`  ✓ ${year} (${fires.length}건)`);
    } catch (error) {
      console.error(`  ✗ ${year}: ${String(error).replaceAll(serviceKey, "***")}`);
      process.exitCode = 1;
    }
    await sleep(FOREST_FIRE_API.REQUEST_INTERVAL_MS);
  }
};

main();
