import PaymentIcon from "@mui/icons-material/Payment";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import { Box, Container, Grid, Typography } from "@mui/material";
import DashboardKpiCard from "../components/DashboardKpiCard";
import { useEffect, useState } from "react";
import { DailyDataScheme, type DailyDataType } from "../types/DailyData";
import { GradeKeyToKorean } from "../const/Common";
import DashboardChartGradePerKg from "../components/DashboardChartGradePerKg";
import DashboardChartGradePerPrice from "../components/DashboardChartGradePerPrice";
import DashboardChartWeeklyToggle from "../components/DashboardChartWeeklyToggle";
import DashboardCard from "../components/DashboardCard";
import type { WeeklyManifest } from "../types/data";

const Dashboard = () => {
  const [dailyData, setDailyData] = useState<DailyDataType | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyManifest | null>(null);

  useEffect(function initDailyData() {
    const result = fetch("/auction-stats/daily-manifest.json");
    result
      .then((res) => res.json())
      .then((data) => {
        const parsed = DailyDataScheme.safeParse(data);
        if (parsed.success) {
          setDailyData(parsed.data);
        } else {
          console.error("Failed to parse daily data:", parsed.error);
        }
      })
      .catch((err) => {
        console.error("Error fetching daily data:", err);
      });
  }, []);

  useEffect(function initWeeklyData() {
    const result = fetch("/auction-stats/weekly-manifest.json");
    result
      .then((res) => res.json())
      .then((data) => {
        setWeeklyData(data);
      })
      .catch((err) => {
        console.error("Error fetching weekly data:", err);
      });
  }, []);

  if (dailyData === null || weeklyData === null) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Box sx={{ pt: 2, pb: 2 }}>
        <Typography variant="h4">송이버섯 시세 대시보드</Typography>
        <Typography variant="body1">
          송이버섯 시세를 한눈에 확인할 수 있는 대시보드입니다.
        </Typography>
      </Box>

      {/* 주요 정보 섹션 */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardKpiCard
            title="총 판매량"
            content={`${dailyData.latestDaily.totalQuantityTodayKg.toLocaleString()} kg`}
            caption={dailyData.latestDate}
            icon={<WarehouseIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardKpiCard
            title="거래량이 가장 많은 등급"
            content={`${
              GradeKeyToKorean[
                dailyData.latestDaily.topGradeByQuantity
                  .gradeKey as keyof typeof GradeKeyToKorean
              ]
            } `}
            caption={dailyData.latestDate}
            icon={<PaymentIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardKpiCard
            title="최대 거래 지역"
            content={dailyData.latestDaily.topRegion.region}
            caption={dailyData.latestDate}
            icon={<LocationOnIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardKpiCard
            title="최대 거래 조합"
            content={dailyData.latestDaily.topUnion.union}
            caption={dailyData.latestDate}
            icon={<LocationOnIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <DashboardCard>
            <Typography variant="subtitle1">
              등급별 수량(Kg) - {dailyData.latestDate}
            </Typography>
            <DashboardChartGradePerKg
              data={dailyData.latestDaily.gradeBreakdown}
            />
          </DashboardCard>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <DashboardCard>
            <Typography variant="subtitle1">
              등급별 가격(원) - {dailyData.latestDate}
            </Typography>
            <DashboardChartGradePerPrice
              data={dailyData.latestDaily.gradeBreakdown}
            />
          </DashboardCard>
        </Grid>
      </Grid>

      <Grid container sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <DashboardCard>
            <Typography variant="subtitle1">
              7일간 등급별 가격·수량 변동
            </Typography>
            <DashboardChartWeeklyToggle data={weeklyData.weeklyData} />
          </DashboardCard>
        </Grid>
      </Grid>
    </Container>
  );
};
export default Dashboard;
