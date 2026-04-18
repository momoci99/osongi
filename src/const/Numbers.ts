// ===== 송이버섯 시즌 관련 상수 =====
export const MUSHROOM_SEASON = {
  START_MONTH: 8, // 8월
  END_MONTH: 12, // 12월
} as const;

// ===== 기본 날짜 범위 설정 =====
export const DEFAULT_DATE_RANGE = {
  RECENT_DAYS: 7, // 최근 N일
  DAYS_OFFSET: 6, // 7일 - 1 (시작일 오프셋)
  FALLBACK_MONTH: 9, // 10월 (JS Date는 0-based)
  FALLBACK_START_DAY: 1, // 1일
  FALLBACK_END_DAY: 7, // 7일
} as const;

// ===== 차트 레이아웃 상수 =====
export const CHART_LAYOUT = {
  DEFAULT_HEIGHT: 400,
  MIN_HEIGHT: 300,
  MOBILE_BREAKPOINT: 768,
} as const;

// ===== 차트 여백 설정 =====
export const CHART_MARGINS = {
  TOP: 40,
  BOTTOM: 60,
  MOBILE: {
    LEFT: 60,
    RIGHT: 20,
  },
  DESKTOP: {
    LEFT: 80,
    RIGHT: 24,
  },
} as const;

// ===== 폰트 크기 설정 =====
export const FONT_SIZES = {
  MOBILE: {
    TITLE: "12px",
    AXIS: "8px",
    LEGEND: "10px",
    MESSAGE: "14px",
  },
  DESKTOP: {
    TITLE: "14px",
    AXIS: "10px",
    LEGEND: "12px",
    MESSAGE: "16px",
  },
  LARGE: {
    MOBILE: {
      TITLE: "14px",
      AXIS: "10px",
      LEGEND: "12px",
      MESSAGE: "16px",
    },
    DESKTOP: {
      TITLE: "16px",
      AXIS: "12px",
      LEGEND: "14px",
      MESSAGE: "18px",
    },
  },
} as const;

// ===== 적응적 틱 간격 임계값 =====
export const TICK_INTERVALS = {
  SHORT_PERIOD: 7, // 일주일 이하
  MEDIUM_PERIOD: 15, // 2주 정도
  MOBILE: {
    SHORT_RETURN: 2,
    MEDIUM_RETURN: 3,
    LONG_MIN: 5,
    DIVISOR: 5,
  },
  DESKTOP: {
    SHORT_RETURN: 1,
    MEDIUM_RETURN: 2,
    LONG_MIN: 3,
    DIVISOR: 7,
  },
} as const;

// ===== 등급별 대시 패턴 =====
export const GRADE_DASH_PATTERNS = {
  grade1: "0",
  grade2: "5,5",
  grade3Stopped: "10,5",
  grade3Estimated: "15,10,5,10",
  gradeBelow: "5,10,5",
  mixedGrade: "20,5",
} as const;

// ===== 등급별 색상 인덱스 =====
export const GRADE_COLOR_INDICES = {
  grade1: 0,
  grade2: 1,
  grade3Stopped: 2,
  grade3Estimated: 3,
  gradeBelow: 4,
  mixedGrade: 5,
} as const;

// ===== 날짜 관련 상수 =====
export const DATE_CONSTANTS = {
  MONTH_OFFSET: 1, // JS Date month는 0-based이므로 +1
  DATE_INCREMENT: 1, // 하루씩 증가
  ISO_DATE_PART_INDEX: 0, // "T"로 split했을 때 날짜 부분
  HOURS_RESET: 0, // 시간을 0으로 리셋
  MINUTES_RESET: 0, // 분을 0으로 리셋
  SECONDS_RESET: 0, // 초를 0으로 리셋
  MILLISECONDS_RESET: 0, // 밀리초를 0으로 리셋
} as const;

// ===== 숫자 파싱 관련 =====
export const PARSING = {
  MIN_VALID_VALUE: 0, // 유효한 최소값
  DECIMAL_PLACES: 2, // 소수점 자릿수 (padding용)
} as const;

// ===== UI 레이아웃 상수 =====
export const UI_LAYOUT = {
  SECTION_MARGIN_BOTTOM: 2,
} as const;

// ===== 테이블 레이아웃 상수 =====
export const TABLE_CONSTANTS = {
  MAX_HEIGHT: 400, // 테이블 최대 높이
  ROWS_PER_PAGE_DEFAULT: 10, // 기본 페이지당 행 수
  ROWS_PER_PAGE_OPTIONS: [5, 10, 25, 50], // 페이지당 행 수 옵션
  HEADER_FONT_WEIGHT: 600, // 헤더 폰트 굵기
  CELL_PADDING: "8px 16px", // 셀 패딩
  DATE_COLUMN_WIDTH: 100, // 날짜 컬럼 너비
  REGION_COLUMN_WIDTH: 80, // 지역 컬럼 너비
  UNION_COLUMN_WIDTH: 120, // 조합 컬럼 너비
  GRADE_COLUMN_WIDTH: 60, // 등급 컬럼 너비
  QUANTITY_COLUMN_WIDTH: 80, // 수량 컬럼 너비
  PRICE_COLUMN_WIDTH: 100, // 단가 컬럼 너비
} as const;

