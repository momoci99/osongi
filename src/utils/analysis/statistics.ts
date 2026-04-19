import type { WeeklyPriceDatum } from "../../types/data";

export type MovingAverageDatum = {
  date: string;
  gradeKey: string;
  region: string;
  ma7: number | null;
  ma14: number | null;
};

/**
 * 등급+지역별 단순이동평균(SMA)을 계산한다.
 * windows 배열의 각 값은 직전 N개 데이터 포인트 기준이다.
 */
export const calculateMovingAverages = (
  data: WeeklyPriceDatum[],
  windows: number[] = [7, 14]
): MovingAverageDatum[] => {
  const groups = new Map<string, WeeklyPriceDatum[]>();

  data.forEach((d) => {
    if (!d.gradeKey || !d.region) return;
    const key = `${d.gradeKey}-${d.region}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  });

  const result: MovingAverageDatum[] = [];

  groups.forEach((groupData) => {
    const sorted = [...groupData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((d, i) => {
      const sma = (window: number): number | null => {
        if (i < window - 1) return null;
        const slice = sorted.slice(i - window + 1, i + 1);
        const sum = slice.reduce((acc, x) => acc + x.unitPriceWon, 0);
        return Math.round(sum / window);
      };

      result.push({
        date: d.date,
        gradeKey: d.gradeKey,
        region: d.region!,
        ma7: windows.includes(7) ? sma(7) : null,
        ma14: windows.includes(14) ? sma(14) : null,
      });
    });
  });

  return result;
};
