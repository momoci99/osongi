import type { WeeklyPriceDatum } from "../../types/data";
import type { DayComparison } from "./types";

/** 비율을 소수 둘째 자리까지 반올림할 때 쓰는 배수 */
const PERCENT_ROUNDING = 100;

/**
 * 7일 추이에서 최신 공판일과 그 직전 거래일의 등급별 단가를 비교한다.
 * 거래가 없던 날(휴장)은 행이 없으므로 자연스럽게 건너뛴다.
 * 두 날 모두 거래된 등급만 비교하고, 비교할 날이 없으면 null.
 */
const dayOverDay = (
  weekly: WeeklyPriceDatum[],
  latestDate: string,
): DayComparison => {
  const previousDate = weekly
    .map((row) => row.date)
    .filter((date) => date < latestDate)
    .sort()
    .at(-1);
  if (!previousDate) return null;

  const previousPrices = new Map(
    weekly
      .filter((row) => row.date === previousDate)
      .map((row) => [row.gradeKey, row.unitPriceWon]),
  );

  const gradeChanges = weekly
    .filter((row) => row.date === latestDate)
    .flatMap((row) => {
      const previousPrice = previousPrices.get(row.gradeKey);
      if (!previousPrice) return [];
      const changePercent =
        Math.round(
          ((row.unitPriceWon - previousPrice) / previousPrice) *
            100 *
            PERCENT_ROUNDING,
        ) / PERCENT_ROUNDING;
      return [
        {
          gradeKey: row.gradeKey,
          currentPrice: row.unitPriceWon,
          previousPrice,
          changePercent,
        },
      ];
    });

  return gradeChanges.length > 0 ? { previousDate, gradeChanges } : null;
};

export default dayOverDay;
