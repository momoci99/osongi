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

/** 산림청 대형산불 기준 (피해 100ha 이상) — 조합 차트에 표시하는 문턱 */
export const LARGE_FIRE_MIN_HA = 100;

/**
 * 이 달부터 난 산불은 그해 송이 시즌이 이미 시작됐거나 끝난 뒤라 다음 시즌부터 영향을 준다.
 * 대형 산불은 대부분 2~5월 봄철이다.
 */
export const FIRE_SEASON_CUTOFF_MONTH = 9;

/** 조합별 산불 표식 공개 파일 (public/) */
export const WILDFIRE_PUBLIC_PATH = "/wildfire/union-fires.json";
