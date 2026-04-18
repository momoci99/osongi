export type LegendItem = {
  key: string;
  label: string;
  color: string;
};

/**
 * 모바일에서는 범례 아이템 추정 너비를 더 작게 계산합니다.
 */
const getAdjustedItemWidth = (
  estimatedItemWidth: number,
  isMobile: boolean,
): number =>
  isMobile
    ? Math.max(72, Math.floor(estimatedItemWidth * 0.82))
    : estimatedItemWidth;

/**
 * 범례 아이템을 최대 너비 기준으로 여러 행으로 나눕니다.
 */
export const groupLegendRows = (
  items: LegendItem[],
  maxWidth: number,
  estimatedItemWidth: number,
  isMobile = false,
): LegendItem[][] => {
  const adjustedItemWidth = getAdjustedItemWidth(estimatedItemWidth, isMobile);
  const itemsPerRow = Math.max(
    1,
    Math.floor(maxWidth / Math.max(adjustedItemWidth, 1)),
  );

  const rows: LegendItem[][] = [];

  for (let index = 0; index < items.length; index += itemsPerRow) {
    rows.push(items.slice(index, index + itemsPerRow));
  }

  return rows;
};
