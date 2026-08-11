/**
 * 지역·조합 상세 페이지 데이터 타입.
 * scripts/generate-region-stats.ts 가 생성하는 region-manifest.json 의 스키마다.
 */

/** 등급별 물량·평균 단가 */
export type GradeStat = {
  gradeKey: string;
  quantityKg: number;
  avgUnitPriceWon: number;
};

/** 연도별 공판 실적 */
export type YearStat = {
  year: number;
  totalQuantityKg: number;
  totalAmountWon: number;
  avgPricePerKg: number;
};

/** 시즌 단위 요약 */
export type SeasonStat = {
  startDate: string;
  endDate: string;
  totalQuantityKg: number;
  totalAmountWon: number;
  avgPricePerKg: number;
};

/** 최신 공판일 스냅샷 */
export type LatestDailyStat = {
  date: string;
  totalQuantityKg: number;
  grades: GradeStat[];
};

/** 지역 또는 조합 하나의 통계 세트 */
export type ScopeStats = {
  /** 지역 페이지는 지역명, 조합 페이지는 조합명 */
  name: string;
  /** 소속 지역. 지역 페이지에서는 name 과 동일 */
  region: string;
  latestSeasonYear: number;
  season: SeasonStat | null;
  /** 최신 시즌 등급별 집계 */
  grades: GradeStat[];
  /** 전체 연도 추이 (오름차순) */
  yearly: YearStat[];
  /** 최신 시즌 최고 단가 */
  peak: { date: string; gradeKey: string; priceWon: number } | null;
  latestDaily: LatestDailyStat | null;
  /** 최신 시즌 물량 기준 전국 조합 순위 (조합에만 존재) */
  quantityRank?: { rank: number; of: number };
};

/** 지역 통계 + 소속 조합 목록 */
export type RegionScopeStats = ScopeStats & {
  unions: string[];
};

/** 조합 목록 정렬 기준 */
export type UnionSortKey = "quantity" | "price";

/** 지역·조합 상호 링크 목록의 행 하나 */
export type ScopeLinkItem = {
  name: string;
  path: string;
  /** 소속 지역. 색 도트와 물량 막대 색을 정한다 */
  region: string;
  avgPricePerKg: number | null;
  totalQuantityKg: number | null;
  /** 카드에 덧붙일 보조 설명 (조합 수 등) */
  note?: string;
};

export type RegionManifest = {
  generatedAt: string;
  latestDate: string;
  latestSeasonYear: number;
  regions: Record<string, RegionScopeStats>;
  unions: Record<string, ScopeStats>;
};
