import type { AVAILABLE_REGIONS } from "../../const/Common";
import type { DailyDataType } from "../../types/DailyData";
import type { WeeklyPriceDatum } from "../../types/data";

export type RegionType = (typeof AVAILABLE_REGIONS)[number];

export type LatestDaily = DailyDataType["latestDaily"];

export type GradeRow = LatestDaily["gradeBreakdown"][number];

export type DayComparison = LatestDaily["previousDayComparison"];

/** 대시보드 KPI 카드 하나. 날짜 캡션은 카드 줄에서 붙인다 */
export type ScopeKpi = {
  title: string;
  content: string;
  suffix?: string;
};

/** 대시보드가 보여줄 범위: 전국, 지역, 조합 */
export type DashboardScope = {
  kind: "national" | "region" | "union";
  /** 제목에 붙이는 범위 이름 (예: "전국", "경북", "봉화 조합") */
  label: string;
  gradeRows: GradeRow[];
  weekly: WeeklyPriceDatum[];
  dayComparison: DayComparison;
  kpis: ScopeKpi[];
};
