import { useEffect, useState } from "react";
import { DailyDataScheme, type DailyDataType } from "../types/DailyData";
import type { WeeklyManifest } from "../types/data";

type DashboardManifests = {
  dailyData: DailyDataType;
  weeklyData: WeeklyManifest;
};

type UseDashboardManifestsReturn = {
  data: DashboardManifests | null;
  isRefreshing: boolean;
  handleRefresh: () => void;
};

/** daily / weekly manifest fetch + 새로고침 */
const useDashboardManifests = (): UseDashboardManifestsReturn => {
  const [dailyData, setDailyData] = useState<DailyDataType | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyManifest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(
    function initDailyData() {
      fetch("/auction-stats/daily-manifest.json")
        .then((res) => res.json())
        .then((data) => {
          const parsed = DailyDataScheme.safeParse(data);
          if (parsed.success) {
            setDailyData(parsed.data);
          } else {
            console.error("Failed to parse daily data:", parsed.error);
          }
        })
        .catch((err) => console.error("Error fetching daily data:", err));
    },
    [refreshKey],
  );

  useEffect(
    function initWeeklyData() {
      fetch("/auction-stats/weekly-manifest.json")
        .then((res) => res.json())
        .then((data) => setWeeklyData(data))
        .catch((err) => console.error("Error fetching weekly data:", err))
        .finally(() => setIsRefreshing(false));
    },
    [refreshKey],
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  const data = dailyData && weeklyData ? { dailyData, weeklyData } : null;

  return { data, isRefreshing, handleRefresh };
};

export default useDashboardManifests;
