/**
 * 산림청 산불발생통계 API (공공데이터포털 3070842) 설정
 */
export const FOREST_FIRE_API = {
  ENDPOINT: "https://apis.data.go.kr/1400000/forestStusService/getfirestatsservice",
  /** 한 해 산불(최대 약 700건)을 한 페이지에 받는다 */
  ROWS_PER_PAGE: 1000,
  REQUEST_INTERVAL_MS: 300,
} as const;

/** API 가 자료를 주는 첫 해 (2026-09-26 확인 — 2010 이전은 0건) */
export const FOREST_FIRE_FIRST_YEAR = 2011;
