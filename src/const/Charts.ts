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
  /** 막대가 이보다 얇아지면 판독이 안 된다. 가로 스크롤로 전환하는 기준 (px) */
  MIN_BAR_WIDTH: 14,
  /** 모바일에서 오른쪽 가격 축 라벨을 생략해 확보하는 여백 (px) */
  MOBILE_RIGHT_MARGIN: 12,
} as const;

/** 등급별 비중 막대 */
export const GRADE_SHARE_BAR = {
  HEIGHT: 6,
  RADIUS: "3px",
  OPACITY: 0.8,
} as const;

/** 조합 간 단가 비교 배지 */
export const SCOPE_DELTA = {
  /** 이 값 미만 차이는 "비슷함"으로 묶는다 (%) */
  FLAT_THRESHOLD: 1,
} as const;
