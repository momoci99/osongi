import { REGION_UNION_MAP } from "../../const/Common";
import type { WeeklyManifest } from "../../types/data";
import dayOverDay from "./dayOverDay";
import { nationalKpis, regionKpis, unionKpis } from "./kpis";
import type { DashboardScope, LatestDaily, RegionType } from "./types";

export type { DashboardScope, ScopeKpi } from "./types";

type ResolveScopeParams = {
  latestDaily: LatestDaily;
  latestDate: string;
  weekly: WeeklyManifest;
  myRegion: RegionType | null;
  myUnion: string | null;
};

/**
 * 대시보드가 보여줄 범위를 고르고 표·카드·차트 데이터를 그 범위로 맞춘다.
 * - 지역 미선택 → 전국
 * - 내 지역 조합 선택 → 그 조합 (다른 지역 조합이 남아 있으면 무시하고 지역)
 * - 그 밖 → 지역
 * 전일 대비는 범위마다 7일 추이에서 다시 계산해 전국 수치가 섞이지 않게 한다.
 */
export const resolveDashboardScope = ({
  latestDaily,
  latestDate,
  weekly,
  myRegion,
  myUnion,
}: ResolveScopeParams): DashboardScope => {
  if (!myRegion) {
    return {
      kind: "national",
      label: "전국",
      gradeRows: latestDaily.gradeBreakdown,
      weekly: weekly.weeklyData,
      dayComparison: latestDaily.previousDayComparison,
      kpis: nationalKpis(latestDaily),
    };
  }

  if (myUnion && REGION_UNION_MAP[myRegion].includes(myUnion)) {
    const rows = latestDaily.unionGradeBreakdown?.[myUnion] ?? [];
    const unionWeekly = weekly.unionWeeklyData?.[myUnion] ?? [];
    return {
      kind: "union",
      label: `${myUnion} 조합`,
      gradeRows: rows,
      weekly: unionWeekly,
      dayComparison: dayOverDay(unionWeekly, latestDate),
      kpis: unionKpis(latestDaily, myRegion, myUnion, rows),
    };
  }

  const rows = latestDaily.regionGradeBreakdown?.[myRegion] ?? [];
  const regionWeekly = weekly.regionWeeklyData?.[myRegion] ?? [];
  return {
    kind: "region",
    label: myRegion,
    gradeRows: rows,
    weekly: regionWeekly,
    dayComparison: dayOverDay(regionWeekly, latestDate),
    kpis: regionKpis(latestDaily, myRegion, rows),
  };
};

/** 최신 공판일에 거래가 있었던 조합 이름 */
export const tradedUnionsOf = (latestDaily: LatestDaily): string[] =>
  Object.keys(latestDaily.unionGradeBreakdown ?? {});
