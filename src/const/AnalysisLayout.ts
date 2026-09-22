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
  /** 좁은 화면에서 연도 라벨을 두 자리로 줄이는 기준 폭 (px) */
  COMPACT_LABEL_WIDTH: 720,
  /** 연도 라벨 글자 크기 (px) */
  LABEL_FONT_SIZE: 11,
  /** 라벨 기준선 — 라벨 영역 상단에서의 거리 (px) */
  LABEL_BASELINE: 15,
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
  DIRECT_LABEL_MIN_GAP: 15,
  /** 직접 라벨 뒤 표면색 후광 두께 (px) — 선 위에 겹쳐도 읽히게 */
  LABEL_HALO_WIDTH: 3,
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

/** 히트맵 (시즌 × 날짜) */
export const HEATMAP = {
  ROW_HEIGHT: { MOBILE: 18, DESKTOP: 24 },
  /** 셀 사이 틈 (px) — 인접 채움 사이 표면 간격 */
  CELL_GAP: 1.5,
  CELL_RADIUS: 2,
  /** 가로 스크롤 전환 기준 셀 최소 폭 (px) */
  MIN_CELL_WIDTH: 5,
  MARGIN: { top: 24, right: 12, bottom: 8, left: 64 },
  /**
   * 색 램프 시작점 — 표면색과 강조색 사이 위치.
   * 다크 표면은 어두운 초록과 거의 구분되지 않아 더 앞에서 시작한다.
   */
  RAMP_START: { LIGHT: 0.1, DARK: 0.3 },
  /** 범례 그라데이션 폭·높이 (px) */
  LEGEND_WIDTH: 160,
  LEGEND_HEIGHT: 8,
} as const;

/** 관계 산점도 */
export const RELATION_CHART = {
  HEIGHT: { MOBILE: 300, DESKTOP: 420 },
  MARGIN: {
    /** top은 가로로 놓은 y축 제목 자리까지 포함한다 */
    MOBILE: { top: 28, right: 16, bottom: 48, left: 58 },
    DESKTOP: { top: 32, right: 24, bottom: 52, left: 72 },
  },
  MIN_POINTS: 10,
  /** 10의 거듭제곱 눈금만으로 충분하다고 보는 최소 개수 */
  MIN_DECADE_TICKS: 3,
  POINT_RADIUS: 3.5,
  HOVER_POINT_RADIUS: 5.5,
  POINT_OPACITY: 0.7,
  CONTEXT_OPACITY: 0.42,
  POINT_STROKE_WIDTH: 1,
  Y_PADDING_RATIO: 0.08,
  AXIS_TICK_COUNT: 5,
  AXIS_FONT_SIZE: 11,
  AXIS_TITLE_OFFSET: 38,
  /** 플롯 위에 놓는 y축 제목 기준선 (px, 플롯 위 끝 기준) */
  Y_TITLE_OFFSET: 12,
  TOOLTIP_Y_OFFSET: 12,
  EMPTY_DOMAIN_MIN: 1,
  EMPTY_DOMAIN_MAX: 10,
} as const;

/** 조합 × 시즌 커버리지 행렬 */
export const COVERAGE_MATRIX = {
  ROW_HEIGHT: { MOBILE: 26, DESKTOP: 30 },
  MARGIN: { top: 32, right: 12, bottom: 8, left: 84 },
  MIN_CELL_WIDTH: 22,
  CELL_GAP: 2,
  CELL_RADIUS: 3,
  CELL_TEXT_MIN_WIDTH: 26,
  DARK_FILL_RATIO: 0.55,
  RAMP_START: 0.1,
  EMPTY_STROKE_WIDTH: 1,
  AXIS_FONT_SIZE: 11,
  REGION_DOT_RADIUS: 3,
  REGION_DOT_X: -72,
  LABEL_X: -62,
  LEGEND_WIDTH: 112,
  LEGEND_HEIGHT: 8,
  TOOLTIP_Y_OFFSET: 12,
} as const;

/** 결과 계산 중 표시와 결과 도착 전환 */
export const EXPLORER_PENDING = {
  /** 이보다 빨리 끝나면 대기 표시를 띄우지 않는다 (ms) */
  DELAY_MS: 100,
  /** 대기 표시가 들어오고 나가는 시간 (ms) */
  FADE_MS: 160,
  /** 대기 중 직전 결과 불투명도 */
  CONTENT_OPACITY: 0.55,
  /** 대기 중 직전 결과 흐림 (px) */
  BLUR_PX: 1.5,
  /** 대기 중 직전 결과 채도 */
  SATURATION: 0.7,
  /** 상단 진행 바 */
  BAR_HEIGHT: 2,
  BAR_CYCLE_MS: 900,
  /** 진행 바 조각 폭 (%) */
  BAR_WIDTH_PERCENT: 40,
  /** 빛줄기 한 번 훑는 시간 (ms) */
  SWEEP_CYCLE_MS: 1100,
  /** 빛줄기 폭 (%) */
  SWEEP_WIDTH_PERCENT: 45,
  /** 빛줄기 밝기 — 다크·라이트 */
  SWEEP_ALPHA: { DARK: 0.08, LIGHT: 0.7 },
  /** 새 결과가 흐림에서 선명해지는 시간 (ms) */
  ARRIVE_MS: 140,
} as const;

/** 조회 결과 캐시 */
export const EXPLORER_DATA_CACHE = {
  /** 보관할 결과 수 — 템플릿 6개 + 최근 조작 */
  LIMIT: 24,
  /** 유휴 콜백이 없을 때 템플릿 미리 계산 대기 (ms) */
  IDLE_FALLBACK_MS: 300,
} as const;

/** 날씨 뷰 (시즌별 공판량·강수·기온 세로 나열) */
export const WEATHER_CHART = {
  /** 한 번에 그리는 최대 시즌 수 — 넘으면 최근 시즌부터 */
  MAX_PANELS: 4,
  /** 공판 첫날·끝날 앞뒤 여백 (일) */
  DOMAIN_PAD_DAYS: 10,
  /** 줄 높이 (px) */
  ROW_HEIGHT: {
    MOBILE: { quantity: 72, rain: 44, temperature: 64 },
    DESKTOP: { quantity: 96, rain: 52, temperature: 80 },
  },
  /** 한 시즌 안 줄 사이 간격 (px) */
  ROW_GAP: 14,
  /** 시즌 패널 사이 간격 (px) — 연도 제목 포함 */
  PANEL_GAP: 36,
  /** 연도 제목 높이 (px) — 첫 줄 최대 눈금 라벨과 겹치지 않을 만큼 */
  PANEL_TITLE_HEIGHT: 34,
  MARGIN: {
    MOBILE: { top: 8, right: 12, bottom: 28, left: 52 },
    DESKTOP: { top: 8, right: 20, bottom: 30, left: 64 },
  },
  /** 막대 사이 틈 (px) */
  BAR_GAP: 1,
  /** 옮긴 강수 참고 막대 불투명도 */
  SHIFTED_RAIN_OPACITY: 0.28,
  /** 기온 밴드 불투명도 — 다크 표면에서는 같은 값이 탁한 갈색으로 가라앉아 따로 둔다 */
  TEMPERATURE_BAND_OPACITY: { light: 0.22, dark: 0.26 },
  /** 지면온도 선 두께 (px) */
  GROUND_STROKE: 2,
  /** 각 줄 y 눈금 개수 */
  Y_TICK_COUNT: 3,
  /** 기온 축 위아래 여유 (°C) */
  TEMPERATURE_PAD: 1,
  /** 호버 안내선 불투명도 */
  GUIDE_OPACITY: 0.6,
} as const;
