import { LOW_SAMPLE_THRESHOLD } from "../../const/Analysis";
import type { AnalysisSummary, GradeRow, PriceExtreme } from "./types";

/** 행을 가격 극값 형태로 변환 */
const toExtreme = (row: GradeRow): PriceExtreme => ({
  unitPrice: row.unitPrice,
  date: row.date,
  union: row.union,
  grade: row.grade,
});

/** 요약 패널 수치를 계산한다 */
export const summarizeRows = (rows: GradeRow[]): AnalysisSummary => {
  const dates = new Set<string>();
  const records = new Set<string>();
  const unions = new Set<string>();
  let quantity = 0;
  let amount = 0;
  let max: GradeRow | null = null;
  let min: GradeRow | null = null;

  for (const row of rows) {
    dates.add(row.date);
    records.add(`${row.date}|${row.union}`);
    unions.add(row.union);
    quantity += row.quantity;
    amount += row.amount;
    if (!max || row.unitPrice > max.unitPrice) max = row;
    if (!min || row.unitPrice < min.unitPrice) min = row;
  }

  return {
    tradingDays: dates.size,
    records: records.size,
    unions: unions.size,
    quantity,
    amount,
    unitPrice: quantity > 0 ? amount / quantity : null,
    max: max ? toExtreme(max) : null,
    min: min ? toExtreme(min) : null,
    /** 공판이 아예 없으면 흔들릴 수치도 없다 — 빈 결과는 경고가 아니라 빈 상태로 보여준다 */
    lowSample: dates.size > 0 && dates.size < LOW_SAMPLE_THRESHOLD.TRADING_DAYS,
  };
};
