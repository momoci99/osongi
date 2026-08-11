#!/usr/bin/env node
/*
  지역·조합별 통계 생성기 → public/auction-stats/region-manifest.json

  지역·조합 상세 페이지(/region/경북, /region/경북/봉화)와 프리렌더가 함께 쓰는 단일 소스다.
  기존 generate-stats.ts 는 전국 단위 집계라 조합 단위 지표가 없어 별도 스크립트로 분리했다.

  실행: npm run generate-region-stats (빌드 전 자동 실행)
*/
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { AVAILABLE_REGIONS, REGION_UNION_MAP } from "../src/const/Common";
import { MUSHROOM_SEASON } from "../src/const/Numbers";
import type {
  GradeStat,
  RegionManifest,
  RegionScopeStats,
  ScopeStats,
  YearStat,
} from "../src/types/region";

/** 원본 스냅샷 레코드 (스크립트 실행 단순화를 위해 최소 필드만 중복 선언) */
type AuctionRecordRaw = {
  region: string;
  union: string;
  auctionQuantity: { today: string; total: string };
  auctionAmount: { today: string; total: string };
} & Record<string, { quantity: string; unitPrice: string } | unknown>;

const DATA_ROOT = join(process.cwd(), "public", "auction-data");
const OUTPUT_DIR = join(process.cwd(), "public", "auction-stats");
const OUTPUT_FILE = join(OUTPUT_DIR, "region-manifest.json");

const GRADE_KEYS = [
  "grade1",
  "grade2",
  "grade3Stopped",
  "grade3Estimated",
  "gradeBelow",
  "mixedGrade",
] as const;

/** "4,888.34kg" → 4888.34 */
const parseNumber = (value: string | undefined): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[\s,]/g, "").replace(/(kg|원)$/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const numericNames = (dir: string, pattern: RegExp): string[] =>
  readdirSync(dir).filter((name) => pattern.test(name));

/** 누적 컨테이너: 스코프(지역 또는 조합) 단위 */
type ScopeAccumulator = {
  /** 연도 → 물량·금액 누적 */
  yearly: Map<number, { quantityKg: number; amountWon: number }>;
  /** 최신 시즌의 등급별 누적 (물량, 가중 단가 합) */
  seasonGrades: Map<string, { quantityKg: number; priceWeightedSum: number }>;
  seasonDates: Set<string>;
  seasonQuantityKg: number;
  seasonAmountWon: number;
  /** 최신 시즌 최고 단가 */
  peak: { date: string; gradeKey: string; priceWon: number } | null;
  /** 최신 데이터 날짜의 등급별 스냅샷 */
  latestDaily: {
    date: string;
    totalQuantityKg: number;
    grades: Map<string, { quantityKg: number; unitPriceWon: number }>;
  } | null;
};

const createAccumulator = (): ScopeAccumulator => ({
  yearly: new Map(),
  seasonGrades: new Map(),
  seasonDates: new Set(),
  seasonQuantityKg: 0,
  seasonAmountWon: 0,
  peak: null,
  latestDaily: null,
});

type DayRecord = {
  date: string;
  year: number;
  records: AuctionRecordRaw[];
};

/** auction-data 전체를 날짜 오름차순으로 읽는다 */
const readAllDays = (): DayRecord[] => {
  const days: DayRecord[] = [];

  for (const year of numericNames(DATA_ROOT, /^\d{4}$/)) {
    const yearPath = join(DATA_ROOT, year);
    for (const month of numericNames(yearPath, /^\d{1,2}$/)) {
      const monthPath = join(yearPath, month);
      for (const dayFile of numericNames(monthPath, /^\d{1,2}\.json$/)) {
        const day = parseInt(dayFile.replace(".json", ""), 10);
        const date = `${year}-${month.padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        try {
          const records = JSON.parse(
            readFileSync(join(monthPath, dayFile), "utf-8")
          ) as AuctionRecordRaw[];
          if (records.length > 0) days.push({ date, year: Number(year), records });
        } catch (error) {
          console.error("파싱 실패:", join(monthPath, dayFile), error);
        }
      }
    }
  }

  return days.sort((a, b) => a.date.localeCompare(b.date));
};

const gradeEntry = (record: AuctionRecordRaw, gradeKey: string) => {
  const raw = record[gradeKey] as { quantity: string; unitPrice: string } | undefined;
  return {
    quantityKg: parseNumber(raw?.quantity),
    unitPriceWon: parseNumber(raw?.unitPrice),
  };
};

/**
 * 하루치 레코드를 스코프 누적기에 반영한다.
 * 시즌(8~12월) 지표는 최신 시즌에만 누적하고, 연도별 지표는 전 연도를 누적한다.
 */
const accumulate = (
  accumulator: ScopeAccumulator,
  day: DayRecord,
  records: AuctionRecordRaw[],
  options: { isLatestSeason: boolean; isLatestDate: boolean; inSeasonMonth: boolean }
): void => {
  const yearBucket =
    accumulator.yearly.get(day.year) ??
    (() => {
      const created = { quantityKg: 0, amountWon: 0 };
      accumulator.yearly.set(day.year, created);
      return created;
    })();

  let dayQuantityKg = 0;
  const dailyGrades = new Map<string, { quantityKg: number; unitPriceWon: number }>();

  for (const record of records) {
    const todayQuantityKg = parseNumber(record.auctionQuantity.today);
    const todayAmountWon = parseNumber(record.auctionAmount.today);

    yearBucket.quantityKg += todayQuantityKg;
    yearBucket.amountWon += todayAmountWon;
    dayQuantityKg += todayQuantityKg;

    if (options.isLatestSeason && options.inSeasonMonth) {
      accumulator.seasonQuantityKg += todayQuantityKg;
      accumulator.seasonAmountWon += todayAmountWon;
      accumulator.seasonDates.add(day.date);
    }

    for (const gradeKey of GRADE_KEYS) {
      const { quantityKg, unitPriceWon } = gradeEntry(record, gradeKey);
      if (quantityKg <= 0 || unitPriceWon <= 0) continue;

      if (options.isLatestSeason && options.inSeasonMonth) {
        const bucket =
          accumulator.seasonGrades.get(gradeKey) ??
          (() => {
            const created = { quantityKg: 0, priceWeightedSum: 0 };
            accumulator.seasonGrades.set(gradeKey, created);
            return created;
          })();
        bucket.quantityKg += quantityKg;
        bucket.priceWeightedSum += quantityKg * unitPriceWon;

        if (!accumulator.peak || unitPriceWon > accumulator.peak.priceWon) {
          accumulator.peak = { date: day.date, gradeKey, priceWon: unitPriceWon };
        }
      }

      if (options.isLatestDate) {
        const existing = dailyGrades.get(gradeKey);
        if (existing) {
          const totalQuantityKg = existing.quantityKg + quantityKg;
          existing.unitPriceWon =
            (existing.unitPriceWon * existing.quantityKg + unitPriceWon * quantityKg) /
            totalQuantityKg;
          existing.quantityKg = totalQuantityKg;
        } else {
          dailyGrades.set(gradeKey, { quantityKg, unitPriceWon });
        }
      }
    }
  }

  if (options.isLatestDate) {
    accumulator.latestDaily = {
      date: day.date,
      totalQuantityKg: dayQuantityKg,
      grades: dailyGrades,
    };
  }
};

const toGradeStats = (
  grades: Map<string, { quantityKg: number; priceWeightedSum: number }>
): GradeStat[] =>
  GRADE_KEYS.flatMap((gradeKey) => {
    const bucket = grades.get(gradeKey);
    if (!bucket || bucket.quantityKg <= 0) return [];
    return [
      {
        gradeKey,
        quantityKg: round(bucket.quantityKg),
        avgUnitPriceWon: Math.round(bucket.priceWeightedSum / bucket.quantityKg),
      },
    ];
  });

const toYearStats = (
  yearly: Map<number, { quantityKg: number; amountWon: number }>
): YearStat[] =>
  [...yearly.entries()]
    .filter(([, value]) => value.quantityKg > 0)
    .sort((a, b) => a[0] - b[0])
    .map(([year, value]) => ({
      year,
      totalQuantityKg: round(value.quantityKg),
      totalAmountWon: Math.round(value.amountWon),
      avgPricePerKg: Math.round(value.amountWon / value.quantityKg),
    }));

const toScopeStats = (
  name: string,
  region: string,
  accumulator: ScopeAccumulator,
  latestSeasonYear: number
): ScopeStats => {
  const seasonDates = [...accumulator.seasonDates].sort();
  const latestDaily = accumulator.latestDaily;

  return {
    name,
    region,
    latestSeasonYear,
    season:
      accumulator.seasonQuantityKg > 0
        ? {
            startDate: seasonDates[0],
            endDate: seasonDates[seasonDates.length - 1],
            totalQuantityKg: round(accumulator.seasonQuantityKg),
            totalAmountWon: Math.round(accumulator.seasonAmountWon),
            avgPricePerKg: Math.round(
              accumulator.seasonAmountWon / accumulator.seasonQuantityKg
            ),
          }
        : null,
    grades: toGradeStats(accumulator.seasonGrades),
    yearly: toYearStats(accumulator.yearly),
    peak: accumulator.peak
      ? { ...accumulator.peak, priceWon: Math.round(accumulator.peak.priceWon) }
      : null,
    latestDaily: latestDaily
      ? {
          date: latestDaily.date,
          totalQuantityKg: round(latestDaily.totalQuantityKg),
          grades: [...latestDaily.grades.entries()].map(([gradeKey, value]) => ({
            gradeKey,
            quantityKg: round(value.quantityKg),
            avgUnitPriceWon: Math.round(value.unitPriceWon),
          })),
        }
      : null,
  };
};

const days = readAllDays();
if (days.length === 0) {
  throw new Error("auction-data 가 비어 있어 region-manifest 를 생성할 수 없다.");
}

const latestDate = days[days.length - 1].date;
const latestSeasonYear = Number(latestDate.slice(0, 4));

const regionAccumulators = new Map<string, ScopeAccumulator>();
const unionAccumulators = new Map<string, ScopeAccumulator>();
/** 조합명이 여러 지역에 등장할 경우를 대비해 실제 데이터의 소속 지역을 기록 */
const unionRegion = new Map<string, string>();

for (const day of days) {
  const month = Number(day.date.slice(5, 7));
  const inSeasonMonth =
    month >= MUSHROOM_SEASON.START_MONTH && month <= MUSHROOM_SEASON.END_MONTH;
  const isLatestSeason = day.year === latestSeasonYear;
  const isLatestDate = day.date === latestDate;

  const byRegion = new Map<string, AuctionRecordRaw[]>();
  const byUnion = new Map<string, AuctionRecordRaw[]>();

  for (const record of day.records) {
    if (!record.region || !record.union) continue;
    unionRegion.set(record.union, record.region);
    const regionBucket = byRegion.get(record.region) ?? [];
    regionBucket.push(record);
    byRegion.set(record.region, regionBucket);
    const unionBucket = byUnion.get(record.union) ?? [];
    unionBucket.push(record);
    byUnion.set(record.union, unionBucket);
  }

  for (const [region, records] of byRegion) {
    const accumulator = regionAccumulators.get(region) ?? createAccumulator();
    regionAccumulators.set(region, accumulator);
    accumulate(accumulator, day, records, { isLatestSeason, isLatestDate, inSeasonMonth });
  }

  for (const [union, records] of byUnion) {
    const accumulator = unionAccumulators.get(union) ?? createAccumulator();
    unionAccumulators.set(union, accumulator);
    accumulate(accumulator, day, records, { isLatestSeason, isLatestDate, inSeasonMonth });
  }
}

/**
 * 페이지 생성 대상은 큐레이션된 REGION_UNION_MAP 으로 제한한다.
 * 원본에 한때 등장했다 사라진 조합까지 페이지를 만들면 빈 페이지가 색인된다.
 */
const unions: Record<string, ScopeStats> = {};
for (const region of AVAILABLE_REGIONS) {
  for (const union of REGION_UNION_MAP[region]) {
    const accumulator = unionAccumulators.get(union);
    if (!accumulator) continue;
    const stats = toScopeStats(
      union,
      unionRegion.get(union) ?? region,
      accumulator,
      latestSeasonYear
    );
    if (stats.yearly.length === 0) continue;
    unions[union] = stats;
  }
}

/** 최신 시즌 물량 기준 전국 조합 순위 */
const rankedUnions = Object.values(unions)
  .filter((stats) => stats.season !== null)
  .sort((a, b) => (b.season?.totalQuantityKg ?? 0) - (a.season?.totalQuantityKg ?? 0));

rankedUnions.forEach((stats, index) => {
  stats.quantityRank = { rank: index + 1, of: rankedUnions.length };
});

const regions: Record<string, RegionScopeStats> = {};
for (const region of AVAILABLE_REGIONS) {
  const accumulator = regionAccumulators.get(region);
  if (!accumulator) continue;
  const unionNames = REGION_UNION_MAP[region].filter((union) => unions[union]);
  regions[region] = {
    ...toScopeStats(region, region, accumulator, latestSeasonYear),
    unions: unionNames,
  };
}

const manifest: RegionManifest = {
  generatedAt: new Date().toISOString(),
  latestDate,
  latestSeasonYear,
  regions,
  unions,
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), "utf-8");
console.log(
  `생성: public/auction-stats/region-manifest.json (지역 ${Object.keys(regions).length}개, 조합 ${Object.keys(unions).length}개, 최신 ${latestDate})`
);
