import type { WeeklyPriceDatum } from "../../types/data";

export type DistributionBin = {
  x0: number;
  x1: number;
  count: number;
  gradeKey: string;
};

/**
 * Sturges' rule로 bin 수를 결정하고 등급별 가격 분포를 계산한다.
 * 모든 등급이 동일한 bin 경계를 공유하여 스택 히스토그램에 적합한 형태로 반환한다.
 */
export const calculatePriceDistribution = (
  data: WeeklyPriceDatum[],
  binCount?: number
): DistributionBin[] => {
  const validData = data.filter((d) => d.unitPriceWon > 0 && d.quantityKg > 0);
  if (validData.length === 0) return [];

  const n = validData.length;
  const numBins = binCount ?? Math.ceil(1 + 3.322 * Math.log10(n));

  const prices = validData.map((d) => d.unitPriceWon);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) return [];

  const step = (maxPrice - minPrice) / numBins;
  const thresholds = Array.from({ length: numBins + 1 }, (_, i) => minPrice + i * step);

  const gradeKeys = [...new Set(validData.map((d) => d.gradeKey))];
  const result: DistributionBin[] = [];

  for (const gradeKey of gradeKeys) {
    const gradeData = validData.filter((d) => d.gradeKey === gradeKey);

    for (let i = 0; i < numBins; i++) {
      const x0 = thresholds[i];
      const x1 = thresholds[i + 1];
      const isLast = i === numBins - 1;

      const count = gradeData.filter((d) =>
        isLast
          ? d.unitPriceWon >= x0 && d.unitPriceWon <= x1
          : d.unitPriceWon >= x0 && d.unitPriceWon < x1
      ).length;

      result.push({ x0, x1, count, gradeKey });
    }
  }

  return result;
};
