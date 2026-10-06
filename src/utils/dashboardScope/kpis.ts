import { GradeKeyToKorean, REGION_BREAKDOWN_TABLE, REGION_UNION_MAP } from "../../const/Common";
import splitGradeLabel from "../splitGradeLabel";
import type { GradeRow, LatestDaily, RegionType, ScopeKpi } from "./types";

/** 값이 없을 때 카드에 쓰는 표시 */
const EMPTY_VALUE = "—";

const formatKg = (value: number): string =>
  value.toLocaleString("ko-KR", {
    maximumFractionDigits: REGION_BREAKDOWN_TABLE.QUANTITY_FRACTION_DIGITS,
  });

const formatWon = (value: number): string => Math.round(value).toLocaleString("ko-KR");

const totalKg = (rows: GradeRow[]): number =>
  rows.reduce((sum, row) => sum + row.quantityKg, 0);

/** 수량 가중 평균 단가. 거래가 없으면 null */
const avgPricePerKg = (rows: GradeRow[]): number | null => {
  const quantity = totalKg(rows);
  if (quantity === 0) return null;
  return rows.reduce((sum, row) => sum + row.quantityKg * row.unitPriceWon, 0) / quantity;
};

const topGradeKey = (rows: GradeRow[]): string | null =>
  rows.reduce<GradeRow | null>(
    (top, row) => (top && top.quantityKg >= row.quantityKg ? top : row),
    null,
  )?.gradeKey ?? null;

/** 등급 KPI. 본 등급은 값으로, 세부 구분(생장정지품 등)은 보조 표기로 */
const gradeKpi = (title: string, gradeKey: string | null): ScopeKpi => {
  if (!gradeKey) return { title, content: EMPTY_VALUE };
  const { main, qualifier } = splitGradeLabel(
    GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey,
  );
  return { title, content: main, suffix: qualifier ?? undefined };
};

const quantityKpi = (title: string, kg: number): ScopeKpi => ({
  title,
  content: formatKg(kg),
  suffix: "kg",
});

const avgPriceKpi = (title: string, rows: GradeRow[]): ScopeKpi => {
  const price = avgPricePerKg(rows);
  return price === null
    ? { title, content: EMPTY_VALUE }
    : { title, content: formatWon(price), suffix: "원/kg" };
};

/** 지역 소속 조합 중 최신 공판일에 거래가 있었던 곳을 판매량 순으로 */
const rankedUnionsOf = (latestDaily: LatestDaily, region: RegionType) =>
  REGION_UNION_MAP[region]
    .map((union) => ({
      union,
      kg: totalKg(latestDaily.unionGradeBreakdown?.[union] ?? []),
    }))
    .filter((entry) => entry.kg > 0)
    .sort((a, b) => b.kg - a.kg);

export const nationalKpis = (latestDaily: LatestDaily): ScopeKpi[] => [
  quantityKpi("전국 총 판매량", latestDaily.totalQuantityTodayKg),
  gradeKpi("전국 최다 거래 등급", latestDaily.topGradeByQuantity.gradeKey),
  { title: "전국 최대 거래 지역", content: latestDaily.topRegion.region },
  { title: "전국 최대 거래 조합", content: latestDaily.topUnion.union },
];

export const regionKpis = (
  latestDaily: LatestDaily,
  region: RegionType,
  rows: GradeRow[],
): ScopeKpi[] => [
  quantityKpi(`${region} 총 판매량`, totalKg(rows)),
  gradeKpi(`${region} 최다 거래 등급`, topGradeKey(rows)),
  avgPriceKpi(`${region} 평균 단가`, rows),
  {
    title: `${region} 최대 거래 조합`,
    content: rankedUnionsOf(latestDaily, region)[0]?.union ?? EMPTY_VALUE,
  },
];

/** 조합 순위 KPI. 순위는 같은 지역에서 그날 거래가 있었던 조합끼리 매긴다 */
const unionRankKpi = (
  latestDaily: LatestDaily,
  region: RegionType,
  union: string,
): ScopeKpi => {
  const title = `${region} 조합 중 판매량 순위`;
  const ranked = rankedUnionsOf(latestDaily, region);
  const index = ranked.findIndex((entry) => entry.union === union);
  if (index < 0) return { title, content: "거래 없음" };
  return { title, content: `${index + 1}위`, suffix: `/ 거래 ${ranked.length}곳` };
};

export const unionKpis = (
  latestDaily: LatestDaily,
  region: RegionType,
  union: string,
  rows: GradeRow[],
): ScopeKpi[] => [
  quantityKpi(`${union} 조합 총 판매량`, totalKg(rows)),
  gradeKpi(`${union} 조합 최다 거래 등급`, topGradeKey(rows)),
  avgPriceKpi(`${union} 조합 평균 단가`, rows),
  unionRankKpi(latestDaily, region, union),
];
