import { useEffect, useState } from "react";
import type { SeasonManifest, YearlyManifest } from "../types/seasonOff";

type YearlyChartEntry = {
  year: number;
  totalQuantityKg: number;
  totalAmountWon: number;
};

type SeasonOffData = {
  seasonData: SeasonManifest;
  yearlyData: YearlyManifest;
  yearlyEntries: YearlyChartEntry[];
};

/** 시즌오프 대시보드에 필요한 매니페스트를 fetch하여 반환 */
const useSeasonOffData = (myRegion?: string | null) => {
  const [data, setData] = useState<SeasonOffData | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/auction-stats/season-manifest.json").then((res) => res.json()),
      fetch("/auction-stats/yearly-manifest.json").then((res) => res.json()),
    ])
      .then(([season, yearly]: [SeasonManifest, YearlyManifest]) => {
        if (cancelled) return;
        setData({ seasonData: season, yearlyData: yearly, yearlyEntries: [] });
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  const { seasonData, yearlyData } = data;

  /** 지역 선택에 따라 연간 데이터를 계산 */
  const yearlyEntries: YearlyChartEntry[] =
    myRegion && yearlyData.regionYearly?.[myRegion]
      ? Object.entries(yearlyData.regionYearly[myRegion])
          .map(([year, d]) => ({
            year: parseInt(year, 10),
            totalQuantityKg: d.totalQuantityKg,
            totalAmountWon: d.totalAmountWon,
          }))
          .sort((a, b) => a.year - b.year)
      : Object.entries(yearlyData.yearly)
          .map(([year, d]) => ({
            year: parseInt(year, 10),
            totalQuantityKg: d.totalQuantityKg,
            totalAmountWon: d.totalAmountWon,
          }))
          .sort((a, b) => a.year - b.year);

  return { seasonData, yearlyData, yearlyEntries };
};

export default useSeasonOffData;
export type { YearlyChartEntry };
