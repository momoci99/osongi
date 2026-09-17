import { listYears } from "./rows";
import type { GradeRow } from "./types";

/** 시즌 요약 표의 한 행 */
export type SeasonSummaryRow = {
  year: number;
  firstDate: string;
  lastDate: string;
  tradingDays: number;
  /** 일 공판량이 가장 많았던 날 */
  peakDate: string;
  peakQuantity: number;
  quantity: number;
  amount: number;
  unitPrice: number | null;
  unions: number;
};

/** 커버리지 표의 한 칸 — 조합 × 시즌 공판일 수 */
export type CoverageCell = {
  region: string;
  union: string;
  year: number;
  tradingDays: number;
};

/** 커버리지 표 */
export type Coverage = {
  years: number[];
  unions: { region: string; union: string }[];
  cells: CoverageCell[];
};

/** 시즌(연도)별 요약을 만든다 */
export const buildSeasonSummaries = (rows: GradeRow[]): SeasonSummaryRow[] =>
  listYears(rows).map((year) => {
    const yearRows = rows.filter((row) => row.year === year);
    const quantityByDate = new Map<string, number>();
    const unions = new Set<string>();
    let quantity = 0;
    let amount = 0;

    for (const row of yearRows) {
      quantityByDate.set(row.date, (quantityByDate.get(row.date) ?? 0) + row.quantity);
      unions.add(row.union);
      quantity += row.quantity;
      amount += row.amount;
    }

    const dates = [...quantityByDate.keys()].sort();
    const [peakDate, peakQuantity] = [...quantityByDate.entries()].reduce(
      (best, entry) => (entry[1] > best[1] ? entry : best),
    );

    return {
      year,
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
      tradingDays: dates.length,
      peakDate,
      peakQuantity,
      quantity,
      amount,
      unitPrice: quantity > 0 ? amount / quantity : null,
      unions: unions.size,
    };
  });

/** 조합 × 시즌 공판일 수 표를 만든다 */
export const buildCoverage = (rows: GradeRow[]): Coverage => {
  const datesByCell = new Map<string, Set<string>>();
  const unionRegion = new Map<string, string>();

  for (const row of rows) {
    unionRegion.set(row.union, row.region);
    const key = `${row.union}|${row.year}`;
    const dates = datesByCell.get(key) ?? new Set<string>();
    dates.add(row.date);
    datesByCell.set(key, dates);
  }

  const unions = [...unionRegion.entries()]
    .map(([union, region]) => ({ region, union }))
    .sort((a, b) => a.region.localeCompare(b.region) || a.union.localeCompare(b.union));

  const cells = [...datesByCell.entries()].map(([key, dates]) => {
    const [union, year] = key.split("|");
    return {
      region: unionRegion.get(union) ?? "",
      union,
      year: Number(year),
      tradingDays: dates.size,
    };
  });

  return { years: listYears(rows), unions, cells };
};
