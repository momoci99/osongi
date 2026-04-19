import type { MushroomAuctionDataRaw } from "../../types/data";

/**
 * KPI 계산 결과 타입
 */
export type AnalysisKPI = {
  avgPrice: number;
  totalQuantity: number;
  maxPrice: { value: number; date: string; grade: string };
  minPrice: { value: number; date: string; grade: string };
  tradingDays: number;
  medianPrice: number;
  priceStdDev: number;
  priceCV: number;
};

/**
 * KPI 변동률 타입
 */
export type KPIComparison = {
  current: AnalysisKPI;
  previous: AnalysisKPI;
  changes: {
    avgPrice: number;
    totalQuantity: number;
    maxPrice: number;
    minPrice: number;
    tradingDays: number;
    medianPrice: number;
    priceStdDev: number;
    priceCV: number;
  };
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
 * KPI를 계산한다.
 */
export const calculateKPI = (
  data: MushroomAuctionDataRaw[],
  selectedGrades: string[]
): AnalysisKPI => {
  let totalWeightedPrice = 0;
  let totalQuantity = 0;
  let maxPrice = { value: 0, date: "", grade: "" };
  let minPrice = { value: Infinity, date: "", grade: "" };
  const tradingDates = new Set<string>();
  const prices: number[] = [];

  data.forEach((record) => {
    selectedGrades.forEach((gradeKey) => {
      const { quantity, unitPrice } = parseGradeData(record, gradeKey);
      if (quantity > 0 && unitPrice > 0) {
        totalWeightedPrice += unitPrice * quantity;
        totalQuantity += quantity;
        prices.push(unitPrice);
        if (record.date) {
          tradingDates.add(record.date);
        }

        if (unitPrice > maxPrice.value) {
          maxPrice = { value: unitPrice, date: record.date || "", grade: gradeKey };
        }
        if (unitPrice < minPrice.value) {
          minPrice = { value: unitPrice, date: record.date || "", grade: gradeKey };
        }
      }
    });
  });

  if (minPrice.value === Infinity) {
    minPrice = { value: 0, date: "", grade: "" };
  }

  const avgPrice = totalQuantity > 0 ? Math.round(totalWeightedPrice / totalQuantity) : 0;
  const n = prices.length;
  let medianPrice = 0;
  let priceStdDev = 0;
  let priceCV = 0;

  if (n > 0) {
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    medianPrice = n % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
    const variance = prices.reduce((sum, p) => sum + (p - avgPrice) ** 2, 0) / n;
    priceStdDev = Math.round(Math.sqrt(variance));
    priceCV = avgPrice > 0 ? parseFloat(((priceStdDev / avgPrice) * 100).toFixed(1)) : 0;
  }

  return {
    avgPrice,
    totalQuantity,
    maxPrice,
    minPrice,
    tradingDays: tradingDates.size,
    medianPrice,
    priceStdDev,
    priceCV,
  };
};

/**
 * KPI 변동률을 계산한다.
 */
export const calculateKPIComparison = (
  current: AnalysisKPI,
  previous: AnalysisKPI
): KPIComparison => {
  const pctChange = (cur: number, prev: number) =>
    prev === 0 ? 0 : ((cur - prev) / prev) * 100;

  return {
    current,
    previous,
    changes: {
      avgPrice: pctChange(current.avgPrice, previous.avgPrice),
      totalQuantity: pctChange(current.totalQuantity, previous.totalQuantity),
      maxPrice: pctChange(current.maxPrice.value, previous.maxPrice.value),
      minPrice: pctChange(current.minPrice.value, previous.minPrice.value),
      tradingDays: pctChange(current.tradingDays, previous.tradingDays),
      medianPrice: pctChange(current.medianPrice, previous.medianPrice),
      priceStdDev: pctChange(current.priceStdDev, previous.priceStdDev),
      priceCV: pctChange(current.priceCV, previous.priceCV),
    },
  };
};
