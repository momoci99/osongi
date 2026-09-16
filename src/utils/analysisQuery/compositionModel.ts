import { compareX } from "./aggregate";
import { GRADE_KEYS } from "./rows";
import type { AnalysisResult, GradeKey } from "./types";

/** 누적 막대 조각 */
export type CompositionSegment = {
  grade: GradeKey;
  share: number;
  /** 아래쪽 누적 비율 */
  offset: number;
  quantity: number;
};

/** 누적 막대 한 개 (구간) */
export type CompositionColumn = {
  key: string;
  year: number;
  x: string | number;
  total: number;
  segments: CompositionSegment[];
};

/**
 * 등급별 시리즈를 구간(연도·주·일)별 100% 누적 막대로 바꾼다.
 * 조각 순서는 등급 고정 순서(1등품이 아래) — 필터가 바뀌어도 쌓는 순서는 같다.
 */
export const buildCompositionModel = (result: AnalysisResult): CompositionColumn[] => {
  const columns = new Map<string, CompositionColumn>();

  for (const series of result.series) {
    const grade = series.key as GradeKey;
    for (const point of series.points) {
      const key = `${point.year}|${point.x}`;
      const column = columns.get(key) ?? { key, year: point.year, x: point.x, total: 0, segments: [] };
      column.total += point.quantity;
      column.segments.push({ grade, share: 0, offset: 0, quantity: point.quantity });
      columns.set(key, column);
    }
  }

  return [...columns.values()]
    .sort((a, b) => a.year - b.year || compareX(a.x, b.x))
    .map((column) => {
      let offset = 0;
      const segments = [...column.segments]
        .sort((a, b) => GRADE_KEYS.indexOf(a.grade) - GRADE_KEYS.indexOf(b.grade))
        .map((segment) => {
          const share = column.total > 0 ? segment.quantity / column.total : 0;
          const placed = { ...segment, share, offset };
          offset += share;
          return placed;
        });
      return { ...column, segments };
    });
};
