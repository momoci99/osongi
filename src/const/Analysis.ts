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
