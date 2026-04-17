export type LegendItem = {
  key: string;
  label: string;
  color: string;
};

/**
 * 범례 아이템을 최대 너비 기준으로 여러 행으로 나눕니다.
 */
export const groupLegendRows = (
  items: LegendItem[],
  maxWidth: number,
  estimatedItemWidth: number
): LegendItem[][] => {
  const itemsPerRow = Math.max(
    1,
    Math.floor(maxWidth / Math.max(estimatedItemWidth, 1))
  );

  const rows: LegendItem[][] = [];

  for (let index = 0; index < items.length; index += itemsPerRow) {
    rows.push(items.slice(index, index + itemsPerRow));
  }

  return rows;
};
