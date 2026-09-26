import {
  LEGACY_GRADE_KEYS,
  LEGACY_TOLERANCE,
  type LegacyPriceBasis,
} from "../../const/LegacyAuction";
import type { LegacyRow, LegacySheet, LegacyTriple } from "./parseLegacySheet";

/** 정합성 검사 항목 */
export type LegacyIssueCode =
  /** 전일까지 + 금일 ≠ 누계 */
  | "triple-sum"
  /** 조합 합 ≠ 도 소계 */
  | "subtotal-sum"
  /** 도 소계 합 ≠ 전체 계 */
  | "total-sum"
  /** 등급별 수량 합 ≠ 금일 공판량 */
  | "grade-quantity-sum"
  /** 평균 단가 × 수량 합 ≠ 금일 금액 */
  | "grade-amount"
  /** 전날 누계 ≠ 오늘 전일까지 */
  | "chain-break"
  /** 머리글 날짜·연도 ≠ 게시물 날짜 */
  | "header-mismatch"
  /** 등급 수량은 있는데 단가가 빈 칸 */
  | "missing-price"
  /** 음수 값 */
  | "negative-value"
  /** 전년 비교 시트 ≠ 전년 원본 */
  | "comparison-mismatch";

export type LegacyIssue = {
  code: LegacyIssueCode;
  /** 대상 행 (도/조합). 표 전체면 생략 */
  target?: string;
  detail: string;
};

const sumOf = (values: (number | null)[]) => values.reduce<number>((acc, v) => acc + (v ?? 0), 0);

const differs = (a: number | null, b: number | null, tolerance: number) =>
  Math.abs((a ?? 0) - (b ?? 0)) > tolerance;

const rowLabel = (row: LegacyRow) => `${row.region}/${row.union || "계"}`;

const TRIPLE_KEYS = ["untilYesterday", "today", "total"] as const;

const allRows = (sheet: LegacySheet) => [
  ...sheet.unions,
  ...sheet.subtotals,
  ...(sheet.total ? [sheet.total] : []),
];

/** 전일까지 + 금일 = 누계 */
const checkTriples = (sheet: LegacySheet): LegacyIssue[] =>
  allRows(sheet).flatMap((row) =>
    (
      [
        ["공판량", row.quantity, LEGACY_TOLERANCE.quantityKg],
        ["공판금액", row.amount, LEGACY_TOLERANCE.amountWon],
      ] as const
    )
      .filter(([, t, tol]) => differs(sumOf([t.untilYesterday, t.today]), t.total, tol))
      .map(([name, t]) => ({
        code: "triple-sum" as const,
        target: rowLabel(row),
        detail: `${name} ${t.untilYesterday} + ${t.today} ≠ ${t.total}`,
      })),
  );

/** 여러 행의 합이 기준 행과 같은지 (공판량·금액 세 칸 + 등급별 수량) */
const compareSum = (
  parts: LegacyRow[],
  expected: LegacyRow,
  code: "subtotal-sum" | "total-sum",
): LegacyIssue[] => {
  const tripleIssues = (
    [
      ["공판량", (r: LegacyRow) => r.quantity, LEGACY_TOLERANCE.quantityKg],
      ["공판금액", (r: LegacyRow) => r.amount, LEGACY_TOLERANCE.amountWon],
    ] as const
  ).flatMap(([name, pick, tol]) =>
    TRIPLE_KEYS.filter((key) =>
      differs(sumOf(parts.map((r) => pick(r)[key])), pick(expected)[key], tol),
    ).map((key) => ({
      code,
      target: rowLabel(expected),
      detail: `${name}.${key} 합 ${sumOf(parts.map((r) => pick(r)[key])).toFixed(2)} ≠ ${pick(expected)[key]}`,
    })),
  );
  const gradeIssues = LEGACY_GRADE_KEYS.filter((grade) =>
    differs(
      sumOf(parts.map((r) => r.grades[grade].quantity)),
      expected.grades[grade].quantity,
      LEGACY_TOLERANCE.quantityKg,
    ),
  ).map((grade) => ({
    code,
    target: rowLabel(expected),
    detail: `${grade} 수량 합 ${sumOf(parts.map((r) => r.grades[grade].quantity)).toFixed(2)} ≠ ${expected.grades[grade].quantity}`,
  }));
  return [...tripleIssues, ...gradeIssues];
};

/** 조합 → 도 소계 → 전체 계 */
const checkRollups = (sheet: LegacySheet): LegacyIssue[] => {
  const subtotalIssues = sheet.subtotals.flatMap((subtotal) =>
    compareSum(
      sheet.unions.filter((u) => u.region === subtotal.region),
      subtotal,
      "subtotal-sum",
    ),
  );
  const totalIssues = sheet.total ? compareSum(sheet.subtotals, sheet.total, "total-sum") : [];
  return [...subtotalIssues, ...totalIssues];
};

const gradeQuantitySum = (row: LegacyRow) =>
  sumOf(LEGACY_GRADE_KEYS.map((grade) => row.grades[grade].quantity));

/** Σ(등급 수량 × 단가) */
export const gradeAmountSum = (row: LegacyRow) =>
  sumOf(
    LEGACY_GRADE_KEYS.map(
      (grade) => (row.grades[grade].quantity ?? 0) * (row.grades[grade].unitPrice ?? 0),
    ),
  );

/** 등급별 수량 합 = 금일 공판량 */
const checkGradeQuantities = (sheet: LegacySheet): LegacyIssue[] =>
  sheet.unions
    .filter((row) => differs(gradeQuantitySum(row), row.quantity.today, LEGACY_TOLERANCE.quantityKg))
    .map((row) => ({
      code: "grade-quantity-sum" as const,
      target: rowLabel(row),
      detail: `등급 수량 합 ${gradeQuantitySum(row).toFixed(2)} ≠ 금일 ${row.quantity.today}`,
    }));

/** 금일 공판이 있는 조합의 Σ(수량×단가) / 금일 금액 */
export const gradeAmountRatios = (sheet: LegacySheet): number[] =>
  sheet.unions
    .filter((row) => (row.quantity.today ?? 0) > 0 && (row.amount.today ?? 0) > 0)
    .map((row) => gradeAmountSum(row) / (row.amount.today as number));

/**
 * 단가 기준 추정. 평균 단가면 비율이 1 근처에 모이고, 최고가면 1 보다 뚜렷이 크다.
 * 판정할 조합이 없으면 null.
 */
export const inferPriceBasis = (sheet: LegacySheet): LegacyPriceBasis | null => {
  const ratios = gradeAmountRatios(sheet);
  if (ratios.length === 0) return null;
  const sorted = [...ratios].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return Math.abs(median - 1) <= LEGACY_TOLERANCE.amountRatio ? "avg" : "max";
};

/** 평균 단가 기준일 때 Σ(수량×단가) ≈ 금일 금액 */
const checkGradeAmounts = (sheet: LegacySheet, basis: LegacyPriceBasis | null): LegacyIssue[] => {
  if (basis !== "avg") return [];
  return sheet.unions
    .filter((row) => (row.amount.today ?? 0) > 0)
    .filter(
      (row) =>
        Math.abs(gradeAmountSum(row) / (row.amount.today as number) - 1) > LEGACY_TOLERANCE.amountRatio,
    )
    .map((row) => ({
      code: "grade-amount" as const,
      target: rowLabel(row),
      detail: `Σ수량×단가 ${Math.round(gradeAmountSum(row))} vs 금일 금액 ${row.amount.today}`,
    }));
};

/** 등급 수량이 있으면 단가도 있어야 한다 */
const checkMissingPrices = (sheet: LegacySheet): LegacyIssue[] =>
  sheet.unions.flatMap((row) =>
    LEGACY_GRADE_KEYS.filter(
      (grade) => (row.grades[grade].quantity ?? 0) > 0 && !((row.grades[grade].unitPrice ?? 0) > 0),
    ).map((grade) => ({
      code: "missing-price" as const,
      target: rowLabel(row),
      detail: `${grade} 수량 ${row.grades[grade].quantity}kg, 단가 없음`,
    })),
  );

const hasNegative = (triple: LegacyTriple) => TRIPLE_KEYS.some((key) => (triple[key] ?? 0) < 0);

const checkNegatives = (sheet: LegacySheet): LegacyIssue[] =>
  allRows(sheet)
    .filter(
      (row) =>
        hasNegative(row.quantity) ||
        hasNegative(row.amount) ||
        LEGACY_GRADE_KEYS.some(
          (g) => (row.grades[g].quantity ?? 0) < 0 || (row.grades[g].unitPrice ?? 0) < 0,
        ),
    )
    .map((row) => ({ code: "negative-value" as const, target: rowLabel(row), detail: "음수 값" }));

/** 머리글 날짜·연도가 게시물 날짜와 맞는지 */
const checkHeader = (sheet: LegacySheet, postDate: string): LegacyIssue[] => {
  const issues: LegacyIssue[] = [];
  if (sheet.headerDate !== postDate)
    issues.push({ code: "header-mismatch", detail: `머리글 날짜 ${sheet.headerDate} ≠ 게시물 ${postDate}` });
  if (sheet.titleYear !== Number(postDate.slice(0, 4)))
    issues.push({ code: "header-mismatch", detail: `제목 연도 ${sheet.titleYear} ≠ 게시물 ${postDate}` });
  return issues;
};

/** 집계표 한 장의 내부 정합성 */
export const checkLegacySheet = (
  sheet: LegacySheet,
  postDate: string,
  basis: LegacyPriceBasis | null,
): LegacyIssue[] => [
  ...checkHeader(sheet, postDate),
  ...checkTriples(sheet),
  ...checkRollups(sheet),
  ...checkGradeQuantities(sheet),
  ...checkGradeAmounts(sheet, basis),
  ...checkMissingPrices(sheet),
  ...checkNegatives(sheet),
];

/** 전날 누계 = 오늘 전일까지 (조합별 공판량·금액) */
export const checkLegacyChain = (previous: LegacySheet, current: LegacySheet): LegacyIssue[] => {
  const previousByUnion = new Map(previous.unions.map((row) => [rowLabel(row), row]));
  return current.unions.flatMap((row) => {
    const before = previousByUnion.get(rowLabel(row));
    if (!before) return [];
    const issues: LegacyIssue[] = [];
    if (differs(before.quantity.total, row.quantity.untilYesterday, LEGACY_TOLERANCE.quantityKg))
      issues.push({
        code: "chain-break",
        target: rowLabel(row),
        detail: `공판량 전날 누계 ${before.quantity.total} → 전일까지 ${row.quantity.untilYesterday}`,
      });
    if (differs(before.amount.total, row.amount.untilYesterday, LEGACY_TOLERANCE.amountWon))
      issues.push({
        code: "chain-break",
        target: rowLabel(row),
        detail: `공판금액 전날 누계 ${before.amount.total} → 전일까지 ${row.amount.untilYesterday}`,
      });
    return issues;
  });
};
