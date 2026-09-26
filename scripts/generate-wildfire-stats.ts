#!/usr/bin/env node
/*
  산불 원본(data/wildfire/raw) + 공식 보정표 → 조합별 대형 산불 표식 (public/wildfire/union-fires.json)

  실행: npm run generate-wildfire-stats
*/
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { REGION_UNION_MAP } from "../src/const/Common";
import { LARGE_FIRE_MIN_HA, WILDFIRE_PUBLIC_PATH } from "../src/const/Wildfire";
import type { ForestFire } from "../src/utils/wildfire/forestFireApi";
import {
  buildUnionFireMarks,
  type MajorFireOverride,
  type UnionFireFile,
} from "../src/utils/wildfire/unionFires";

const DATA_ROOT = join(process.cwd(), "data", "wildfire");
const RAW_ROOT = join(DATA_ROOT, "raw");
const OVERRIDES_PATH = join(DATA_ROOT, "major-fire-overrides.json");
const OUTPUT_PATH = join(process.cwd(), "public", WILDFIRE_PUBLIC_PATH);

const main = () => {
  if (!existsSync(RAW_ROOT)) {
    console.error("❌ data/wildfire/raw 가 없습니다. 먼저 npm run collect-wildfire 를 실행하세요.");
    process.exit(1);
  }
  const fires = readdirSync(RAW_ROOT)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => (JSON.parse(readFileSync(join(RAW_ROOT, name), "utf-8")) as { fires: ForestFire[] }).fires);
  const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, "utf-8")) as MajorFireOverride[];
  const unions = Object.entries(REGION_UNION_MAP).flatMap(([region, names]) =>
    names.map((union) => ({ region, union })),
  );

  const file: UnionFireFile = {
    generatedAt: new Date().toISOString(),
    minDamageHa: LARGE_FIRE_MIN_HA,
    unions: buildUnionFireMarks(fires, overrides, unions, LARGE_FIRE_MIN_HA),
  };
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(file)}\n`);

  const count = Object.values(file.unions).reduce((sum, marks) => sum + marks.length, 0);
  console.log(`✅ 조합 ${Object.keys(file.unions).length}곳 · 산불 표식 ${count}개 → public${WILDFIRE_PUBLIC_PATH}`);
};

main();
