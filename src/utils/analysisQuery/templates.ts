import { TEMPLATE_SEASONS } from "../../const/Analysis";
import { serializeAnalysisQuery } from "./queryParams";
import type { AnalysisQuery } from "./types";

/** 템플릿이 참고하는 데이터 맥락 */
export type TemplateContext = {
  /** 데이터가 있는 시즌 (오름차순) */
  availableYears: number[];
  inSeason: boolean;
};

/** 질문 템플릿 ID */
export type AnalysisTemplateId =
  | "thisYearVsNormal"
  | "cumulativePace"
  | "unionRank"
  | "gradeComposition"
  | "allSeasonsHeatmap"
  | "seasonSummary";

/** 질문 템플릿 */
export type AnalysisTemplate = {
  id: AnalysisTemplateId;
  label: string;
  question: string;
  build: (context: TemplateContext) => AnalysisQuery;
};

/** 모든 템플릿의 공통 기본값 */
const BASE_QUERY: AnalysisQuery = {
  view: "overlay",
  time: { kind: "seasons", years: [] },
  align: "seasonDay",
  regions: [],
  unions: [],
  grades: [],
  metric: "unitPrice",
  groupBy: "year",
  granularity: "day",
  compare: "none",
  commonUnitsOnly: false,
};

/** 가장 최근 시즌 */
const latestYear = ({ availableYears }: TemplateContext): number =>
  availableYears[availableYears.length - 1];

/** 최근 N개 시즌 */
const recentYears = ({ availableYears }: TemplateContext, count: number): number[] =>
  availableYears.slice(-count);

export const ANALYSIS_TEMPLATES: readonly AnalysisTemplate[] = [
  {
    id: "thisYearVsNormal",
    label: "올해 vs 평년",
    question: "올해 1등품 시세가 예년보다 높은가?",
    build: (context) => ({
      ...BASE_QUERY,
      time: { kind: "seasons", years: [latestYear(context)] },
      grades: ["grade1"],
      compare: "normal",
    }),
  },
  {
    id: "cumulativePace",
    label: "누계 페이스",
    question: "올해 물량이 예년 같은 시점보다 많은가?",
    build: (context) => ({
      ...BASE_QUERY,
      time: { kind: "seasons", years: recentYears(context, TEMPLATE_SEASONS.PACE_PAST + 1) },
      metric: "cumQuantity",
    }),
  },
  {
    id: "unionRank",
    label: "조합 순위",
    question: "어느 조합이 1등품을 비싸게 받았나?",
    build: (context) => ({
      ...BASE_QUERY,
      view: "rank",
      time: { kind: "seasons", years: [latestYear(context)] },
      grades: ["grade1"],
      groupBy: "union",
      granularity: "season",
    }),
  },
  {
    id: "gradeComposition",
    label: "등급 구성",
    question: "등급별 물량 비중이 해마다 어떻게 바뀌었나?",
    build: (context) => ({
      ...BASE_QUERY,
      view: "composition",
      time: { kind: "seasons", years: recentYears(context, TEMPLATE_SEASONS.COMPOSITION) },
      align: "calendar",
      metric: "gradeShare",
      groupBy: "grade",
      granularity: "season",
    }),
  },
  {
    id: "allSeasonsHeatmap",
    label: "전 시즌 한눈에",
    question: "시즌마다 물량이 언제 몰렸나?",
    build: (context) => ({
      ...BASE_QUERY,
      view: "heatmap",
      time: { kind: "seasons", years: context.availableYears },
      align: "calendar",
      metric: "quantity",
    }),
  },
  {
    id: "seasonSummary",
    label: "시즌 요약",
    question: "시즌별 개시일·피크·총물량은?",
    build: (context) => ({
      ...BASE_QUERY,
      view: "table",
      time: { kind: "seasons", years: context.availableYears },
      align: "calendar",
      metric: "quantity",
      granularity: "season",
    }),
  },
];

/** 파라미터 없이 진입했을 때의 기본 템플릿 */
export const getDefaultTemplateId = (context: TemplateContext): AnalysisTemplateId =>
  context.inSeason ? "thisYearVsNormal" : "allSeasonsHeatmap";

/** 템플릿 ID로 쿼리를 만든다 */
export const buildTemplateQuery = (
  id: AnalysisTemplateId,
  context: TemplateContext,
): AnalysisQuery => {
  const template = ANALYSIS_TEMPLATES.find((item) => item.id === id);
  return (template ?? ANALYSIS_TEMPLATES[0]).build(context);
};

/** 쿼리가 템플릿과 완전히 같으면 해당 템플릿 ID */
export const findMatchingTemplateId = (
  query: AnalysisQuery,
  context: TemplateContext,
): AnalysisTemplateId | null => {
  const serialized = serializeAnalysisQuery(query).toString();
  return (
    ANALYSIS_TEMPLATES.find(
      (template) =>
        serializeAnalysisQuery(template.build(context)).toString() === serialized,
    )?.id ?? null
  );
};
