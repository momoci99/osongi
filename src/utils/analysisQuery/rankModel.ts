import { GradeKeyToKorean } from "../../const/Common";
import { findRegionOfUnion } from "../../const/Regions";
import { summarizeRows } from "./summary";
import type { AnalysisMetric, AnalysisQuery, AnalysisResult, GradeKey, GradeRow } from "./types";

/** 순위 항목 */
export type RankItem = {
  key: string;
  label: string;
  /** 식별색용 지역 (지역·조합 묶기) */
  region: string | null;
  value: number;
  previous: number | null;
  /** 전년 대비 변화율 (0.1 = +10%) */
  change: number | null;
  tradingDays: number;
  lowSample: boolean;
};

/** 순위 묶기 키 */
const toRankKey = (row: GradeRow, groupBy: AnalysisQuery["groupBy"]): string => {
  if (groupBy === "region") return row.region;
  if (groupBy === "grade") return row.grade;
  return row.union;
};

/** 행을 묶기 기준별로 모은다 */
const groupRows = (rows: GradeRow[], groupBy: AnalysisQuery["groupBy"]): Map<string, GradeRow[]> => {
  const groups = new Map<string, GradeRow[]>();
  for (const row of rows) {
    const key = toRankKey(row, groupBy);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return groups;
};

/** 순위 지표 값 */
const metricValue = (rows: GradeRow[], metric: AnalysisMetric): { value: number | null; tradingDays: number; lowSample: boolean } => {
  const summary = summarizeRows(rows);
  const value =
    metric === "unitPrice" ? summary.unitPrice : metric === "amount" ? summary.amount : summary.quantity;
  return { value, tradingDays: summary.tradingDays, lowSample: summary.lowSample };
};

/**
 * 선택 기간 전체를 묶기 기준별 한 값으로 모아 큰 순으로 정렬한다.
 * 비교 결과가 있으면 같은 키의 전년 값과 변화율을 붙인다.
 */
export const buildRankModel = (
  result: AnalysisResult,
  query: AnalysisQuery,
  comparison: AnalysisResult | null,
): RankItem[] => {
  const previousGroups = comparison ? groupRows(comparison.rows, query.groupBy) : null;

  return [...groupRows(result.rows, query.groupBy)]
    .flatMap(([key, rows]) => {
      const current = metricValue(rows, query.metric);
      if (current.value === null) return [];
      const previousRows = previousGroups?.get(key);
      const previous = previousRows ? metricValue(previousRows, query.metric).value : null;

      return [
        {
          key,
          label: query.groupBy === "grade" ? GradeKeyToKorean[key as GradeKey] : key,
          region: query.groupBy === "region" ? key : query.groupBy === "union" ? findRegionOfUnion(key) : null,
          value: current.value,
          previous,
          change: previous ? current.value / previous - 1 : null,
          tradingDays: current.tradingDays,
          lowSample: current.lowSample,
        },
      ];
    })
    .sort((a, b) => b.value - a.value);
};
