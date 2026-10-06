import { AVAILABLE_REGIONS, REGION_UNION_MAP } from "../const/Common";
import type { DailyDataType } from "../types/DailyData";

type LatestDaily = DailyDataType["latestDaily"];
type RegionType = (typeof AVAILABLE_REGIONS)[number];

export type BreakdownScope = {
  /** 표 안내 문구에 쓰는 범위 이름 */
  label: string;
  rows: NonNullable<LatestDaily["unionGradeBreakdown"]>[string];
  dayComparison: LatestDaily["previousDayComparison"];
};

/**
 * 대시보드 등급표가 보여줄 범위(지역 또는 조합)를 고른다.
 * - 조합을 골랐으면 그 조합. 거래가 없어도 빈 표로 안내한다.
 * - 아니면 지역. 지역에 거래가 없으면 표를 숨긴다(기존 동작).
 * 전일 대비는 전국 집계라 조합 시세 옆에 두면 오해를 부르므로 조합에서는 뺀다.
 */
export const resolveBreakdownScope = (
  latestDaily: LatestDaily,
  myRegion: RegionType | null,
  myUnion: string | null,
): BreakdownScope | null => {
  if (!myRegion) return null;

  if (myUnion && REGION_UNION_MAP[myRegion].includes(myUnion)) {
    return {
      label: `${myUnion} 조합`,
      rows: latestDaily.unionGradeBreakdown?.[myUnion] ?? [],
      dayComparison: null,
    };
  }

  const regionRows = latestDaily.regionGradeBreakdown?.[myRegion];
  if (!regionRows) return null;

  return {
    label: myRegion,
    rows: regionRows,
    dayComparison: latestDaily.previousDayComparison,
  };
};

/** 최신 공판일에 거래가 있었던 조합 이름 */
export const tradedUnionsOf = (latestDaily: LatestDaily): string[] =>
  Object.keys(latestDaily.unionGradeBreakdown ?? {});
