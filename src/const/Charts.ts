/** 연도별 추이 차트(지역·조합 페이지) 레이아웃 상수 */
export const YEARLY_TREND_CHART = {
  MARGIN: {
    MOBILE: { top: 12, right: 40, bottom: 28, left: 34 },
    DESKTOP: { top: 16, right: 52, bottom: 32, left: 44 },
  },
  /** 막대 사이 간격 비율 */
  BAND_PADDING: 0.32,
  /** 최댓값 위 여백 배수 */
  Y_HEADROOM: 1.12,
  Y_TICKS: 4,
  /** 모바일에서 표시할 최대 x축 눈금 수 */
  MOBILE_MAX_TICKS: 7,
  BAR_RADIUS: 3,
  BAR_OPACITY: 0.85,
  LINE_WIDTH: 2,
  DOT_RADIUS: 3,
  FONT_SIZE: 11,
  /** 기본 차트 높이 (px) */
  HEIGHT: 260,
} as const;
