import type { MushroomAuctionDataRaw } from "../../types/data";

/**
 * 등급별 비중 타입
 */
export type GradeBreakdown = {
  gradeKey: string;
  quantity: number;
  amount: number;
  quantityRatio: number;
  amountRatio: number;
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
 * 등급별 비중을 계산한다.
 */
export const calculateGradeBreakdown = (
  data: MushroomAuctionDataRaw[],
  selectedGrades: string[]
): GradeBreakdown[] => {
  const gradeMap = new Map<string, { quantity: number; amount: number }>();

  data.forEach((record) => {
    selectedGrades.forEach((gradeKey) => {
      const { quantity, unitPrice } = parseGradeData(record, gradeKey);
      if (quantity > 0) {
        const existing = gradeMap.get(gradeKey) || { quantity: 0, amount: 0 };
        existing.quantity += quantity;
        existing.amount += quantity * unitPrice;
        gradeMap.set(gradeKey, existing);
      }
    });
  });

  const totalQuantity = Array.from(gradeMap.values()).reduce((s, v) => s + v.quantity, 0);
  const totalAmount = Array.from(gradeMap.values()).reduce((s, v) => s + v.amount, 0);

  return selectedGrades
    .filter((key) => gradeMap.has(key))
    .map((gradeKey) => {
      const { quantity, amount } = gradeMap.get(gradeKey)!;
      return {
        gradeKey,
        quantity,
        amount,
        quantityRatio: totalQuantity > 0 ? quantity / totalQuantity : 0,
        amountRatio: totalAmount > 0 ? amount / totalAmount : 0,
      };
    });
};
