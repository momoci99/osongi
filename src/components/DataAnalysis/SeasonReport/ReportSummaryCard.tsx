import { Box, Grid, Paper, Typography } from "@mui/material";
import { ChangeIndicator } from "../AnalysisKPI";

type ReportSummaryCardProps = {
  summary: {
    totalTradingDays: number;
    totalQuantityKg: number;
    totalAmountWon: number;
    avgPricePerKg: number;
  };
  yoyComparison: {
    avgPriceChange: number;
    quantityChange: number;
    tradingDaysChange: number;
  } | null;
};

type SummaryMetricCardProps = {
  label: string;
  value: string;
  change?: number;
};

/** 시즌 리포트 핵심 지표를 카드 형태로 요약해 보여주는 컴포넌트 */
const SummaryMetricCard = ({
  label,
  value,
  change,
}: SummaryMetricCardProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "0.75rem",
        height: "100%",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.75, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "baseline" }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </Typography>
        {change !== undefined && <ChangeIndicator value={change} />}
      </Box>
    </Paper>
  );
};

/** 시즌 리포트 요약 지표 3개를 반응형 그리드로 렌더링하는 컴포넌트 */
const ReportSummaryCard = ({
  summary,
  yoyComparison,
}: ReportSummaryCardProps) => {
  return (
    <Grid container spacing={1.5}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SummaryMetricCard
          label="총 거래일수"
          value={`${summary.totalTradingDays}일`}
          change={yoyComparison?.tradingDaysChange}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SummaryMetricCard
          label="총 거래량"
          value={`${summary.totalQuantityKg.toLocaleString()}kg`}
          change={yoyComparison?.quantityChange}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SummaryMetricCard
          label="평균 단가"
          value={`${Math.round(summary.avgPricePerKg).toLocaleString()}원`}
          change={yoyComparison?.avgPriceChange}
        />
      </Grid>
    </Grid>
  );
};

export default ReportSummaryCard;
