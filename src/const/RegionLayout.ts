/** 지역 허브(/region)의 목록·카드 레이아웃 상수 */

/** 조합 랭크 리스트 */
export const SCOPE_RANK_LIST = {
  /** 행 최소 높이 (px). 44 미만이면 모바일 터치 목표가 좁아진다 */
  ROW_MIN_HEIGHT: { xs: 48, sm: 52 },
  DOT_SIZE: 8,
  /**
   * 막대 두께. 6px에서는 폭이 500px까지 늘어나 막대가 아니라 밑줄로 읽혔다.
   * 두께를 올리고 남는 폭을 이름 열과 나눠 길이:두께 비를 낮춘다.
   */
  BAR_HEIGHT: 10,
  BAR_RADIUS: "5px",
  /** 막대 트랙(배경) 불투명도 */
  TRACK_OPACITY: 0.12,
  /** 막대 채움 불투명도 */
  FILL_OPACITY: 0.85,
  /** 값이 0에 가까워도 존재는 보이게 하는 최소 막대 폭 (%) */
  MIN_BAR_PERCENT: 2,
  /**
   * 좁은 화면의 물량 스트립.
   * 행 배경 전체를 틴트로 채우면 색이 조합명 뒤를 지나 가독을 떨어뜨린다.
   * 행 아래쪽 얇은 띠로 옮겨 글자와 겹치지 않게 한다.
   */
  MOBILE_STRIP_HEIGHT: 3,
  MOBILE_STRIP_OPACITY: 0.75,
  /** 최신 시즌 집계가 없는 행 */
  MUTED_OPACITY: 0.55,
  /**
   * 그리드 열 구성. 좁은 화면은 막대 열을 접는다.
   * 넓은 화면에서 남는 폭은 이름 열과 막대 열이 1:2로 나눠 가진다.
   * 톤·단가는 고정 폭이라 두 숫자 열이 항상 오른쪽 끝에 붙는다.
   */
  COLUMNS: {
    /** 좁은 화면의 단가 열은 델타 배지(▼11%)가 함께 들어갈 폭을 잡는다 */
    xs: "24px minmax(0, 1fr) 44px 116px",
    sm: "32px minmax(120px, 1fr) minmax(160px, 2.2fr) 76px 132px",
  },
  /**
   * 목록을 감싸는 패널.
   * 같은 페이지의 등급표는 카드 위에 있는데 목록만 맨바닥에 떠 있어
   * 두 데이터 블록의 격이 어긋났다. 표면 계단을 목록에도 적용한다.
   */
  PANEL_RADIUS: "0.75rem",
  /** 패널 안쪽 좌우 여백. 테두리가 생긴 만큼 바닥에 놓였을 때보다 넓힌다 */
  PANEL_PX: { xs: 1.5, sm: 2 },
} as const;

/** 지역 카드의 연도별 단가 스파크라인 */
export const REGION_SPARKLINE = {
  WIDTH: 108,
  HEIGHT: 40,
  /** 좁은 화면 크기. viewBox 는 그대로 두고 표시 크기만 줄인다 */
  MOBILE_WIDTH: 76,
  MOBILE_HEIGHT: 28,
  /** 위아래 여백 (px). 꼭짓점 원이 잘리지 않을 만큼 */
  PADDING_Y: 5,
  LINE_WIDTH: 1.75,
  DOT_RADIUS: 2.75,
  AREA_OPACITY: 0.16,
  /** 표시할 최근 연도 수 */
  MAX_YEARS: 10,
  /** 선이 그려지려면 최소 두 점이 필요하다 */
  MIN_POINTS: 2,
} as const;

/**
 * 페이지 상단 2단 배치.
 * 제목·요약 문단을 68ch로 묶어 두면 1440 화면에서 오른쪽 절반이 통째로 빈다.
 * 지표 패널을 그 자리에 세워 첫 화면이 좌우로 닫히게 한다.
 */
export const SCOPE_HERO = {
  /** 지표 패널 열 폭 (px). 라벨 아래 보조 설명이 한 줄에 들어가는 최소치 */
  STATS_WIDTH: 324,
  /** 본문 열의 최대 글자 폭 */
  TEXT_MAX_WIDTH: "62ch",
  /** 2단으로 갈라지는 중단점 */
  SPLIT_BREAKPOINT: "md",
} as const;

/** 지표 패널 */
export const SCOPE_STAT_PANEL = {
  /**
   * 단위 열 폭 (px).
   * 단위를 값 뒤에 그냥 붙이면 `원/kg`·`톤`·단위 없음이 섞일 때
   * 행마다 숫자 끝나는 위치가 달라져 세로로 어긋나 보인다.
   * 단위를 고정 폭 열로 빼서 숫자의 오른쪽 기준선을 하나로 맞춘다.
   */
  UNIT_WIDTH: 40,
} as const;

/** 섹션 제목이 항상 하위 요소보다 크도록 고정한 값 */
export const SCOPE_SECTION_HEADING = {
  FONT_SIZE: "1.125rem",
  LETTER_SPACING: "0.01em",
  MARGIN_TOP: 5,
  MARGIN_BOTTOM: 1.5,
} as const;
