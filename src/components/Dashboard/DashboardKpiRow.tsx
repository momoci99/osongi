import { Grid } from "@mui/material";
import DashboardKpiCard from "./DashboardKpiCard";
import { GradeKeyToKorean } from "../../const/Common";
import type { DailyDataType } from "../../types/DailyData";
import splitGradeLabel from "../../utils/splitGradeLabel";

type DashboardKpiRowProps = {
  latestDaily: DailyDataType["latestDaily"];
  latestDate: string;
};

/** 최다 거래 등급을 KPI 값(본 등급)과 보조 표기(세부 구분)로 나눈다 */
const topGradeParts = (gradeKey: string) =>
  splitGradeLabel(
    GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey,
  );

const DashboardKpiRow = ({ latestDaily, latestDate }: DashboardKpiRowProps) => {
  const topGrade = topGradeParts(latestDaily.topGradeByQuantity.gradeKey);

  return (
    <Grid
      container
      spacing={{ xs: 1, sm: 2 }}
      sx={{ mt: { xs: 1, sm: 0 }, alignItems: "stretch" }}
    >
      <Grid size={{ xs: 6, sm: 3 }}>
        <DashboardKpiCard
          title="총 판매량"
          content={latestDaily.totalQuantityTodayKg.toLocaleString("ko-KR")}
          suffix="kg"
          caption={latestDate}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <DashboardKpiCard
          title="최다 거래 등급"
          content={topGrade.main}
          suffix={topGrade.qualifier ?? undefined}
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
};

export default DashboardKpiRow;
