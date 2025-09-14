#!/usr/bin/env node
/*
  Generate aggregated mushroom auction stats from existing JSON snapshots.
  Output: public/auction-stats/summary.json
*/
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

// Basic raw type (duplicate minimal subset to avoid TS path mapping in simple script execution)
interface AuctionRecordRaw {
  region: string;
  union: string;
  date?: string;
  auctionQuantity: { untilYesterday: string; today: string; total: string };
  auctionAmount: { untilYesterday: string; today: string; total: string };
  grade1: { quantity: string; unitPrice: string };
  grade2: { quantity: string; unitPrice: string };
  grade3Stopped: { quantity: string; unitPrice: string };
  grade3Estimated: { quantity: string; unitPrice: string };
  gradeBelow: { quantity: string; unitPrice: string };
  mixedGrade: { quantity: string; unitPrice: string };
}

const DATA_ROOT = join(process.cwd(), "public", "auction-data");
const OUTPUT_DIR = join(process.cwd(), "public", "auction-stats");
const OUTPUT_FILE = join(OUTPUT_DIR, "daily-manifest.json");
const YEARLY_FILE = join(OUTPUT_DIR, "yearly-manifest.json");

function parseNumber(str: string | undefined): number {
  if (!str) return 0;
  const cleaned = str.replace(/[\s,]/g, "").replace(/(kg|원)$/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function listYears(): string[] {
  return readdirSync(DATA_ROOT).filter((name) => /^\d{4}$/.test(name));
}

function listMonths(yearPath: string): string[] {
  return readdirSync(yearPath).filter((name) => /^\d{1,2}$/.test(name));
}

function listDays(monthPath: string): string[] {
  return readdirSync(monthPath).filter((name) => name.endsWith(".json"));
}

// Aggregation containers
interface YearlyAggregation {
  totalQuantityKg: number;
  totalAmountWon: number;
  regionTotals: Record<string, number>;
  unionTotals: Record<string, number>;
}

interface SummaryOutputShape {
  generatedAt: string;
  latestDate: string | null;
  latestDaily: null | {
    totalQuantityTodayKg: number;
    averageUnitPriceWonPerKg: number;
    topRegion: { region: string; quantityKg: number } | null;
    topUnion: { union: string; quantityKg: number } | null;
  };
}

interface YearlyOutputShape {
  generatedAt: string;
  yearly: Record<
    string,
    {
      totalQuantityKg: number;
      totalAmountWon: number;
      topRegion: { region: string; quantityKg: number } | null;
      topUnion: { union: string; quantityKg: number } | null;
    }
  >;
}

const yearlyAgg: Record<string, YearlyAggregation> = {};

// Track latest date components
let latestDateStr: string | null = null; // YYYY-MM-DD
let latestDateParts: [number, number, number] | null = null;

function updateLatestDate(y: number, m: number, d: number) {
  if (!latestDateParts) {
    latestDateParts = [y, m, d];
    latestDateStr = `${y.toString().padStart(4, "0")}-${m
      .toString()
      .padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
    return;
  }
  const [cy, cm, cd] = latestDateParts;
  if (y > cy || (y === cy && (m > cm || (m === cm && d > cd)))) {
    latestDateParts = [y, m, d];
    latestDateStr = `${y.toString().padStart(4, "0")}-${m
      .toString()
      .padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
  }
}

// (Removed initial naive pass: replaced by single pass building yearUnionMax and latest date.)

// Rethink approach for yearly: Need second structure capturing per-year, per-union max totals.
interface YearUnionMax {
  quantityTotal: number;
  amountTotal: number;
  region: string;
  union: string;
}
const yearUnionMax: Record<string, Record<string, YearUnionMax>> = {};

// Re-run with proper logic
for (const year of listYears()) {
  const yearPath = join(DATA_ROOT, year);
  for (const month of listMonths(yearPath)) {
    const monthNum = parseInt(month, 10);
    const monthPath = join(yearPath, month);
    for (const dayFile of listDays(monthPath)) {
      if (!dayFile.endsWith(".json")) continue;
      const day = parseInt(dayFile.replace(".json", ""), 10);
      updateLatestDate(parseInt(year, 10), monthNum, day);
      const dayPath = join(monthPath, dayFile);
      let raw: AuctionRecordRaw[] = [];
      try {
        raw = JSON.parse(readFileSync(dayPath, "utf-8")) as AuctionRecordRaw[];
      } catch (e) {
        console.error("Failed parsing", dayPath, e);
        continue;
      }
      const yearMap = yearUnionMax[year] || (yearUnionMax[year] = {});
      for (const rec of raw) {
        const unionKey = rec.union;
        const qTotal = parseNumber(rec.auctionQuantity.total);
        const aTotal = parseNumber(rec.auctionAmount.total);
        const existing = yearMap[unionKey];
        if (
          !existing ||
          qTotal > existing.quantityTotal ||
          aTotal > existing.amountTotal
        ) {
          yearMap[unionKey] = {
            quantityTotal: qTotal,
            amountTotal: aTotal,
            region: rec.region,
            union: rec.union,
          };
        }
      }
    }
  }
}

// Build yearly aggregation from union max snapshots
for (const year of Object.keys(yearUnionMax)) {
  const unions = Object.values(yearUnionMax[year]);
  const agg: YearlyAggregation = {
    totalQuantityKg: 0,
    totalAmountWon: 0,
    regionTotals: {},
    unionTotals: {},
  };
  unions.forEach((u) => {
    agg.totalQuantityKg += u.quantityTotal;
    agg.totalAmountWon += u.amountTotal;
    agg.unionTotals[u.union] =
      (agg.unionTotals[u.union] || 0) + u.quantityTotal;
    agg.regionTotals[u.region] =
      (agg.regionTotals[u.region] || 0) + u.quantityTotal;
  });
  yearlyAgg[year] = agg;
}

function pickTop(
  obj: Record<string, number>
): { key: string; value: number } | null {
  let topKey: string | null = null;
  let topVal = -Infinity;
  for (const [k, v] of Object.entries(obj)) {
    if (v > topVal) {
      topVal = v;
      topKey = k;
    }
  }
  return topKey ? { key: topKey, value: topVal } : null;
}

// Latest daily stats
let latestDaily: SummaryOutputShape["latestDaily"] = null;
if (latestDateStr) {
  // Parse components (assert string)
  const [Y, M, D] = (latestDateStr as string).split("-");
  const latestFilePath = join(
    DATA_ROOT,
    Y,
    String(parseInt(M, 10)),
    `${parseInt(D, 10)}.json`
  );
  try {
    const raw = JSON.parse(
      readFileSync(latestFilePath, "utf-8")
    ) as AuctionRecordRaw[];
    const regionTotals: Record<string, number> = {};
    const unionTotals: Record<string, number> = {};
    let totalTodayQty = 0;
    let weightedAmount = 0; // sum( gradeTodayQty * unitPrice )
    // We derive today's grade quantity by diff: grade.quantity today? Data has only cumulative? Actually gradeX.quantity is per-day (not cumulative) in snapshot context.
    const gradeKeys = [
      "grade1",
      "grade2",
      "grade3Stopped",
      "grade3Estimated",
      "gradeBelow",
      "mixedGrade",
    ] as const;
    for (const rec of raw) {
      const todayQty = parseNumber(rec.auctionQuantity.today);
      regionTotals[rec.region] = (regionTotals[rec.region] || 0) + todayQty;
      unionTotals[rec.union] = (unionTotals[rec.union] || 0) + todayQty;
      totalTodayQty += todayQty;
      for (const g of gradeKeys) {
        const gQty = parseNumber(rec[g].quantity);
        const unitPrice = parseNumber(rec[g].unitPrice); // 원/kg 가정
        weightedAmount += gQty * unitPrice;
      }
    }
    const topRegionKV = pickTop(regionTotals);
    const topUnionKV = pickTop(unionTotals);
    latestDaily = {
      totalQuantityTodayKg: parseFloat(totalTodayQty.toFixed(2)),
      averageUnitPriceWonPerKg:
        totalTodayQty > 0
          ? parseFloat((weightedAmount / totalTodayQty).toFixed(2))
          : 0,
      topRegion: topRegionKV
        ? {
            region: topRegionKV.key,
            quantityKg: parseFloat(topRegionKV.value.toFixed(2)),
          }
        : null,
      topUnion: topUnionKV
        ? {
            union: topUnionKV.key,
            quantityKg: parseFloat(topUnionKV.value.toFixed(2)),
          }
        : null,
    };
  } catch (e) {
    console.error("Failed to process latest date file", e);
  }
}

const yearlyOutput: YearlyOutputShape = {
  generatedAt: new Date().toISOString(),
  yearly: Object.fromEntries(
    Object.entries(yearlyAgg).map(([year, agg]) => {
      const topRegion = pickTop(agg.regionTotals);
      const topUnion = pickTop(agg.unionTotals);
      return [
        year,
        {
          totalQuantityKg: parseFloat(agg.totalQuantityKg.toFixed(2)),
          totalAmountWon: parseFloat(agg.totalAmountWon.toFixed(2)),
          topRegion: topRegion
            ? {
                region: topRegion.key,
                quantityKg: parseFloat(topRegion.value.toFixed(2)),
              }
            : null,
          topUnion: topUnion
            ? {
                union: topUnion.key,
                quantityKg: parseFloat(topUnion.value.toFixed(2)),
              }
            : null,
        },
      ];
    })
  ),
};

const summaryOutput: SummaryOutputShape = {
  generatedAt: new Date().toISOString(),
  latestDate: latestDateStr,
  latestDaily,
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(YEARLY_FILE, JSON.stringify(yearlyOutput, null, 2));
writeFileSync(OUTPUT_FILE, JSON.stringify(summaryOutput, null, 2));
console.log("Auction stats written to", OUTPUT_FILE, "and", YEARLY_FILE);
