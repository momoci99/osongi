import PaymentIcon from "@mui/icons-material/Payment";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import { Card, Container, Grid, Typography } from "@mui/material";
import DashboardInfoCard from "../components/DashboardInfoCard";
import { useEffect, useState } from "react";
import { DailyDataScheme, type DailyDataType } from "../types/DailyData";

const Dashboard = () => {
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
            title="평균 거래가"
            content="15,200원/kg"
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
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Card sx={{ width: "100%", p: 2 }}>차트 1</Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Card sx={{ width: "100%", p: 2 }}>차트 2</Card>
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
