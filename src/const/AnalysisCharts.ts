/** 분석 탐색기 순위·구성 차트 상수 */

/** 순위 (가로 막대) */
export const RANK_CHART = {
  ROW_HEIGHT: 32,
  BAR_THICKNESS: 14,
  BAR_RADIUS: 4,
  /** 라벨 열 폭 (px) */
  LABEL_WIDTH: { MOBILE: 72, DESKTOP: 112 },
  /** 값 텍스트 열 폭 (px) */
  VALUE_WIDTH: { MOBILE: 84, DESKTOP: 104 },
  /** 전년 대비 열 폭 (px) */
  CHANGE_WIDTH: 64,
  MARGIN_TOP: 8,
  /** 전년 표식 반지름 (px) */
  PREVIOUS_MARKER_RADIUS: 4.5,
  /** 지역 점 반지름 (px) */
  DOT_RADIUS: 3.5,
  /** 라벨·값 글자 크기 (px) */
  FONT_SIZE: 12,
  /** 퍼센트 환산 */
  PERCENT: 100,
  /** 표본 부족 행 불투명도 */
  LOW_SAMPLE_OPACITY: 0.55,
} as const;

/** 구성 (100% 누적 막대) */
export const COMPOSITION_CHART = {
  HEIGHT: { MOBILE: 280, DESKTOP: 380 },
  MARGIN: { top: 12, right: 12, bottom: 32, left: 44 },
  /** 막대 사이 여백 비율 */
  BAND_PADDING: 0.28,
  /** 누적 조각 사이 표면 간격 (px) */
  SEGMENT_GAP: 2,
  BAR_RADIUS: 3,
  /** 조각 안에 비율 텍스트를 넣는 최소 높이 (px) */
  MIN_LABEL_HEIGHT: 18,
  /** 조각 안에 비율 텍스트를 넣는 최소 막대 폭 (px) */
  MIN_LABEL_WIDTH: 34,
  FONT_SIZE: 11,
  Y_TICKS: [0, 0.25, 0.5, 0.75, 1],
} as const;

/** 조합 식별색 — 같은 지역 조합끼리 밝기를 벌리는 전체 폭 (HSL L) */
export const UNION_LIGHTNESS_SPREAD = 0.3;
