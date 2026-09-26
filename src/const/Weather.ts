/**
 * 기상청 ASOS 일자료 연동 상수.
 * 근거와 결정 이력은 docs/planning/weather-correlation-plan.md 참조.
 */

/** 기상청 지상(종관, ASOS) 일자료 조회서비스 */
export const KMA_ASOS_DAILY = {
  ENDPOINT:
    "http://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList",
  DATA_CODE: "ASOS",
  DATE_CODE: "DAY",
  /** 수집 창 153일을 한 페이지에 받는다 */
  ROWS_PER_PAGE: 200,
  /** D-1 자료가 공개되는 시각 (KST) */
  PREV_DAY_OPEN_HOUR_KST: 11,
  /** 순차 호출 간격 — 초당 한도(30tps)와 무관하게 여유를 둔다 */
  REQUEST_INTERVAL_MS: 300,
} as const;

/** 공공데이터포털 응답 코드 */
export const KMA_RESULT_CODE = {
  OK: "00",
  NO_DATA: "03",
  QUOTA_EXCEEDED: "22",
} as const;

/**
 * 연도별 수집 창 (MMDD).
 * 시즌(9~11월)에 시차 분석용 선행 구간(7~8월)을 더한다.
 */
export const WEATHER_COLLECTION_WINDOW = {
  START_MMDD: "0701",
  END_MMDD: "1130",
} as const;

/** 수집 시작 연도 — 공판 데이터 보유 시작과 맞춘다 */
export const WEATHER_FIRST_YEAR = 2013;

/**
 * 원본에 보존하는 응답 필드.
 * 값은 가공하지 않고 문자열 그대로 저장한다 (빈 문자열 = 결측 또는 무강수).
 */
export const KMA_DAILY_FIELDS = [
  "tm",
  "avgTa",
  "minTa",
  "maxTa",
  "sumRn",
  "sumRnDur",
  "n99Rn",
  "avgRhm",
  "minRhm",
  "avgTd",
  "avgTs",
  "minTg",
  "avgCm5Te",
  "avgCm10Te",
  "avgCm20Te",
  "avgCm30Te",
  "sumSsHr",
] as const;

/** 조합이 대응되는 ASOS 관측지점 */
export type WeatherStation = {
  stationId: number;
  stationName: string;
  /** 조합 소재지에 동명 지점이 없어 인근 지점으로 대체했는지 */
  isSubstitute: boolean;
  /** 대체 지점일 때 군청 소재지 ~ 지점 거리 (km, 근사) */
  distanceKm?: number;
};

const station = (stationId: number, stationName: string): WeatherStation => ({
  stationId,
  stationName,
  isSubstitute: false,
});

const substitute = (
  stationId: number,
  stationName: string,
  distanceKm: number,
): WeatherStation => ({ stationId, stationName, isSubstitute: true, distanceKm });

/**
 * 조합 → ASOS 지점 매핑. 대체 지점은 군청 소재지 기준 최근접 지점이다.
 * 키는 REGION_UNION_MAP 의 조합명과 일치해야 한다 (테스트로 검증).
 */
export const UNION_WEATHER_STATION: Record<string, WeatherStation> = {
  홍천: station(212, "홍천"),
  양구: substitute(211, "인제", 16.5),
  인제: station(211, "인제"),
  고성: substitute(90, "속초", 16.8),
  양양: substitute(90, "속초", 20.1),
  강릉: station(105, "강릉"),
  삼척: substitute(106, "동해", 7.3),
  의성: station(278, "의성"),
  안동: station(136, "안동"),
  청송: station(276, "청송"),
  영덕: station(277, "영덕"),
  포항: station(138, "포항"),
  청도: substitute(288, "밀양", 17.3),
  상주: station(137, "상주"),
  문경: station(273, "문경"),
  예천: substitute(272, "영주", 24.4),
  영주: station(272, "영주"),
  봉화: station(271, "봉화"),
  울진: station(130, "울진"),
  영천: station(281, "영천"),
  거창: station(284, "거창"),
};

/**
 * 5~30cm 지중온도를 관측하는 지점 (2026-09-22 확인).
 * 지면온도(avgTs)를 지온 대리 지표로 쓸 수 있는지 검증하는 데 사용한다.
 */
export const SOIL_TEMP_STATION_IDS = [101, 104, 105, 138, 276] as const;

/** 기상 시계열 분석 공통 설정 */
export const WEATHER_ANALYSIS = {
  /** 이동평균 창 (일) */
  MOVING_AVERAGE_DAYS: 7,
  /** 이동평균 창 안에 필요한 최소 관측일 — 미만이면 결측 */
  MOVING_AVERAGE_MIN_COUNT: 5,
  /** 상관계수를 낼 최소 표본 */
  MIN_CORRELATION_SAMPLES: 3,
} as const;

/** 클라이언트용 공개 파일에 담는 필드 (public/weather/{stationId}.json) */
export const WEATHER_PUBLIC_FIELDS = [
  "avgTa",
  "minTa",
  "maxTa",
  "sumRn",
  "avgRhm",
  "avgTs",
  "avgCm5Te",
] as const;

/** 공개 파일 경로 */
export const WEATHER_PUBLIC_PATH = "/weather";

/** 공개 파일 수치 소수 자릿수 */
export const WEATHER_PUBLIC_DECIMALS = 1;

/**
 * "약 3주 전 비" 참고 레이어 — H1 탐색 최적 조합 (기획서 9-1).
 * 날짜 d 에 d−(LAG+WINDOW−1) ~ d−LAG 의 누적 강수를 붙인다. 게이트 미통과라 참고용.
 */
export const RAIN_LAG_HINT = {
  WINDOW_DAYS: 7,
  LAG_DAYS: 22,
} as const;

/** 평년 비교 (V2, 기획서 7-1) */
export const WEATHER_NORMAL = {
  /** 월별 점 분포에 그리는 달 — 7·8월은 시즌 전, 9·10월은 시즌 */
  MONTHS: [7, 8, 9, 10],
  /** 한 해를 평년 계산에 넣는 최소 관측일 비율 */
  MIN_COVERAGE: 0.9,
  /** 누적 강수 곡선 끝 (MMDD) */
  CUMULATIVE_END_MMDD: "1031",
} as const;
