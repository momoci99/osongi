/** 지역 허브(/region)의 목록·카드 레이아웃 상수 */

/** 조합 랭크 리스트 */
export const SCOPE_RANK_LIST = {
  /** 행 최소 높이 (px). 44 미만이면 모바일 터치 목표가 좁아진다 */
  ROW_MIN_HEIGHT: { xs: 44, sm: 48 },
  DOT_SIZE: 8,
  BAR_HEIGHT: 6,
  BAR_RADIUS: "3px",
  /** 막대 트랙(배경) 불투명도 */
  TRACK_OPACITY: 0.1,
  /** 막대 채움 불투명도 */
  FILL_OPACITY: 0.85,
  /** 값이 0에 가까워도 존재는 보이게 하는 최소 막대 폭 (%) */
  MIN_BAR_PERCENT: 2,
  /** 좁은 화면에서 행 배경으로 물량을 표현할 때의 틴트 불투명도 */
  ROW_TINT_OPACITY: 0.09,
  /** 최신 시즌 집계가 없는 행 */
  MUTED_OPACITY: 0.55,
  /**
   * 그리드 열 구성. 좁은 화면은 막대 열을 접는다.
   * 막대에 상한을 두지 않으면 넓은 화면에서 6px 높이가 600px까지 늘어나 실이 된다.
   * 남는 폭은 톤 열이 흡수해 숫자 두 열이 오른쪽에 붙는다.
   */
  COLUMNS: {
    xs: "24px minmax(0, 1fr) 52px 82px",
    sm: "32px minmax(0, 200px) minmax(48px, 480px) minmax(64px, 1fr) 116px",
  },
} as const;

/** 지역 카드의 연도별 단가 스파크라인 */
export const REGION_SPARKLINE = {
  WIDTH: 108,
  HEIGHT: 40,
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

/** 섹션 제목이 항상 하위 요소보다 크도록 고정한 값 */
export const SCOPE_SECTION_HEADING = {
  FONT_SIZE: "1.125rem",
  LETTER_SPACING: "0.01em",
  MARGIN_TOP: 5,
  MARGIN_BOTTOM: 1.5,
} as const;
