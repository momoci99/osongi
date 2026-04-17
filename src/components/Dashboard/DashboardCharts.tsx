import { Grid, Typography } from "@mui/material";
import DashboardCard from "./DashboardCard";
import DashboardChartGradePerKg from "./DashboardChartGradePerKg";
import DashboardChartGradePerPrice from "./DashboardChartGradePerPrice";
import DashboardChartWeeklyToggle from "./DashboardChartWeeklyToggle";
import type { DailyDataType } from "../../types/DailyData";
import type { WeeklyPriceDatum } from "../../types/data";

type DashboardChartsProps = {
  gradeBreakdown: DailyDataType["latestDaily"]["gradeBreakdown"];
  weeklyData: WeeklyPriceDatum[];
  latestDate: string;
};

const DashboardCharts = ({
  gradeBreakdown,
  weeklyData,
  latestDate,
}: DashboardChartsProps) => (
  <>
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <DashboardCard>
          <Typography variant="subtitle1">
            등급별 수량(Kg) — {latestDate}
          </Typography>
          <DashboardChartGradePerKg data={gradeBreakdown} />
        </DashboardCard>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DashboardCard>
          <Typography variant="subtitle1">
            등급별 가격(원) — {latestDate}
          </Typography>
          <DashboardChartGradePerPrice data={gradeBreakdown} />
        </DashboardCard>
      </Grid>
    </Grid>

    <Grid container sx={{ mt: 2 }}>
      <Grid size={{ xs: 12 }}>
        <DashboardCard>
          <Typography variant="subtitle1">
            7일간 등급별 가격·수량 변동
          </Typography>
          <DashboardChartWeeklyToggle data={weeklyData} />
        </DashboardCard>
      </Grid>
    </Grid>
  </>
);

export default DashboardCharts;
