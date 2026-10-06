import { Grid } from "@mui/material";
import DashboardKpiCard from "./DashboardKpiCard";
import type { ScopeKpi } from "../../utils/dashboardScope";

type DashboardKpiRowProps = {
  /** 고른 범위(전국·지역·조합)에 맞춘 카드 4장 */
  kpis: ScopeKpi[];
  latestDate: string;
};

const DashboardKpiRow = ({ kpis, latestDate }: DashboardKpiRowProps) => (
  <Grid
    container
    spacing={{ xs: 1, sm: 2 }}
    sx={{ mt: { xs: 1, sm: 0 }, alignItems: "stretch" }}
  >
    {kpis.map((kpi) => (
      <Grid key={kpi.title} size={{ xs: 6, sm: 3 }}>
        <DashboardKpiCard
          title={kpi.title}
          content={kpi.content}
          suffix={kpi.suffix}
          caption={latestDate}
        />
      </Grid>
    ))}
  </Grid>
);

export default DashboardKpiRow;
