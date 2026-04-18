export type ChartMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/**
 * 현재 차트 너비가 모바일 기준인지 판단합니다.
 */
export const isMobileWidth = (width: number): boolean => width < 600;

/**
 * 현재 문서가 큰글씨 모드인지 판단합니다.
 */
export const isLargeDisplay = (): boolean =>
  typeof document !== "undefined" &&
  document.documentElement.dataset.display === "large";

/**
 * 현재 너비에 따라 모바일 또는 데스크톱 마진을 선택합니다.
 */
export const selectMargin = (
  width: number,
  mobile: ChartMargin,
  desktop: ChartMargin
): ChartMargin => (isMobileWidth(width) ? mobile : desktop);
