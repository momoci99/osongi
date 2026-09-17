import type {
  AnalysisCompare,
  AnalysisGranularity,
  AnalysisGroupBy,
  AnalysisMetric,
  AnalysisQuery,
  AnalysisView,
} from "./types";

/** 뷰별로 허용되는 컨트롤 값. 첫 번째 값이 전환 시 기본값 */
export type ViewRule = {
  metrics: AnalysisMetric[];
  groupBy: AnalysisGroupBy[];
  granularity: AnalysisGranularity[];
  compare: AnalysisCompare[];
  /** 달력·시즌일차 정렬 선택 가능 여부 */
  align: boolean;
  /** 공통 조합만 토글 제공 여부 */
  commonUnits: boolean;
};

const ALL_METRICS: AnalysisMetric[] = [
  "unitPrice",
  "quantity",
  "amount",
  "cumQuantity",
  "gradeShare",
];

export const VIEW_RULES: Record<AnalysisView, ViewRule> = {
  timeline: {
    metrics: ALL_METRICS,
    groupBy: ["none", "region", "union", "grade", "year"],
    granularity: ["day", "week", "season"],
    compare: ["none", "prevYear"],
    align: false,
    commonUnits: true,
  },
  overlay: {
    metrics: ALL_METRICS,
    groupBy: ["year"],
    granularity: ["day", "week"],
    compare: ["none", "normal"],
    align: true,
    commonUnits: true,
  },
  heatmap: {
    metrics: ["quantity", "unitPrice", "amount"],
    groupBy: ["year"],
    granularity: ["day", "week"],
    compare: ["none"],
    align: true,
    commonUnits: false,
  },
  coverage: {
    metrics: ["quantity"],
    groupBy: ["union"],
    granularity: ["season"],
    compare: ["none"],
    align: false,
    commonUnits: false,
  },
  rank: {
    metrics: ["unitPrice", "quantity", "amount"],
    groupBy: ["union", "region", "grade"],
    granularity: ["season"],
    compare: ["none", "prevYear"],
    align: false,
    commonUnits: false,
  },
  composition: {
    metrics: ["gradeShare"],
    groupBy: ["grade"],
    granularity: ["season", "week", "day"],
    compare: ["none"],
    align: false,
    commonUnits: true,
  },
  relation: {
    metrics: ["unitPrice"],
    groupBy: ["year", "region", "none"],
    granularity: ["day", "season"],
    compare: ["none"],
    align: false,
    commonUnits: false,
  },
  table: {
    metrics: ALL_METRICS,
    groupBy: ["year", "none", "region", "union", "grade"],
    granularity: ["season", "week", "day"],
    compare: ["none"],
    align: false,
    commonUnits: true,
  },
};

/** 허용 목록에 없으면 첫 번째 값 */
const pick = <T>(value: T, allowed: T[]): T =>
  allowed.includes(value) ? value : allowed[0];

/**
 * 쿼리를 뷰 규칙에 맞게 보정한다.
 * 뷰 전환 시 의미 없는 조합(예: 겹침 뷰인데 조합별 묶기)을 막는다.
 */
export const coerceQueryToView = (query: AnalysisQuery, view: AnalysisView): AnalysisQuery => {
  const rule = VIEW_RULES[view];
  return {
    ...query,
    view,
    metric: pick(query.metric, rule.metrics),
    groupBy: pick(query.groupBy, rule.groupBy),
    granularity: pick(query.granularity, rule.granularity),
    compare: pick(query.compare, rule.compare),
    commonUnitsOnly: rule.commonUnits ? query.commonUnitsOnly : false,
  };
};
