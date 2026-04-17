import { Box, Container, Grid, Skeleton } from "@mui/material";
import { useSettingsStore } from "../stores/useSettingsStore";
import useDashboardManifests from "../hooks/useDashboardManifests";
import isInSeason from "../utils/isInSeason";
import DashboardHeader from "../components/Dashboard/DashboardHeader";
import RegionBreakdownTable from "../components/Dashboard/RegionBreakdownTable";
import DashboardKpiRow from "../components/Dashboard/DashboardKpiRow";
import DashboardCharts from "../components/Dashboard/DashboardCharts";
import SeasonOffDashboard from "../components/Dashboard/SeasonOffDashboard";

const Dashboard = () => {
  const myRegion = useSettingsStore((s) => s.myRegion);
  const { data, isRefreshing, handleRefresh } = useDashboardManifests();

  if (!data) {
    return (
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  const { dailyData, weeklyData } = data;
  const { latestDaily, latestDate } = dailyData;
  const inSeason = isInSeason(latestDate);

  if (!inSeason) {
    return (
      <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
        <DashboardHeader
          latestDate={latestDate}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          inSeason={false}
        />
        <SeasonOffDashboard myRegion={myRegion} />
      </Container>
    );
  }

  const regionData = myRegion
    ? latestDaily.regionGradeBreakdown?.[myRegion]
    : null;

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <DashboardHeader
          latestDate={latestDate}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          inSeason={true}
        />
        {myRegion && regionData && (
          <RegionBreakdownTable
            myRegion={myRegion}
            regionData={regionData}
            dayComparison={latestDaily.previousDayComparison}
          />
        )}
      </Box>

      <DashboardKpiRow latestDaily={latestDaily} latestDate={latestDate} />

      <DashboardCharts
        gradeBreakdown={latestDaily.gradeBreakdown}
        weeklyData={weeklyData.weeklyData}
        latestDate={latestDate}
      />
    </Container>
  );
};

export default Dashboard;
