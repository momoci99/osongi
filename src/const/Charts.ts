/** 큰글씨 모드에서 차트 SVG 글자에 거는 배율 */
export const LARGE_DISPLAY_FONT_SCALE = 1.2;

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
  /** 진행 중인 시즌 막대. 완료 연도보다 옅게 칠하고 점선 테두리로 미완임을 드러낸다 */
  ONGOING_BAR_OPACITY: 0.35,
  ONGOING_BAR_DASH: "3,2",
  /** 진행 중 막대 위 라벨 간격 (px) */
  ONGOING_LABEL_GAP: 6,
  LINE_WIDTH: 2,
  DOT_RADIUS: 3,
  FONT_SIZE: 11,
  /** 기본 차트 높이 (px) */
  HEIGHT: 260,
  /** 막대가 이보다 얇아지면 판독이 안 된다. 가로 스크롤로 전환하는 기준 (px) */
  MIN_BAR_WIDTH: 14,
  /** 모바일에서 오른쪽 가격 축 라벨을 생략해 확보하는 여백 (px) */
  MOBILE_RIGHT_MARGIN: 12,
  /** 대형 산불 표식 — 불난 뒤 첫 시즌 막대 왼쪽 경계에 세로선 + 머리 점 */
  FIRE_MARKER: {
    /** 머리 점이 들어갈 위쪽 여백 추가분 (px) */
    TOP_SPACE: 18,
    /** 머리 점 반지름 — 피해 규모를 로그 눈금으로 (100ha → 최소, 10배마다 한 단계) */
    RADIUS_MIN: 3,
    RADIUS_MAX: 7,
    RADIUS_PER_DECADE: 1.4,
    LINE_WIDTH: 1.5,
    DASH: "3,3",
    /** 가는 선도 쉽게 짚도록 넓힌 투명 영역 폭 (px) */
    HIT_WIDTH: 14,
  },
} as const;

/** 등급별 비중 막대 */
export const GRADE_SHARE_BAR = {
  HEIGHT: 6,
  RADIUS: "3px",
  OPACITY: 0.8,
  /**
   * 표 안에서의 막대 최대 폭 (px).
   * 트랙이 넓은 화면에서 200px 넘게 늘어나면 2% 항목은 점 하나만 남고
   * 나머지가 전부 빈 트랙이 되어 표에 회색 띠만 늘어선다.
   */
  TABLE_MAX_WIDTH: 120,
} as const;

/** 조합 간 단가 비교 배지 */
export const SCOPE_DELTA = {
  /** 이 값 미만 차이는 "비슷함"으로 묶는다 (%) */
  FLAT_THRESHOLD: 1,
} as const;
