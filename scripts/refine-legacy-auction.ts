#!/usr/bin/env node
/*
  옛 공판 원본(data/legacy-auction/raw) → 정제 자료 + 정합성 보고서

  - 게시물마다 첫 번째 집계표 시트를 그 날짜의 원본으로 본다(날짜는 게시물 제목 기준).
  - 2008·2009 파일에 딸린 전년 대비 시트는 "비교 시트"로 따로 읽어,
    전년 원본과 대조하고 원본이 없는 해(2007)는 비교 시트를 자료로 쓴다.
  - 단가 기준(최고가/평균)은 머리글 문구를 따르고, 문구가 없으면 수량×단가로 추정한다.

  출력: data/legacy-auction/refined/{year}.json, data/legacy-auction/integrity-report.json
  실행: npm run refine-legacy-auction
*/
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import * as XLSX from "xlsx";
import type { LegacyPriceBasis } from "../src/const/LegacyAuction";
import {
  parseLegacySheet,
  type LegacyRow,
  type LegacySheet,
} from "../src/utils/legacyAuction/parseLegacySheet";
import {
  checkLegacyChain,
  checkLegacySheet,
  inferPriceBasis,
  type LegacyIssue,
} from "../src/utils/legacyAuction/legacyIntegrity";

const ROOT = join(process.cwd(), "data", "legacy-auction");
const RAW_FILES = join(ROOT, "raw", "files");
const MANIFEST_PATH = join(ROOT, "raw", "manifest.json");
const REFINED_DIR = join(ROOT, "refined");
const REPORT_PATH = join(ROOT, "integrity-report.json");

type ManifestPost = {
  seq: number;
  title: string;
  attachments: { originalName: string; localName: string }[];
};

/** 자료 출처. original = 그날 게시물 원본, comparison = 이듬해 파일의 전년 비교 시트 */
type LegacySource = "original" | "comparison";

/** 정제된 하루치 */
type LegacyDay = {
  date: string;
  sourceSeq: number;
  source: LegacySource;
  priceBasis: LegacyPriceBasis | null;
  priceBasisSource: "declared" | "inferred" | null;
  unions: LegacyRow[];
  subtotals: LegacyRow[];
  total: LegacyRow | null;
};

type DayReport = { date: string; sourceSeq: number; source: LegacySource; issues: LegacyIssue[] };

const DATE_IN_TITLE = /^(\d{4})-(\d{1,2})-(\d{1,2})/;

const postDate = (title: string): string | null => {
  const match = title.match(DATE_IN_TITLE);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : null;
};

/**
 * 비교 시트의 날짜. 머리글 날짜는 서식을 복사하며 안 고친 경우가 있어(2009-09-25·26 → "2008. 9. 24"),
 * 2008 원본 대조로 확인된 "게시물 날짜의 전년 같은 날"을 쓴다.
 */
const previousYearDate = (date: string) => `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`;

/** 워크북 안의 집계표 시트들 (시트 순서 유지). 읽기 실패면 null */
const readSheets = (localName: string): LegacySheet[] | null => {
  try {
    const workbook = XLSX.read(readFileSync(join(RAW_FILES, localName)));
    return workbook.SheetNames.map((name) =>
      parseLegacySheet(
        XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: false, defval: null }),
      ),
    ).filter((sheet): sheet is LegacySheet => sheet !== null);
  } catch {
    return null;
  }
};

const toDay = (sheet: LegacySheet, date: string, seq: number, source: LegacySource): LegacyDay => {
  const inferred = inferPriceBasis(sheet);
  return {
    date,
    sourceSeq: seq,
    source,
    priceBasis: sheet.priceBasis ?? inferred,
    priceBasisSource: sheet.priceBasis ? "declared" : inferred ? "inferred" : null,
    unions: sheet.unions,
    subtotals: sheet.subtotals,
    total: sheet.total,
  };
};

/** 원본과 비교 시트의 조합별 누계가 같은지 */
const compareWithOriginal = (original: LegacyDay, comparison: LegacyDay): LegacyIssue[] => {
  const originalByUnion = new Map(original.unions.map((row) => [`${row.region}/${row.union}`, row]));
  return comparison.unions.flatMap((row) => {
    const target = `${row.region}/${row.union}`;
    const source = originalByUnion.get(target);
    if (!source) return [];
    const same =
      Math.abs((source.quantity.total ?? 0) - (row.quantity.total ?? 0)) < 0.05 &&
      Math.abs((source.amount.total ?? 0) - (row.amount.total ?? 0)) < 10;
    return same
      ? []
      : [
          {
            code: "comparison-mismatch" as const,
            target,
            detail: `비교 시트(seq ${comparison.sourceSeq}) 누계 ${row.quantity.total}kg/${row.amount.total}원 ≠ 원본 ${source.quantity.total}kg/${source.amount.total}원`,
          },
        ];
  });
};

const main = () => {
  if (!existsSync(MANIFEST_PATH)) {
    console.error("❌ 원본이 없습니다. npm run collect-legacy-auction 먼저 실행하세요.");
    process.exit(1);
  }
  const posts = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as ManifestPost[];
  const originals = new Map<string, { day: LegacyDay; sheet: LegacySheet }>();
  const comparisons: { day: LegacyDay; sheet: LegacySheet }[] = [];
  const skipped: { seq: number; title: string; reason: string }[] = [];

  for (const post of posts) {
    const date = postDate(post.title);
    const workbook = post.attachments.find((a) => /\.xls$/i.test(a.originalName));
    if (!date || !workbook) {
      skipped.push({ seq: post.seq, title: post.title, reason: "엑셀 첨부 없음" });
      continue;
    }
    const sheets = readSheets(workbook.localName);
    if (!sheets || sheets.length === 0) {
      skipped.push({ seq: post.seq, title: post.title, reason: "엑셀 읽기 실패" });
      continue;
    }
    if (originals.has(date)) {
      skipped.push({ seq: post.seq, title: post.title, reason: "같은 날짜 중복 게시물" });
      continue;
    }
    const [primary, ...rest] = sheets;
    originals.set(date, { day: toDay(primary, date, post.seq, "original"), sheet: primary });
    for (const sheet of rest) {
      const comparisonDate = previousYearDate(date);
      comparisons.push({ day: toDay(sheet, comparisonDate, post.seq, "comparison"), sheet });
    }
  }

  /**
   * 원본이 있는 해는 비교 시트를 대조에만 쓴다(시즌이 끝난 뒤 날짜를 비교 시트가 채우는 일 방지).
   * 원본이 없는 해(2007)만 비교 시트로 채운다.
   */
  const originalYears = new Set([...originals.keys()].map((date) => date.slice(0, 4)));
  const days = new Map(originals);
  const reports: DayReport[] = [];
  for (const comparison of comparisons) {
    const original = days.get(comparison.day.date);
    if (!originalYears.has(comparison.day.date.slice(0, 4))) {
      if (!original) days.set(comparison.day.date, comparison);
      continue;
    }
    if (!original) continue;
    const issues = compareWithOriginal(original.day, comparison.day);
    if (issues.length > 0)
      reports.push({ date: comparison.day.date, sourceSeq: comparison.day.sourceSeq, source: "comparison", issues });
  }

  const sortedDates = [...days.keys()].sort();
  sortedDates.forEach((date, index) => {
    const { day, sheet } = days.get(date)!;
    const issues = checkLegacySheet(sheet, date, day.priceBasis);
    const previousDate = sortedDates[index - 1];
    if (previousDate?.slice(0, 4) === date.slice(0, 4))
      issues.push(...checkLegacyChain(days.get(previousDate)!.sheet, sheet));
    if (issues.length > 0) reports.push({ date, sourceSeq: day.sourceSeq, source: day.source, issues });
  });

  mkdirSync(REFINED_DIR, { recursive: true });
  const years = [...new Set(sortedDates.map((date) => date.slice(0, 4)))];
  /** 비교 시트로만 채운 해는 날짜 정렬이 흔들려(누계 역행) 보고서에만 남기고 정제 자료에서 뺀다 */
  for (const year of years.filter((y) => originalYears.has(y))) {
    const yearDays = sortedDates.filter((date) => date.startsWith(year)).map((date) => days.get(date)!.day);
    writeFileSync(join(REFINED_DIR, `${year}.json`), JSON.stringify(yearDays));
  }

  const issueCounts: Record<string, number> = {};
  for (const report of reports)
    for (const issue of report.issues) issueCounts[issue.code] = (issueCounts[issue.code] ?? 0) + 1;
  const summary = {
    days: sortedDates.length,
    byYear: Object.fromEntries(
      years.map((year) => {
        const yearDays = sortedDates.filter((d) => d.startsWith(year)).map((d) => days.get(d)!.day);
        return [
          year,
          {
            days: yearDays.length,
            first: yearDays[0].date,
            last: yearDays[yearDays.length - 1].date,
            sources: [...new Set(yearDays.map((d) => d.source))],
            priceBasis: Object.fromEntries(
              [...new Set(yearDays.map((d) => `${d.priceBasis}:${d.priceBasisSource}`))].map((k) => [
                k,
                yearDays.filter((d) => `${d.priceBasis}:${d.priceBasisSource}` === k).length,
              ]),
            ),
          },
        ];
      }),
    ),
    issueCounts,
    skipped,
  };
  writeFileSync(REPORT_PATH, JSON.stringify({ summary, reports }, null, 1));
  console.log(JSON.stringify(summary, null, 1));
};

main();
