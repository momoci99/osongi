import type { MushroomAuctionDataRaw, WeeklyPriceDatum } from "../../types/data";
import type { AuctionRecord } from "../database";
import { PARSING } from "../../const/Numbers";

/**
 * AuctionRecord를 MushroomAuctionDataRaw 형태로 변환한다.
 */
export const convertAuctionRecordToRaw = (
  record: AuctionRecord
): MushroomAuctionDataRaw => {
  return {
    region: record.region,
    union: record.union,
    date: record.date,
    lastUpdated: record.lastUpdated,
    auctionQuantity: {
      untilYesterday: record.auctionQuantityUntilYesterday.toString(),
      today: record.auctionQuantityToday.toString(),
      total: record.auctionQuantityTotal.toString(),
    },
    auctionAmount: {
      untilYesterday: record.auctionAmountUntilYesterday.toString(),
      today: record.auctionAmountToday.toString(),
      total: record.auctionAmountTotal.toString(),
    },
    grade1: {
      quantity: record.grade1Quantity.toString(),
      unitPrice: record.grade1UnitPrice.toString(),
    },
    grade2: {
      quantity: record.grade2Quantity.toString(),
      unitPrice: record.grade2UnitPrice.toString(),
    },
    grade3Stopped: {
      quantity: record.grade3StoppedQuantity.toString(),
      unitPrice: record.grade3StoppedUnitPrice.toString(),
    },
    grade3Estimated: {
      quantity: record.grade3EstimatedQuantity.toString(),
      unitPrice: record.grade3EstimatedUnitPrice.toString(),
    },
    gradeBelow: {
      quantity: record.gradeBelowQuantity.toString(),
      unitPrice: record.gradeBelowUnitPrice.toString(),
    },
    mixedGrade: {
      quantity: record.mixedGradeQuantity.toString(),
      unitPrice: record.mixedGradeUnitPrice.toString(),
    },
  };
};

/**
 * 차트 데이터로 변환한다.
 */
export const transformToChartData = (
  data: MushroomAuctionDataRaw[],
  selectedGrades: string[]
): WeeklyPriceDatum[] => {
  const grouped = new Map<string, MushroomAuctionDataRaw>();

  data.forEach((record) => {
    const key = `${record.date}-${record.region}-${record.union}`;
    grouped.set(key, record);
  });

  const chartData: WeeklyPriceDatum[] = [];

  grouped.forEach((record) => {
    selectedGrades.forEach((gradeKey) => {
      const gradeData = record[gradeKey as keyof MushroomAuctionDataRaw] as {
        quantity: string;
        unitPrice: string;
      };

      if (gradeData && gradeData.quantity && gradeData.unitPrice) {
        const quantity = parseFloat(gradeData.quantity.replace(/,/g, "")) || 0;
        const unitPrice = parseFloat(gradeData.unitPrice.replace(/,/g, "")) || 0;

        if (
          quantity > PARSING.MIN_VALID_VALUE &&
          unitPrice > PARSING.MIN_VALID_VALUE &&
          record.date
        ) {
          chartData.push({
            date: record.date,
            region: record.region,
            union: record.union,
            gradeKey,
            quantityKg: quantity,
            unitPriceWon: unitPrice,
          });
        }
      }
    });
  });

  return chartData.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};
