import { Grid } from "@mui/material";
import DashboardKpiCard from "./DashboardKpiCard";
import { GradeKeyToKorean } from "../../const/Common";
import type { DailyDataType } from "../../types/DailyData";

type DashboardKpiRowProps = {
  latestDaily: DailyDataType["latestDaily"];
  latestDate: string;
};

const DashboardKpiRow = ({ latestDaily, latestDate }: DashboardKpiRowProps) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 6, sm: 3 }}>
      <DashboardKpiCard
        title="총 판매량"
        content={`${latestDaily.totalQuantityTodayKg.toLocaleString()} kg`}
        caption={latestDate}
      />
    </Grid>
    <Grid size={{ xs: 6, sm: 3 }}>
      <DashboardKpiCard
        title="최다 거래 등급"
        content={
          GradeKeyToKorean[
            latestDaily.topGradeByQuantity
              .gradeKey as keyof typeof GradeKeyToKorean
          ] || latestDaily.topGradeByQuantity.gradeKey
        }
        caption={latestDate}
      />
    </Grid>
    <Grid size={{ xs: 6, sm: 3 }}>
      <DashboardKpiCard
        title="최대 거래 지역"
        content={latestDaily.topRegion.region}
        caption={latestDate}
      />
    </Grid>
    <Grid size={{ xs: 6, sm: 3 }}>
      <DashboardKpiCard
        title="최대 거래 조합"
        content={latestDaily.topUnion.union}
        caption={latestDate}
      />
    </Grid>
  </Grid>
);

export default DashboardKpiRow;
