import type {
  AnalysisAlign,
  AnalysisCompare,
  AnalysisGranularity,
  AnalysisGroupBy,
  AnalysisMetric,
  AnalysisView,
} from "./types";

/** 뷰 표시 이름 (컨트롤 순서 = 선언 순서) */
export const VIEW_LABELS: Record<AnalysisView, string> = {
  overlay: "연도 겹침",
  timeline: "추이",
  heatmap: "히트맵",
  rank: "순위",
  composition: "구성",
  relation: "관계",
  coverage: "커버리지",
  weather: "날씨",
  table: "표",
};

/** 지표 표시 이름 */
export const METRIC_LABELS: Record<AnalysisMetric, string> = {
  unitPrice: "단가",
  quantity: "물량",
  amount: "금액",
  cumQuantity: "누계 물량",
  gradeShare: "등급 비중",
};

/** 묶기 기준 표시 이름 */
export const GROUP_BY_LABELS: Record<AnalysisGroupBy, string> = {
  none: "전체 합산",
  year: "시즌별",
  region: "지역별",
  union: "조합별",
  grade: "등급별",
};

/** 집계 단위 표시 이름 */
export const GRANULARITY_LABELS: Record<AnalysisGranularity, string> = {
  day: "일",
  week: "주",
  season: "시즌",
};

/** 정렬 기준 표시 이름 */
export const ALIGN_LABELS: Record<AnalysisAlign, string> = {
  seasonDay: "시즌 일차",
  calendar: "달력 날짜",
};

/** 비교 표시 이름 */
export const COMPARE_LABELS: Record<AnalysisCompare, string> = {
  none: "없음",
  normal: "평년",
  prevYear: "전년",
};
