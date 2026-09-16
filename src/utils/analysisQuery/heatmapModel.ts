import { SEASON_WEEK_DAYS } from "../../const/Analysis";
import { buildXMapping, type ChartXMapping } from "./chartScale";
import type { AnalysisQuery, AnalysisResult } from "./types";

/** 히트맵 셀 */
export type HeatmapCell = {
  rowKey: string;
  year: number;
  column: number;
  x: string | number;
  value: number;
  records: number;
  lowSample: boolean;
};

/** 히트맵 행 */
export type HeatmapRow = { key: string; label: string; year: number };

/** 히트맵 모델 */
export type HeatmapModel = {
  mapping: ChartXMapping;
  rows: HeatmapRow[];
  /** 열 개수 (도메인 전체를 빈틈 없이 채운다) */
  columnCount: number;
  /** 열 번호 → 연속 위치 */
  columnPosition: (column: number) => number;
  cells: HeatmapCell[];
  valueDomain: [number, number];
};

/**
 * 집계 결과를 행 = 시리즈(최근 시즌이 위), 열 = 연속 날짜 칸으로 펼친다.
 * 공판이 없는 칸은 셀을 만들지 않아 빈칸으로 남는다.
 */
export const buildHeatmapModel = (result: AnalysisResult, query: AnalysisQuery): HeatmapModel => {
  const allX = result.series.flatMap((series) => series.points.map((point) => point.x));
  const mapping = buildXMapping(result.axis, allX, query.granularity);
  const step = query.granularity === "week" ? SEASON_WEEK_DAYS : 1;
  const [start, end] = mapping.domain;

  const rows = result.series
    .map((series) => ({ key: series.key, label: series.label, year: series.points[0]?.year ?? 0 }))
    .sort((a, b) => b.key.localeCompare(a.key));

  const cells = result.series.flatMap((series) =>
    series.points.flatMap((point) =>
      point.value === null
        ? []
        : [
            {
              rowKey: series.key,
              year: point.year,
              column: Math.round((mapping.toPosition(point.x) - start) / step),
              x: point.x,
              value: point.value,
              records: point.records,
              lowSample: point.lowSample,
            },
          ],
    ),
  );

  const values = cells.map((cell) => cell.value);

  return {
    mapping,
    rows,
    columnCount: allX.length === 0 ? 0 : Math.round((end - start) / step) + 1,
    columnPosition: (column) => start + column * step,
    cells,
    valueDomain: values.length === 0 ? [0, 1] : [Math.min(...values), Math.max(...values)],
  };
};
