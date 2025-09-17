import PaymentIcon from "@mui/icons-material/Payment";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import { Card, Container, Grid, Typography, useTheme } from "@mui/material";
import DashboardInfoCard from "../components/DashboardInfoCard";
import { useEffect, useState } from "react";
import { DailyDataScheme, type DailyDataType } from "../types/DailyData";
import { GradeKeyToKorean } from "../const/Common";
import DashboardChartGradePerKg from "../components/DashboardChartGradePerKg";
import DashboardChartGradePerPrice from "../components/DashboardChartGradePerPrice";

const Dashboard = () => {
  const theme = useTheme();
  const [dailyData, setDailyData] = useState<DailyDataType | null>(null);

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

  if (dailyData === null) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Typography variant="h4">송이버섯 시세 대시보드</Typography>
      <Typography variant="body1">
        송이버섯 시세를 한눈에 확인할 수 있는 대시보드입니다.
      </Typography>

      {/* 주요 정보 섹션 */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardInfoCard
            title="총 판매량"
            content={`${dailyData.latestDaily.totalQuantityTodayKg.toLocaleString()} kg`}
            caption={dailyData.latestDate}
            icon={<WarehouseIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardInfoCard
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
          <DashboardInfoCard
            title="최대 거래 지역"
            content={dailyData.latestDaily.topRegion.region}
            caption={dailyData.latestDate}
            icon={<LocationOnIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardInfoCard
            title="최대 거래 조합"
            content={dailyData.latestDaily.topUnion.union}
            caption={dailyData.latestDate}
            icon={<LocationOnIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      {/* 메인 차트 1, 2 섹션 */}
      {/* @TODO : 차트 타이틀 달아주고 단위 추가해주기 */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Card
            variant={theme.palette.mode === "dark" ? "outlined" : "elevation"}
            elevation={theme.palette.mode === "dark" ? 0 : 1}
            sx={{
              borderRadius: 3,
              p: 2,
              width: "100%",
              backgroundImage: "none",
              backgroundColor: "transparent",
            }}
          >
            <DashboardChartGradePerKg
              data={dailyData.latestDaily.gradeBreakdown}
            />
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Card
            variant={theme.palette.mode === "dark" ? "outlined" : "elevation"}
            elevation={theme.palette.mode === "dark" ? 0 : 1}
            sx={{
              borderRadius: 3,
              p: 2,
              width: "100%",
              backgroundImage: "none",
              backgroundColor: "transparent",
            }}
          >
            <DashboardChartGradePerPrice
              data={dailyData.latestDaily.gradeBreakdown}
            />
          </Card>
        </Grid>
      </Grid>

      {/* 메인차트 3 */}
      <Grid container>
        <Card sx={{ width: "100%", p: 2, mt: 2 }}>차트 3</Card>
      </Grid>
    </Container>
  );
};
export default Dashboard;
