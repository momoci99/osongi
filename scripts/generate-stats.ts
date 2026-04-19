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
const WEEKLY_FILE = join(OUTPUT_DIR, "weekly-manifest.json");

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
  regionAmountTotals: Record<string, number>;
  unionTotals: Record<string, number>;
}

interface SummaryOutputShape {
  generatedAt: string;
  latestDate: string | null;
  latestDaily: null | {
    totalQuantityTodayKg: number;
    topRegion: { region: string; quantityKg: number } | null;
    topUnion: { union: string; quantityKg: number } | null;
    topGradeByQuantity: { gradeKey: string; quantityKg: number } | null;
    gradeBreakdown: Array<{
      gradeKey: string;
      quantityKg: number;
      unitPriceWon: number;
    }>;
  };
}

interface WeeklyPriceDatum {
  date: string; // YYYY-MM-DD
  gradeKey: string; // grade1, grade2, etc.
  quantityKg: number;
  unitPriceWon: number;
}

interface WeeklyOutputShape {
  generatedAt: string;
  weeklyData: WeeklyPriceDatum[];
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
    regionAmountTotals: {},
    unionTotals: {},
  };
  unions.forEach((u) => {
    agg.totalQuantityKg += u.quantityTotal;
    agg.totalAmountWon += u.amountTotal;
    agg.unionTotals[u.union] =
      (agg.unionTotals[u.union] || 0) + u.quantityTotal;
    agg.regionTotals[u.region] =
      (agg.regionTotals[u.region] || 0) + u.quantityTotal;
    agg.regionAmountTotals[u.region] =
      (agg.regionAmountTotals[u.region] || 0) + u.amountTotal;
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
    // (averageUnitPriceWonPerKg removed per updated requirements)
    // We derive today's grade quantity by diff: grade.quantity today? Data has only cumulative? Actually gradeX.quantity is per-day (not cumulative) in snapshot context.
    const gradeKeys = [
      "grade1",
      "grade2",
      "grade3Stopped",
      "grade3Estimated",
      "gradeBelow",
      "mixedGrade",
    ] as const;
    const gradeAggregate: Record<
      string,
      { quantity: number; unitPrice: number; entries: number }
    > = {};
    for (const rec of raw) {
      const todayQty = parseNumber(rec.auctionQuantity.today);
      regionTotals[rec.region] = (regionTotals[rec.region] || 0) + todayQty;
      unionTotals[rec.union] = (unionTotals[rec.union] || 0) + todayQty;
      totalTodayQty += todayQty;
      for (const g of gradeKeys) {
        const gQty = parseNumber(rec[g].quantity);
        const unitPrice = parseNumber(rec[g].unitPrice); // 원/kg 가정
        const entry =
          gradeAggregate[g] ||
          (gradeAggregate[g] = { quantity: 0, unitPrice: 0, entries: 0 });
        entry.quantity += gQty;
        // 단가 평균: 단순 산술 평균 대신 가중 평균? 명세 모호 → 여기선 가중 평균(수량 기준)으로.
        // 누적 방식: sum(quantity*unitPrice) / totalQuantity 나중 계산
        entry.unitPrice += gQty * unitPrice; // 임시로 가중 합 저장
        entry.entries += gQty; // 가중치 누적
      }
    }
    const topRegionKV = pickTop(regionTotals);
    const topUnionKV = pickTop(unionTotals);
    const gradeBreakdown = Object.entries(gradeAggregate)
      .map(([gradeKey, v]) => ({
        gradeKey,
        quantityKg: parseFloat(v.quantity.toFixed(2)),
        unitPriceWon:
          v.entries > 0 ? parseFloat((v.unitPrice / v.entries).toFixed(2)) : 0,
      }))
      .sort((a, b) => a.gradeKey.localeCompare(b.gradeKey));
    const topGradeEntry = gradeBreakdown.reduce<{
      gradeKey: string;
      quantityKg: number;
    } | null>((acc, cur) => {
      if (!acc || cur.quantityKg > acc.quantityKg)
        return { gradeKey: cur.gradeKey, quantityKg: cur.quantityKg };
      return acc;
    }, null);

    latestDaily = {
      totalQuantityTodayKg: parseFloat(totalTodayQty.toFixed(2)),
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
      topGradeByQuantity: topGradeEntry,
      gradeBreakdown,
    };
  } catch (e) {
    console.error("Failed to process latest date file", e);
  }
}

// Weekly data generation (last 7 days from latest date)
const weeklyData: WeeklyPriceDatum[] = [];
if (latestDateParts) {
  const [latestY, latestM, latestD] = latestDateParts as [
    number,
    number,
    number
  ];
  const latestDate = new Date(latestY, latestM - 1, latestD); // JS Date uses 0-based months

  // Generate last 7 days (including latest)
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(latestDate);
    targetDate.setDate(latestDate.getDate() - i);

    const y = targetDate.getFullYear();
    const m = targetDate.getMonth() + 1; // Convert back to 1-based
    const d = targetDate.getDate();
    const dateStr = `${y.toString().padStart(4, "0")}-${m
      .toString()
      .padStart(2, "0")}-${d.toString().padStart(2, "0")}`;

    const dayFilePath = join(DATA_ROOT, String(y), String(m), `${d}.json`);

    try {
      const raw = JSON.parse(
        readFileSync(dayFilePath, "utf-8")
      ) as AuctionRecordRaw[];

      const gradeKeys = [
        "grade1",
        "grade2",
        "grade3Stopped",
        "grade3Estimated",
        "gradeBelow",
        "mixedGrade",
      ] as const;

      // Aggregate by grade for this day
      const dayGradeAgg: Record<
        string,
        { quantity: number; unitPriceSum: number; weightSum: number }
      > = {};

      for (const rec of raw) {
        for (const gradeKey of gradeKeys) {
          const qty = parseNumber(rec[gradeKey].quantity);
          const unitPrice = parseNumber(rec[gradeKey].unitPrice);

          if (qty > 0 && unitPrice > 0) {
            const entry =
              dayGradeAgg[gradeKey] ||
              (dayGradeAgg[gradeKey] = {
                quantity: 0,
                unitPriceSum: 0,
                weightSum: 0,
              });
            entry.quantity += qty;
            entry.unitPriceSum += qty * unitPrice; // Weighted sum for average
            entry.weightSum += qty; // Total weight for average calculation
          }
        }
      }

      // Convert to final format
      for (const [gradeKey, agg] of Object.entries(dayGradeAgg)) {
        if (agg.weightSum > 0) {
          weeklyData.push({
            date: dateStr,
            gradeKey,
            quantityKg: parseFloat(agg.quantity.toFixed(2)),
            unitPriceWon: parseFloat(
              (agg.unitPriceSum / agg.weightSum).toFixed(2)
            ),
          });
        }
      }
    } catch {
      console.warn(`No data found for ${dateStr}, skipping...`);
      // Skip missing days - chart can handle gaps
    }
  }
}

// ===== V2: Extended daily stats (region breakdown + day-over-day) =====
interface RegionGradeEntry {
  gradeKey: string;
  quantityKg: number;
  unitPriceWon: number;
}

interface DayOverDayChange {
  gradeKey: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
}

interface ExtendedDailyOutput {
  generatedAt: string;
  latestDate: string | null;
  latestDaily: SummaryOutputShape["latestDaily"] & {
    regionGradeBreakdown: Record<string, RegionGradeEntry[]>;
    previousDayComparison: {
      previousDate: string;
      gradeChanges: DayOverDayChange[];
    } | null;
  } | null;
}

// Find second-latest date for comparison
let secondLatestDateStr: string | null = null;
{
  const allDates: string[] = [];
  for (const year of listYears()) {
    const yearPath = join(DATA_ROOT, year);
    for (const month of listMonths(yearPath)) {
      const monthPath = join(yearPath, month);
      for (const dayFile of listDays(monthPath)) {
        const d = parseInt(dayFile.replace(".json", ""), 10);
        const m = parseInt(month, 10);
        const y = parseInt(year, 10);
        allDates.push(
          `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`
        );
      }
    }
  }
  allDates.sort();
  if (allDates.length >= 2 && latestDateStr) {
    const latestIdx = allDates.lastIndexOf(latestDateStr);
    if (latestIdx > 0) {
      secondLatestDateStr = allDates[latestIdx - 1];
    }
  }
}

// Build region-grade breakdown for latest date
const regionGradeBreakdown: Record<string, RegionGradeEntry[]> = {};
let previousDayComparison: ExtendedDailyOutput["latestDaily"] extends infer T
  ? T extends { previousDayComparison: infer P }
    ? P
    : never
  : never = null;

if (latestDateStr) {
  const [Y, M, D] = latestDateStr.split("-");
  const dayFilePath = join(DATA_ROOT, Y, String(parseInt(M, 10)), `${parseInt(D, 10)}.json`);
  try {
    const raw = JSON.parse(readFileSync(dayFilePath, "utf-8")) as AuctionRecordRaw[];
    const gradeKeys = ["grade1", "grade2", "grade3Stopped", "grade3Estimated", "gradeBelow", "mixedGrade"] as const;

    // Per-region aggregation
    const regionAgg: Record<string, Record<string, { qty: number; priceWeightedSum: number }>> = {};
    for (const rec of raw) {
      const region = rec.region;
      if (!regionAgg[region]) regionAgg[region] = {};
      for (const g of gradeKeys) {
        const qty = parseNumber(rec[g].quantity);
        const price = parseNumber(rec[g].unitPrice);
        if (qty > 0 && price > 0) {
          const entry = regionAgg[region][g] || (regionAgg[region][g] = { qty: 0, priceWeightedSum: 0 });
          entry.qty += qty;
          entry.priceWeightedSum += qty * price;
        }
      }
    }

    for (const [region, grades] of Object.entries(regionAgg)) {
      regionGradeBreakdown[region] = Object.entries(grades).map(([gradeKey, v]) => ({
        gradeKey,
        quantityKg: parseFloat(v.qty.toFixed(2)),
        unitPriceWon: v.qty > 0 ? parseFloat((v.priceWeightedSum / v.qty).toFixed(2)) : 0,
      }));
    }
  } catch {
    // ignore
  }

  // Day-over-day comparison
  if (secondLatestDateStr) {
    const [pY, pM, pD] = secondLatestDateStr.split("-");
    const prevFilePath = join(DATA_ROOT, pY, String(parseInt(pM, 10)), `${parseInt(pD, 10)}.json`);
    try {
      const prevRaw = JSON.parse(readFileSync(prevFilePath, "utf-8")) as AuctionRecordRaw[];
      const gradeKeys = ["grade1", "grade2", "grade3Stopped", "grade3Estimated", "gradeBelow", "mixedGrade"] as const;

      const prevGradeAgg: Record<string, { qty: number; priceWeightedSum: number }> = {};
      for (const rec of prevRaw) {
        for (const g of gradeKeys) {
          const qty = parseNumber(rec[g].quantity);
          const price = parseNumber(rec[g].unitPrice);
          if (qty > 0 && price > 0) {
            const entry = prevGradeAgg[g] || (prevGradeAgg[g] = { qty: 0, priceWeightedSum: 0 });
            entry.qty += qty;
            entry.priceWeightedSum += qty * price;
          }
        }
      }

      const gradeChanges: DayOverDayChange[] = [];
      const currentBreakdown = latestDaily?.gradeBreakdown || [];
      for (const cur of currentBreakdown) {
        const prev = prevGradeAgg[cur.gradeKey];
        const prevPrice = prev && prev.qty > 0 ? prev.priceWeightedSum / prev.qty : 0;
        const changePercent = prevPrice > 0 ? ((cur.unitPriceWon - prevPrice) / prevPrice) * 100 : 0;
        gradeChanges.push({
          gradeKey: cur.gradeKey,
          currentPrice: cur.unitPriceWon,
          previousPrice: parseFloat(prevPrice.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
        });
      }

      previousDayComparison = {
        previousDate: secondLatestDateStr,
        gradeChanges,
      };
    } catch {
      // ignore
    }
  }
}

// ===== V2: Season manifest =====
const SEASON_FILE = join(OUTPUT_DIR, "season-manifest.json");

interface SeasonSummary {
  year: number;
  startDate: string;
  endDate: string;
  totalQuantityKg: number;
  totalAmountWon: number;
  avgPricePerKg: number;
  highestPrice: { date: string; gradeKey: string; price: number } | null;
  lowestPrice: { date: string; gradeKey: string; price: number } | null;
}

interface MonthlyPattern {
  month: number;
  avgQuantityKg: number;
  avgPriceWon: number;
  yearCount: number;
}

interface RegionRanking {
  region: string;
  avgPriceWon: number;
  totalQuantityKg: number;
}

// Collect season data (months 8-12 for each year)
const seasonData: Record<string, {
  dates: string[];
  totalQty: number;
  totalAmt: number;
  gradeEntries: { date: string; gradeKey: string; price: number }[];
  regionAgg: Record<string, { qty: number; priceWeightedSum: number }>;
  monthAgg: Record<number, { qty: number; priceWeightedSum: number; days: number }>;
}> = {};

for (const year of listYears()) {
  const yearPath = join(DATA_ROOT, year);
  for (const month of listMonths(yearPath)) {
    const monthNum = parseInt(month, 10);
    if (monthNum < 8 || monthNum > 12) continue; // Season months only
    const monthPath = join(yearPath, month);
    for (const dayFile of listDays(monthPath)) {
      const d = parseInt(dayFile.replace(".json", ""), 10);
      const dateStr = `${year}-${month.padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
      const dayPath = join(monthPath, dayFile);
      let raw: AuctionRecordRaw[] = [];
      try {
        raw = JSON.parse(readFileSync(dayPath, "utf-8")) as AuctionRecordRaw[];
      } catch {
        continue;
      }
      if (raw.length === 0) continue;

      if (!seasonData[year]) {
        seasonData[year] = { dates: [], totalQty: 0, totalAmt: 0, gradeEntries: [], regionAgg: {}, monthAgg: {} };
      }
      const sd = seasonData[year];
      sd.dates.push(dateStr);

      const gradeKeys = ["grade1", "grade2", "grade3Stopped", "grade3Estimated", "gradeBelow", "mixedGrade"] as const;
      let dayQty = 0;
      let dayAmt = 0;

      for (const rec of raw) {
        const todayQty = parseNumber(rec.auctionQuantity.today);
        const todayAmt = parseNumber(rec.auctionAmount.today);
        dayQty += todayQty;
        dayAmt += todayAmt;

        // Region aggregation
        const rEntry = sd.regionAgg[rec.region] || (sd.regionAgg[rec.region] = { qty: 0, priceWeightedSum: 0 });
        for (const g of gradeKeys) {
          const qty = parseNumber(rec[g].quantity);
          const price = parseNumber(rec[g].unitPrice);
          if (qty > 0 && price > 0) {
            rEntry.qty += qty;
            rEntry.priceWeightedSum += qty * price;
            sd.gradeEntries.push({ date: dateStr, gradeKey: g, price });
          }
        }
      }

      sd.totalQty += dayQty;
      sd.totalAmt += dayAmt;

      // Monthly aggregation
      const mEntry = sd.monthAgg[monthNum] || (sd.monthAgg[monthNum] = { qty: 0, priceWeightedSum: 0, days: 0 });
      mEntry.qty += dayQty;
      mEntry.days += 1;
      // For monthly avg price, use grade-level weighted data
      for (const rec of raw) {
        for (const g of gradeKeys) {
          const qty = parseNumber(rec[g].quantity);
          const price = parseNumber(rec[g].unitPrice);
          if (qty > 0 && price > 0) {
            mEntry.priceWeightedSum += qty * price;
          }
        }
      }
    }
  }
}

// Build latest season summary
let latestSeasonSummary: SeasonSummary | null = null;
const seasonYears = Object.keys(seasonData).map(Number).sort((a, b) => b - a);
if (seasonYears.length > 0) {
  const latestSeasonYear = seasonYears[0];
  const sd = seasonData[String(latestSeasonYear)];
  sd.dates.sort();
  const avgPrice = sd.totalQty > 0 ? sd.totalAmt / sd.totalQty : 0;

  let highest: SeasonSummary["highestPrice"] = null;
  let lowest: SeasonSummary["lowestPrice"] = null;
  for (const entry of sd.gradeEntries) {
    if (!highest || entry.price > highest.price) {
      highest = { date: entry.date, gradeKey: entry.gradeKey, price: entry.price };
    }
    if (!lowest || (entry.price < lowest.price && entry.price > 0)) {
      lowest = { date: entry.date, gradeKey: entry.gradeKey, price: entry.price };
    }
  }

  latestSeasonSummary = {
    year: latestSeasonYear,
    startDate: sd.dates[0],
    endDate: sd.dates[sd.dates.length - 1],
    totalQuantityKg: parseFloat(sd.totalQty.toFixed(2)),
    totalAmountWon: parseFloat(sd.totalAmt.toFixed(2)),
    avgPricePerKg: parseFloat(avgPrice.toFixed(2)),
    highestPrice: highest,
    lowestPrice: lowest,
  };
}

// Build monthly patterns (cross-year average)
const monthlyAccumulator: Record<number, { totalQty: number; totalPriceWeighted: number; totalDays: number; yearCount: number }> = {};
for (const [, sd] of Object.entries(seasonData)) {
  for (const [monthStr, mAgg] of Object.entries(sd.monthAgg)) {
    const month = parseInt(monthStr, 10);
    const entry = monthlyAccumulator[month] || (monthlyAccumulator[month] = { totalQty: 0, totalPriceWeighted: 0, totalDays: 0, yearCount: 0 });
    entry.totalQty += mAgg.qty;
    entry.totalPriceWeighted += mAgg.priceWeightedSum;
    entry.totalDays += mAgg.days;
    entry.yearCount += 1;
  }
}

const monthlyPatterns: MonthlyPattern[] = Object.entries(monthlyAccumulator)
  .map(([monthStr, acc]) => ({
    month: parseInt(monthStr, 10),
    avgQuantityKg: acc.yearCount > 0 ? parseFloat((acc.totalQty / acc.yearCount).toFixed(2)) : 0,
    avgPriceWon: acc.totalQty > 0 ? parseFloat((acc.totalPriceWeighted / acc.totalQty).toFixed(2)) : 0,
    yearCount: acc.yearCount,
  }))
  .sort((a, b) => a.month - b.month);

// Region ranking (latest season)
const regionRanking: RegionRanking[] = [];
if (seasonYears.length > 0) {
  const sd = seasonData[String(seasonYears[0])];
  for (const [region, agg] of Object.entries(sd.regionAgg)) {
    regionRanking.push({
      region,
      avgPriceWon: agg.qty > 0 ? parseFloat((agg.priceWeightedSum / agg.qty).toFixed(2)) : 0,
      totalQuantityKg: parseFloat(agg.qty.toFixed(2)),
    });
  }
  regionRanking.sort((a, b) => b.avgPriceWon - a.avgPriceWon);
}

// Region-specific season summaries (latest season)
const regionSeasonSummaries: Record<string, { totalQuantityKg: number; totalAmountWon: number; avgPricePerKg: number }> = {};
if (seasonYears.length > 0) {
  const sd = seasonData[String(seasonYears[0])];
  for (const [region, agg] of Object.entries(sd.regionAgg)) {
    regionSeasonSummaries[region] = {
      totalQuantityKg: parseFloat(agg.qty.toFixed(2)),
      totalAmountWon: parseFloat(agg.priceWeightedSum.toFixed(2)),
      avgPricePerKg: agg.qty > 0 ? parseFloat((agg.priceWeightedSum / agg.qty).toFixed(2)) : 0,
    };
  }
}

const seasonManifest = {
  generatedAt: new Date().toISOString(),
  latestSeasonSummary,
  regionSeasonSummaries,
  monthlyPatterns,
  regionRanking,
};

// ===== End V2 extensions =====

// Build region-yearly data: { "강원": { "2013": { qty, amt }, ... }, ... }
const regionYearly: Record<string, Record<string, { totalQuantityKg: number; totalAmountWon: number }>> = {};
for (const [year, agg] of Object.entries(yearlyAgg)) {
  for (const [region, qty] of Object.entries(agg.regionTotals)) {
    if (!regionYearly[region]) regionYearly[region] = {};
    regionYearly[region][year] = {
      totalQuantityKg: parseFloat(qty.toFixed(2)),
      totalAmountWon: parseFloat((agg.regionAmountTotals[region] || 0).toFixed(2)),
    };
  }
}

const yearlyOutput = {
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
  regionYearly,
};

const summaryOutput = {
  generatedAt: new Date().toISOString(),
  latestDate: latestDateStr,
  latestDaily: latestDaily
    ? {
        ...latestDaily,
        regionGradeBreakdown,
        previousDayComparison,
      }
    : null,
};

const weeklyOutput: WeeklyOutputShape = {
  generatedAt: new Date().toISOString(),
  weeklyData,
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(YEARLY_FILE, JSON.stringify(yearlyOutput, null, 2));
writeFileSync(OUTPUT_FILE, JSON.stringify(summaryOutput, null, 2));
writeFileSync(WEEKLY_FILE, JSON.stringify(weeklyOutput, null, 2));
writeFileSync(SEASON_FILE, JSON.stringify(seasonManifest, null, 2));
console.log(
  "Auction stats written to",
  OUTPUT_FILE,
  ",",
  YEARLY_FILE,
  ",",
  WEEKLY_FILE,
  "and",
  SEASON_FILE
);
