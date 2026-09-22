#!/usr/bin/env node
/*
  기상 공개 파일 생성기 → public/weather/{stationId}.json

  data/weather/raw 원본을 분석 탐색기 날씨 뷰가 쓰는 지점별 일별 배열로 가공한다.
  지점당 전 연도를 한 파일에 담아, 조합을 고르면 해당 지점 파일만 지연 로딩한다.

  실행: npm run generate-weather-stats (collect-weather 뒤)
*/
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { buildStationWeatherFile } from "../src/utils/weather/publicWeather";
import type { KmaRawYearFile } from "../src/utils/weather/kmaAsos";

const RAW_ROOT = join(process.cwd(), "data", "weather", "raw");
const OUTPUT_ROOT = join(process.cwd(), "public", "weather");

const main = () => {
  if (!existsSync(RAW_ROOT)) {
    console.error("❌ data/weather/raw 가 없습니다. 먼저 npm run collect-weather 를 실행하세요.");
    process.exit(1);
  }
  mkdirSync(OUTPUT_ROOT, { recursive: true });
  const generatedAt = new Date().toISOString();

  const stationIds = readdirSync(RAW_ROOT).filter((name) => /^\d+$/.test(name));
  for (const id of stationIds) {
    const raws = readdirSync(join(RAW_ROOT, id))
      .filter((name) => name.endsWith(".json"))
      .map((name) => JSON.parse(readFileSync(join(RAW_ROOT, id, name), "utf-8")) as KmaRawYearFile);
    const file = buildStationWeatherFile(Number(id), raws, generatedAt);
    writeFileSync(join(OUTPUT_ROOT, `${id}.json`), JSON.stringify(file));
  }
  console.log(`✅ 기상 공개 파일 ${stationIds.length}개 생성 → public/weather/`);
};

main();
