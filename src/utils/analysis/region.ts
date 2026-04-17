import type { MushroomAuctionDataRaw } from "../../types/data";

/**
 * 등급 데이터를 파싱한다.
 */
const parseGradeData = (
  record: MushroomAuctionDataRaw,
  gradeKey: string
): { quantity: number; unitPrice: number } => {
  const gradeData = record[gradeKey as keyof MushroomAuctionDataRaw] as {
    quantity: string;
    unitPrice: string;
  };

  if (!gradeData?.quantity || !gradeData?.unitPrice) {
    return { quantity: 0, unitPrice: 0 };
  }

  return {
    quantity: parseFloat(gradeData.quantity.replace(/,/g, "")) || 0,
    unitPrice: parseFloat(gradeData.unitPrice.replace(/,/g, "")) || 0,
  };
};

/**
 * 지역별 평균 가격을 계산한다.
 */
export const calculateRegionComparison = (
  data: MushroomAuctionDataRaw[],
  selectedGrades: string[]
): Array<{ region: string; avgPrice: number; totalQuantity: number }> => {
  const regionMap = new Map<string, { weightedPrice: number; quantity: number }>();

  data.forEach((record) => {
    selectedGrades.forEach((gradeKey) => {
      const { quantity, unitPrice } = parseGradeData(record, gradeKey);
      if (quantity > 0 && unitPrice > 0) {
        const existing = regionMap.get(record.region) || { weightedPrice: 0, quantity: 0 };
        existing.weightedPrice += unitPrice * quantity;
        existing.quantity += quantity;
        regionMap.set(record.region, existing);
      }
    });
  });

  return Array.from(regionMap.entries())
    .map(([region, { weightedPrice, quantity }]) => ({
      region,
      avgPrice: quantity > 0 ? Math.round(weightedPrice / quantity) : 0,
      totalQuantity: quantity,
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice);
};
