import { Box, Grid, Typography } from "@mui/material";
import { DASHBOARD_CHART_EMPTY } from "../../const/Common";
import DashboardCard from "./DashboardCard";
import DashboardChartGradePerKg from "./DashboardChartGradePerKg";
import DashboardChartGradePerPrice from "./DashboardChartGradePerPrice";
import DashboardChartWeeklyToggle from "./DashboardChartWeeklyToggle";
import type { DailyDataType } from "../../types/DailyData";
import type { WeeklyPriceDatum } from "../../types/data";

type DashboardChartsProps = {
  /** 제목 앞에 붙는 범위 이름 (예: "전국", "경북", "봉화 조합") */
  scopeLabel: string;
  gradeBreakdown: DailyDataType["latestDaily"]["gradeBreakdown"];
  weeklyData: WeeklyPriceDatum[];
  latestDate: string;
};

type ChartEmptyStateProps = { message: string };

/** 고른 범위에 거래가 없을 때 빈 축 대신 보여주는 안내 */
const ChartEmptyState = ({ message }: ChartEmptyStateProps) => (
  <Box
    sx={{
      minHeight: DASHBOARD_CHART_EMPTY.MIN_HEIGHT,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {message}
    </Typography>
  </Box>
);

const DashboardCharts = ({
  scopeLabel,
  gradeBreakdown,
  weeklyData,
  latestDate,
}: DashboardChartsProps) => {
  const hasToday = gradeBreakdown.length > 0;
  const noTradeMessage = `${scopeLabel}의 최신 공판일 거래가 없습니다.`;

  return (
    <>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCard>
            <Typography variant="subtitle1">
              {scopeLabel} 등급별 수량(kg) — {latestDate}
            </Typography>
            {hasToday ? (
              <DashboardChartGradePerKg data={gradeBreakdown} />
            ) : (
              <ChartEmptyState message={noTradeMessage} />
            )}
          </DashboardCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCard>
            <Typography variant="subtitle1">
              {scopeLabel} 등급별 가격(원) — {latestDate}
            </Typography>
            {hasToday ? (
              <DashboardChartGradePerPrice data={gradeBreakdown} />
            ) : (
              <ChartEmptyState message={noTradeMessage} />
            )}
          </DashboardCard>
        </Grid>
      </Grid>

      <Grid container sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <DashboardCard>
            <Typography variant="subtitle1">
              {scopeLabel} 7일간 등급별 가격·수량 변동
            </Typography>
            {weeklyData.length > 0 ? (
              <DashboardChartWeeklyToggle data={weeklyData} />
            ) : (
              <ChartEmptyState
                message={`${scopeLabel}의 최근 7일 거래가 없습니다.`}
              />
            )}
          </DashboardCard>
        </Grid>
      </Grid>
    </>
  );
};

export default DashboardCharts;
