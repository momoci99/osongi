import { LARGE_DISPLAY_FONT_SCALE } from "../../const/Charts";

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

/**
 * 큰글씨 모드에서 차트 글자를 키운다.
 * SVG 텍스트는 px로 그려 rem 확대를 따라가지 못하므로 그릴 때 직접 배율을 건다.
 */
export const scaleFont = (size: number): number =>
  isLargeDisplay() ? Math.round(size * LARGE_DISPLAY_FONT_SCALE) : size;

/**
 * 큰글씨 모드에서 축 라벨이 커진 만큼 라벨이 놓이는 여백을 넓힌다.
 * 위·오른쪽은 라벨이 없으므로 그대로 둔다.
 */
export const scaleMargin = (margin: ChartMargin): ChartMargin =>
  isLargeDisplay()
    ? {
        ...margin,
        left: Math.round(margin.left * LARGE_DISPLAY_FONT_SCALE),
        bottom: Math.round(margin.bottom * LARGE_DISPLAY_FONT_SCALE),
      }
    : margin;

/** 큰글씨 모드에서 글자 폭에 맞춰 늘려야 하는 길이 (라벨 열 폭 등) */
export const scaleLength = (length: number): number =>
  isLargeDisplay() ? Math.round(length * LARGE_DISPLAY_FONT_SCALE) : length;
