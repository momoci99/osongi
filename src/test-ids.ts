/** e2e 테스트용 data-testid 상수 */
export const TEST_IDS = {
  APP_BAR: "app-bar",
  /** 초기 데이터 다운로드·IndexedDB 저장 중 화면 */
  DATA_LOADING: "data-loading",
  /** 초기화가 끝나 실제 화면이 붙은 상태 */
  APP_CONTENT: "app-content",
  REGION_SELECT: "region-select",
  GRADE_SELECT: "grade-select",
  COMPARISON_TOGGLE: "comparison-toggle",
  ADVANCED_FILTER_BUTTON: "advanced-filter-button",
  APP_FOOTER: "app-footer",
} as const;
