/** 단기 이동평균 윈도우 크기 (7일) */
export const MA_SHORT_WINDOW = 7;

/** 장기 이동평균 윈도우 크기 (14일) */
export const MA_LONG_WINDOW = 14;

/**
 * 이상 시즌 메모.
 * 흉작·이상기후 등 평년 비교 해석에 주의가 필요한 시즌을 기록한다.
 * 시즌 스트립·연도 겹침 범례·히트맵 행 라벨에 표식으로 노출한다.
 */
export const SEASON_NOTES: Readonly<Record<number, string>> = {
  2024: "역대급 흉작",
  2025: "역대급 흉작",
};

/** 평년 계산에 쓰는 직전 시즌 수 */
export const NORMAL_BASELINE_SEASONS = 10;

/** 평년 밴드 하단·상단 분위 */
export const NORMAL_BAND_QUANTILES = { LOWER: 0.25, MEDIAN: 0.5, UPPER: 0.75 } as const;

/** 표본 부족 판정 임계 */
export const LOW_SAMPLE_THRESHOLD = {
  /** 전체 공판일 수가 이보다 적으면 경고 */
  TRADING_DAYS: 5,
  /** 포인트 하나를 구성하는 레코드 수가 이보다 적으면 흐림 처리 */
  RECORDS_PER_POINT: 3,
} as const;

/** 시즌 주 단위 묶음 일수 */
export const SEASON_WEEK_DAYS = 7;

/** 하루 밀리초 */
export const MS_PER_DAY = 86_400_000;

/** 평년 밴드를 그리려면 해당 x에 필요한 최소 시즌 수 */
export const MIN_NORMAL_SEASONS = 3;

/** URL 연도 파라미터 허용 범위 */
export const QUERY_YEAR_RANGE = { MIN: 2000, MAX: 2100 } as const;

/** 질문 템플릿 시즌 수 */
export const TEMPLATE_SEASONS = {
  /** 누계 페이스에서 올해와 함께 겹칠 과거 시즌 수 */
  PACE_PAST: 5,
  /** 등급 구성 추이에서 볼 최근 시즌 수 */
  COMPOSITION: 10,
} as const;
