import { RELATION_CHART } from "../../const/AnalysisLayout";
import type { AnalysisQuery, AnalysisResult, GradeRow } from "./types";

/** 관계 산점도의 한 점 */
export type RelationPoint = {
  key: string;
  label: string;
  year: number;
  region: string;
  union: string;
  quantity: number;
  unitPrice: number;
  records: number;
  seriesKey: string;
};

/** 관계 산점도 모델 */
export type RelationModel = {
  points: RelationPoint[];
  xDomain: [number, number];
  yDomain: [number, number];
  enoughPoints: boolean;
};

type PointBucket = {
  rows: GradeRow[];
  records: Set<string>;
};

/** 묶기 설정에 맞는 시리즈 키를 고른다 */
const seriesKeyOf = (row: GradeRow, query: AnalysisQuery): string => {
  if (query.groupBy === "year") return String(row.year);
  if (query.groupBy === "region") return row.region;
  return "all";
};

/** 동일 날짜·조합 또는 시즌·조합 행을 한 점으로 합친다 */
export const buildRelationModel = (result: AnalysisResult, query: AnalysisQuery): RelationModel => {
  const buckets = new Map<string, PointBucket>();

  for (const row of result.rows) {
    const period = query.granularity === "season" ? String(row.year) : row.date;
    const key = `${period}|${row.union}`;
    const bucket = buckets.get(key) ?? { rows: [], records: new Set<string>() };
    bucket.rows.push(row);
    bucket.records.add(`${row.date}|${row.union}`);
    buckets.set(key, bucket);
  }

  const points = [...buckets.entries()].map(([key, bucket]) => {
    const sample = bucket.rows[0];
    const quantity = bucket.rows.reduce((sum, row) => sum + row.quantity, 0);
    const amount = bucket.rows.reduce((sum, row) => sum + row.amount, 0);
    const period = query.granularity === "season" ? String(sample.year) : sample.date;
    return {
      key,
      label: `${sample.union} · ${period}`,
      year: sample.year,
      region: sample.region,
      union: sample.union,
      quantity,
      unitPrice: quantity > 0 ? amount / quantity : 0,
      records: bucket.records.size,
      seriesKey: seriesKeyOf(sample, query),
    };
  });

  const positiveQuantities = points.map((point) => point.quantity).filter((value) => value > 0);
  const prices = points.map((point) => point.unitPrice);
  const xMin = positiveQuantities.length > 0 ? Math.min(...positiveQuantities) : RELATION_CHART.EMPTY_DOMAIN_MIN;
  const xMax = positiveQuantities.length > 0 ? Math.max(...positiveQuantities) : RELATION_CHART.EMPTY_DOMAIN_MAX;
  const yMin = prices.length > 0 ? Math.min(...prices) : 0;
  const yMax = prices.length > 0 ? Math.max(...prices) : RELATION_CHART.EMPTY_DOMAIN_MAX;

  return {
    points,
    xDomain: xMin === xMax ? [xMin, xMin * RELATION_CHART.EMPTY_DOMAIN_MAX] : [xMin, xMax],
    yDomain: yMin === yMax ? [Math.max(0, yMin - RELATION_CHART.EMPTY_DOMAIN_MIN), yMax + RELATION_CHART.EMPTY_DOMAIN_MIN] : [yMin, yMax],
    enoughPoints: points.length >= RELATION_CHART.MIN_POINTS,
  };
};
