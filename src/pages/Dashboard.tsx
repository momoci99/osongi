import { Box, Container, Grid, Skeleton } from "@mui/material";
import { useSettingsStore } from "../stores/useSettingsStore";
import useDashboardManifests from "../hooks/useDashboardManifests";
import usePageMeta from "../hooks/usePageMeta";
import { PAGE_META } from "../const/Seo";
import isInSeason from "../utils/isInSeason";
import { resolveDashboardScope, tradedUnionsOf } from "../utils/dashboardScope";
import DashboardHeader from "../components/Dashboard/DashboardHeader";
import RegionBreakdownTable from "../components/Dashboard/RegionBreakdownTable";
import DashboardKpiRow from "../components/Dashboard/DashboardKpiRow";
import DashboardCharts from "../components/Dashboard/DashboardCharts";
import SeasonOffDashboard from "../components/Dashboard/SeasonOffDashboard";

const Dashboard = () => {
  usePageMeta(PAGE_META.dashboard);

  const myRegion = useSettingsStore((s) => s.myRegion);
  const myUnion = useSettingsStore((s) => s.myUnion);
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

  const scope = resolveDashboardScope({
    latestDaily,
    latestDate,
    weekly: weeklyData,
    myRegion,
    myUnion,
  });

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <DashboardHeader
          latestDate={latestDate}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          inSeason={true}
          tradedUnions={tradedUnionsOf(latestDaily)}
        />
        <RegionBreakdownTable
          scopeLabel={scope.label}
          latestDate={latestDate}
          regionData={scope.gradeRows}
          dayComparison={scope.dayComparison}
        />
      </Box>

      <DashboardKpiRow kpis={scope.kpis} latestDate={latestDate} />

      <DashboardCharts
        scopeLabel={scope.label}
        gradeBreakdown={scope.gradeRows}
        weeklyData={scope.weekly}
        latestDate={latestDate}
      />
    </Container>
  );
};

export default Dashboard;
