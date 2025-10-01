#!/usr/bin/env node
/*
  Generate complete unified dataset from all individual JSON files.
  This combines all daily auction data into a single file for IndexedDB.
  
  Output: public/auction-data/complete-dataset.json
*/

import {
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
} from "fs";
import { join } from "path";

// Raw auction record type (matching existing data structure)
interface AuctionRecordRaw {
  region: string;
  union: string;
  date?: string;
  lastUpdated?: string;
  auctionQuantity: { untilYesterday: string; today: string; total: string };
  auctionAmount: { untilYesterday: string; today: string; total: string };
  grade1: { quantity: string; unitPrice: string };
  grade2: { quantity: string; unitPrice: string };
  grade3Stopped: { quantity: string; unitPrice: string };
  grade3Estimated: { quantity: string; unitPrice: string };
  gradeBelow: { quantity: string; unitPrice: string };
  mixedGrade: { quantity: string; unitPrice: string };
}

// Normalized record for IndexedDB (parsed numbers, consistent structure)
interface AuctionRecordNormalized {
  id?: number; // Auto-increment primary key
  date: string; // YYYY-MM-DD format
  region: string;
  union: string;
  lastUpdated?: string;

  // Parsed auction quantities (in kg)
  auctionQuantityUntilYesterday: number;
  auctionQuantityToday: number;
  auctionQuantityTotal: number;

  // Parsed auction amounts (in won)
  auctionAmountUntilYesterday: number;
  auctionAmountToday: number;
  auctionAmountTotal: number;

  // Grade 1
  grade1Quantity: number;
  grade1UnitPrice: number;

  // Grade 2
  grade2Quantity: number;
  grade2UnitPrice: number;

  // Grade 3 Stopped
  grade3StoppedQuantity: number;
  grade3StoppedUnitPrice: number;

  // Grade 3 Estimated
  grade3EstimatedQuantity: number;
  grade3EstimatedUnitPrice: number;

  // Grade Below
  gradeBelowQuantity: number;
  gradeBelowUnitPrice: number;

  // Mixed Grade
  mixedGradeQuantity: number;
  mixedGradeUnitPrice: number;
}

interface CompleteDataset {
  version: string; // ISO timestamp of generation
  totalRecords: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  regions: string[];
  unions: string[];
  data: AuctionRecordNormalized[];
}

const DATA_ROOT = join(process.cwd(), "public", "auction-data");
const OUTPUT_FILE = join(DATA_ROOT, "complete-dataset.json");

// Utility function to parse Korean number strings
function parseNumber(str: string | undefined): number {
  if (!str) return 0;
  const cleaned = str.replace(/[\s,]/g, "").replace(/(kg|원)$/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Normalize date format to YYYY-MM-DD
function normalizeDate(date: string): string {
  // Handle various date formats: "2024-10-1", "2024-10-01", etc.
  const parts = date.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return date;
}

// Convert raw record to normalized format
function normalizeRecord(
  raw: AuctionRecordRaw,
  filePath: string
): AuctionRecordNormalized {
  // Extract date from file path if not present in data
  let date = raw.date;
  if (!date) {
    // Extract from file path: .../2024/10/1.json -> 2024-10-1
    const pathParts = filePath.split("/");
    const fileName = pathParts[pathParts.length - 1].replace(".json", "");
    const month = pathParts[pathParts.length - 2];
    const year = pathParts[pathParts.length - 3];
    date = `${year}-${month}-${fileName}`;
  }

  return {
    date: normalizeDate(date),
    region: raw.region,
    union: raw.union,
    lastUpdated: raw.lastUpdated,

    // Auction quantities
    auctionQuantityUntilYesterday: parseNumber(
      raw.auctionQuantity.untilYesterday
    ),
    auctionQuantityToday: parseNumber(raw.auctionQuantity.today),
    auctionQuantityTotal: parseNumber(raw.auctionQuantity.total),

    // Auction amounts
    auctionAmountUntilYesterday: parseNumber(raw.auctionAmount.untilYesterday),
    auctionAmountToday: parseNumber(raw.auctionAmount.today),
    auctionAmountTotal: parseNumber(raw.auctionAmount.total),

    // Grades
    grade1Quantity: parseNumber(raw.grade1.quantity),
    grade1UnitPrice: parseNumber(raw.grade1.unitPrice),

    grade2Quantity: parseNumber(raw.grade2.quantity),
    grade2UnitPrice: parseNumber(raw.grade2.unitPrice),

    grade3StoppedQuantity: parseNumber(raw.grade3Stopped.quantity),
    grade3StoppedUnitPrice: parseNumber(raw.grade3Stopped.unitPrice),

    grade3EstimatedQuantity: parseNumber(raw.grade3Estimated.quantity),
    grade3EstimatedUnitPrice: parseNumber(raw.grade3Estimated.unitPrice),

    gradeBelowQuantity: parseNumber(raw.gradeBelow.quantity),
    gradeBelowUnitPrice: parseNumber(raw.gradeBelow.unitPrice),

    mixedGradeQuantity: parseNumber(raw.mixedGrade.quantity),
    mixedGradeUnitPrice: parseNumber(raw.mixedGrade.unitPrice),
  };
}

// Recursively scan all JSON files and collect data
function collectAllData(): AuctionRecordNormalized[] {
  const allRecords: AuctionRecordNormalized[] = [];

  console.log("🔍 데이터 수집 시작...");

  // Get all years
  const years = readdirSync(DATA_ROOT)
    .filter((name) => /^\d{4}$/.test(name))
    .sort();

  for (const year of years) {
    const yearPath = join(DATA_ROOT, year);
    console.log(`📅 ${year}년 데이터 수집 중...`);

    // Get all months in year
    const months = readdirSync(yearPath)
      .filter((name) => /^\d{1,2}$/.test(name))
      .sort((a, b) => parseInt(a) - parseInt(b));

    for (const month of months) {
      const monthPath = join(yearPath, month);

      // Get all days in month
      const days = readdirSync(monthPath)
        .filter((name) => name.endsWith(".json"))
        .sort((a, b) => {
          const dayA = parseInt(a.replace(".json", ""));
          const dayB = parseInt(b.replace(".json", ""));
          return dayA - dayB;
        });

      for (const day of days) {
        const dayPath = join(monthPath, day);

        try {
          const rawData = JSON.parse(
            readFileSync(dayPath, "utf8")
          ) as AuctionRecordRaw[];

          for (const record of rawData) {
            const normalized = normalizeRecord(record, dayPath);
            allRecords.push(normalized);
          }
        } catch (error) {
          console.warn(`⚠️  ${dayPath} 파일 읽기 실패:`, error);
        }
      }
    }
  }

  console.log(`✅ 총 ${allRecords.length}개 레코드 수집 완료`);
  return allRecords;
}

// Generate metadata
function generateMetadata(
  records: AuctionRecordNormalized[]
): Omit<CompleteDataset, "data"> {
  const dates = records.map((r) => r.date).sort();
  const regions = [...new Set(records.map((r) => r.region))].sort();
  const unions = [...new Set(records.map((r) => r.union))].sort();

  return {
    version: new Date().toISOString(),
    totalRecords: records.length,
    dateRange: {
      earliest: dates[0] || "",
      latest: dates[dates.length - 1] || "",
    },
    regions,
    unions,
  };
}

// Main execution
async function main() {
  console.log("🚀 통합 데이터셋 생성 시작");
  console.log(`📂 소스 디렉토리: ${DATA_ROOT}`);
  console.log(`📄 출력 파일: ${OUTPUT_FILE}`);

  // Collect all data
  const allRecords = collectAllData();

  if (allRecords.length === 0) {
    console.error("❌ 데이터가 없습니다!");
    process.exit(1);
  }

  // Sort by date and region for better indexing
  allRecords.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.region.localeCompare(b.region);
  });

  // Generate metadata
  const metadata = generateMetadata(allRecords);

  // Create complete dataset
  const completeDataset: CompleteDataset = {
    ...metadata,
    data: allRecords,
  };

  // Write to file
  console.log("💾 파일 저장 중...");
  writeFileSync(OUTPUT_FILE, JSON.stringify(completeDataset, null, 2), "utf8");

  // Summary
  console.log("\n📊 통합 데이터셋 생성 완료!");
  console.log(
    `├─ 총 레코드 수: ${completeDataset.totalRecords.toLocaleString()}개`
  );
  console.log(
    `├─ 기간: ${completeDataset.dateRange.earliest} ~ ${completeDataset.dateRange.latest}`
  );
  console.log(
    `├─ 지역 수: ${
      completeDataset.regions.length
    }개 (${completeDataset.regions.join(", ")})`
  );
  console.log(`├─ 조합 수: ${completeDataset.unions.length}개`);

  // File size
  const { statSync } = await import("fs");
  const stats = statSync(OUTPUT_FILE);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`└─ 파일 크기: ${fileSizeMB}MB`);

  console.log(`\n✅ 파일 저장: ${OUTPUT_FILE}`);
}

// Run the script
main().catch(console.error);

export { normalizeRecord, CompleteDataset, AuctionRecordNormalized };
