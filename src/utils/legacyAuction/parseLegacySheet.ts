import {
  LEGACY_COLUMN,
  LEGACY_GRADE_KEYS,
  type LegacyPriceBasis,
} from "../../const/LegacyAuction";

export type LegacyGradeKey = (typeof LEGACY_GRADE_KEYS)[number];

/** 전일까지·금일·누계 세 칸 */
export type LegacyTriple = {
  untilYesterday: number | null;
  today: number | null;
  total: number | null;
};

/** 등급별 수량(kg)·단가(원). 빈 칸은 null */
export type LegacyGradeCell = {
  quantity: number | null;
  unitPrice: number | null;
};

/** 집계표 한 행 (조합, 도 소계, 전체 계) */
export type LegacyRow = {
  region: string;
  union: string;
  quantity: LegacyTriple;
  amount: LegacyTriple;
  grades: Record<LegacyGradeKey, LegacyGradeCell>;
};

/** 집계표 한 장 */
export type LegacySheet = {
  /** 제목의 "OOOO년도" */
  titleYear: number | null;
  /** 제목 아래 "(YYYY. M. D)" → YYYY-MM-DD */
  headerDate: string | null;
  priceBasis: LegacyPriceBasis | null;
  unions: LegacyRow[];
  subtotals: LegacyRow[];
  total: LegacyRow | null;
};

type Cell = string | number | null | undefined;

const TOTAL_LABEL = "계";
const SUBTOTAL_LABEL = "소계";
const TABLE_END_LABEL = "평균가격";

/** 공백 제거한 셀 문자열 */
export const normalizeLabel = (cell: Cell): string =>
  String(cell ?? "").replace(/\s+/g, "");

/** "1,234.5" → 1234.5, "-" → 0, 빈 칸 → null */
export const parseLegacyNumber = (cell: Cell): number | null => {
  if (typeof cell === "number") return cell;
  const text = normalizeLabel(cell).replace(/,/g, "");
  if (text === "") return null;
  if (/^-+$/.test(text)) return 0;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
};

const pad2 = (value: string) => value.padStart(2, "0");

/** 표 위쪽 머리글에서 연도·날짜·단가 기준을 읽는다 */
const parseHeading = (headingText: string) => {
  const year = headingText.match(/(\d{4})년도/);
  const date = headingText.match(/\((\d{4})\.(\d{1,2})\.(\d{1,2})\)/);
  const priceBasis: LegacyPriceBasis | null = /단가는등급별최고/.test(headingText)
    ? "max"
    : /평균단가/.test(headingText)
      ? "avg"
      : null;
  return {
    titleYear: year ? Number(year[1]) : null,
    headerDate: date ? `${date[1]}-${pad2(date[2])}-${pad2(date[3])}` : null,
    priceBasis,
  };
};

const readTriple = (row: Cell[], start: number): LegacyTriple => ({
  untilYesterday: parseLegacyNumber(row[start]),
  today: parseLegacyNumber(row[start + 1]),
  total: parseLegacyNumber(row[start + 2]),
});

const readGrades = (row: Cell[], start: number): LegacyRow["grades"] =>
  Object.fromEntries(
    LEGACY_GRADE_KEYS.map((key, index) => [
      key,
      {
        quantity: parseLegacyNumber(row[start + index * 2]),
        unitPrice: parseLegacyNumber(row[start + index * 2 + 1]),
      },
    ]),
  ) as LegacyRow["grades"];

/** "도별"·"조합별" 머리글 행 위치 */
const findHeaderRow = (rows: Cell[][]) => {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const labels = rows[rowIndex].map(normalizeLabel);
    const unionColumn = labels.indexOf("조합별");
    if (unionColumn > 0) return { rowIndex, baseColumn: unionColumn - LEGACY_COLUMN.union };
  }
  return null;
};

/**
 * 옛 일일 공판 집계표 시트(2차원 배열)를 행 단위로 읽는다.
 * 집계표 형식이 아니면 null.
 */
export const parseLegacySheet = (rows: Cell[][]): LegacySheet | null => {
  const header = findHeaderRow(rows);
  if (!header) return null;

  const headingText = rows
    .slice(0, header.rowIndex)
    .flat()
    .map(normalizeLabel)
    .join("");
  const sheet: LegacySheet = { ...parseHeading(headingText), unions: [], subtotals: [], total: null };

  /** 머리글 두 줄(항목, 전일까지/금일/누계) 다음부터 자료 */
  let currentRegion = "";
  for (const raw of rows.slice(header.rowIndex + 2)) {
    const row = raw.slice(header.baseColumn);
    const regionLabel = normalizeLabel(row[LEGACY_COLUMN.region]);
    const unionLabel = normalizeLabel(row[LEGACY_COLUMN.union]);
    if (regionLabel === TABLE_END_LABEL) break;
    if (regionLabel && regionLabel !== TOTAL_LABEL) currentRegion = regionLabel;
    if (!regionLabel && !unionLabel) continue;

    const parsed: LegacyRow = {
      region: regionLabel === TOTAL_LABEL ? TOTAL_LABEL : currentRegion,
      union: unionLabel,
      quantity: readTriple(row, LEGACY_COLUMN.quantityStart),
      amount: readTriple(row, LEGACY_COLUMN.amountStart),
      grades: readGrades(row, LEGACY_COLUMN.gradeStart),
    };
    if (regionLabel === TOTAL_LABEL) sheet.total = parsed;
    else if (unionLabel === SUBTOTAL_LABEL) sheet.subtotals.push(parsed);
    else sheet.unions.push(parsed);
  }
  return sheet;
};
