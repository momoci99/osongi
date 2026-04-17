import type { MushroomAuctionDataRaw } from "../../types/data";

/**
 * 산점도 데이터 타입
 */
export type ScatterDatum = {
  date: string;
  region: string;
  union: string;
  gradeKey: string;
  quantityKg: number;
  unitPriceWon: number;
};

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
 * 산점도 데이터로 변환한다.
 */
export const transformToScatterData = (
  data: MushroomAuctionDataRaw[],
  selectedGrades: string[]
): ScatterDatum[] => {
  const result: ScatterDatum[] = [];

  data.forEach((record) => {
    selectedGrades.forEach((gradeKey) => {
      const { quantity, unitPrice } = parseGradeData(record, gradeKey);
      if (quantity > 0 && unitPrice > 0 && record.date) {
        result.push({
          date: record.date,
          region: record.region,
          union: record.union,
          gradeKey,
          quantityKg: quantity,
          unitPriceWon: unitPrice,
        });
      }
    });
  });

  return result;
};
