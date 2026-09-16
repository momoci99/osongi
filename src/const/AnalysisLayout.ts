/** 분석 탐색기(/data-analysis) 레이아웃 상수 */

/** 페이지 그리드 */
export const EXPLORER_LAYOUT = {
  /** 요약 패널 폭 (px) */
  ASIDE_WIDTH: 300,
  /** 요약 패널이 오른쪽에 붙는 최소 브레이크포인트 */
  ASIDE_BREAKPOINT: "lg",
  /** sticky 요약 패널 상단 여백 (px) — 전역 내비 높이 + 여유 */
  STICKY_TOP: 80,
  /** 섹션 간 세로 간격 (MUI spacing) */
  SECTION_GAP: 2,
  /** 메인 뷰 최소 높이 (px) */
  VIEW_MIN_HEIGHT: 520,
} as const;

/** 시즌 스트립 — 비시즌을 접고 연도별 시즌 창만 이어 붙인 타임라인 */
export const SEASON_STRIP = {
  /** 시즌 창 시작 (MM-DD). 2013~2026 첫 공판일이 모두 이후 */
  WINDOW_START: "09-01",
  /** 시즌 창 길이 (일). 09-01 ~ 11-30 */
  WINDOW_DAYS: 91,
  /** 막대 영역 높이 (px) */
  PLOT_HEIGHT: 44,
  /** 연도 라벨 영역 높이 (px) */
  LABEL_HEIGHT: 22,
  /** 연도 구간 사이 여백 비율 */
  BAND_PADDING: 0.14,
  /** 선택되지 않은 시즌 막대 불투명도 */
  MUTED_OPACITY: 0.32,
  /** 선택 기간 배경 불투명도 */
  RANGE_FILL_OPACITY: 0.14,
  /** 이상 시즌 표식 반지름 (px) */
  NOTE_DOT_RADIUS: 2.5,
  /** 좁은 화면에서 연도 라벨을 두 자리로 줄이는 기준 폭 (px) */
  COMPACT_LABEL_WIDTH: 720,
  /** 연도 라벨 글자 크기 (px) */
  LABEL_FONT_SIZE: 11,
  /** 라벨 기준선 — 라벨 영역 상단에서의 거리 (px) */
  LABEL_BASELINE: 15,
  /** 이상 시즌 표식과 라벨 사이 간격 (px) */
  NOTE_DOT_GAP: 5,
  /** 막대 최소 폭 (px) */
  MIN_BAR_WIDTH: 0.8,
  /** 인접 막대 사이 틈 (px) */
  BAR_GAP: 0.4,
} as const;

/** 질문 템플릿 카드 */
export const TEMPLATE_BAR = {
  /** 카드 최소 폭 (px). 좁은 화면은 가로 스크롤 */
  CARD_MIN_WIDTH: 168,
} as const;

/** 상세 표 */
export const EXPLORER_TABLE = {
  /** 표 최대 높이 (px). 넘치면 내부 스크롤 + 머리글 고정 */
  MAX_HEIGHT: 560,
  /** 피벗 표에서 한 번에 보여줄 최대 시리즈 열 수 */
  MAX_SERIES_COLUMNS: 14,
} as const;

/** 선 차트 (연도 겹침·추이) */
export const LINE_CHART = {
  HEIGHT: { MOBILE: 300, DESKTOP: 420 },
  MARGIN: {
    MOBILE: { top: 16, right: 44, bottom: 36, left: 44 },
    DESKTOP: { top: 20, right: 72, bottom: 40, left: 60 },
  },
  /** 강조 시리즈 선 두께 (px) */
  STROKE_EMPHASIS: 2.5,
  /** 일반 시리즈 선 두께 (px) */
  STROKE: 2,
  /** 문맥(비강조) 시리즈 선 두께 (px) */
  STROKE_CONTEXT: 1.5,
  /** 이 일수보다 긴 공백은 선을 끊는다 (일 단위). 공판은 주말·우천으로 1~2일씩 자주 비어 짧은 공백까지 끊으면 선이 파편화된다 */
  GAP_BREAK_DAYS: 3,
  /** 주 단위에서 끊는 공백 (일) */
  GAP_BREAK_DAYS_WEEK: 14,
  /** 달력 기간 축에서 시즌 사이 접힌 간격 (일 환산) */
  SEASON_GAP_DAYS: 8,
  /** 포인트 마커를 항상 그리는 시리즈당 최대 포인트 수 */
  MARKER_MAX_POINTS: 40,
  MARKER_RADIUS: 3,
  HOVER_MARKER_RADIUS: 4.5,
  /** 표본 부족 포인트 불투명도 */
  LOW_SAMPLE_OPACITY: 0.4,
  /** 평년 밴드 채움 불투명도 */
  BAND_OPACITY: 0.14,
  /** 직접 라벨을 붙이는 최대 시리즈 수 */
  DIRECT_LABEL_MAX_SERIES: 6,
  /** 직접 라벨 사이 최소 세로 간격 (px) */
  DIRECT_LABEL_MIN_GAP: 13,
  /** 가격처럼 0 기준이 아닌 축의 위아래 여유 비율 */
  Y_PADDING_RATIO: 0.08,
  /** 월 눈금을 그리는 시즌 구간 최소 폭 (px) */
  MONTH_TICK_MIN_SEGMENT_WIDTH: 140,
  /** 문맥 시리즈 최소·최대 불투명도 (오래된 시즌일수록 흐리게) */
  CONTEXT_OPACITY: { MIN: 0.35, MAX: 0.75 },
  /** 시즌 일차 축 눈금 간격 (일) */
  SEASON_DAY_TICK_STEP: 10,
  /** 축 글자 크기 (px) */
  AXIS_FONT_SIZE: 11,
  /** y 눈금 개수 목표 */
  Y_TICK_COUNT: 5,
  /** x 눈금 라벨과 플롯 사이 간격 (px) */
  X_LABEL_OFFSET: 18,
  /** y 눈금 라벨과 플롯 사이 간격 (px) */
  Y_LABEL_OFFSET: 10,
  /** 직접 라벨과 선 끝 사이 간격 (px) */
  DIRECT_LABEL_OFFSET: 8,
  /** 툴팁과 커서 사이 간격 (px) */
  TOOLTIP_OFFSET: 14,
  /** x 눈금 라벨 사이 최소 간격 (px) */
  MIN_TICK_GAP: 48,
  /** 툴팁 최대 폭 (px) */
  TOOLTIP_MAX_WIDTH: 320,
} as const;
