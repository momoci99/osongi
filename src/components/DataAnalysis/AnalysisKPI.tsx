import { Box, Grid, Paper, Typography, useTheme } from "@mui/material";
import type { AnalysisKPI as KPIType } from "../../utils/analysisUtils";
import { GradeKeyToKorean } from "../../const/Common";

interface AnalysisKPIProps {
  kpi: KPIType;
  comparison?: {
    changes: {
      avgPrice: number;
      totalQuantity: number;
      maxPrice: number;
      minPrice: number;
      tradingDays: number;
    };
  } | null;
  loading?: boolean;
}

function ChangeIndicator({
  value,
  inverted = false,
}: {
  value: number;
  inverted?: boolean;
}) {
  const theme = useTheme();
  if (value === 0) return null;

  const isPositive = inverted ? value < 0 : value > 0;
  const color = isPositive ? theme.palette.chart.up : theme.palette.chart.down;
  const arrow = value > 0 ? "\u25B2" : "\u25BC";

  return (
    <Typography
      variant="caption"
      sx={{
        color,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
        ml: 0.5,
      }}
    >
      {arrow} {Math.abs(value).toFixed(1)}%
    </Typography>
  );
}

function KPICard({
  title,
  value,
  sub,
  change,
}: {
  title: string;
  value: string;
  sub?: string;
  change?: number;
}) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "0.75rem",
        backgroundColor: theme.palette.background.paper,
        height: "100%",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 1px ${theme.palette.primary.main}20`,
        },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 500,
          display: "block",
          mb: 0.75,
          letterSpacing: "0.02em",
        }}
      >
        {title}
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
      {sub && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            mt: 0.5,
            fontSize: "0.75rem",
            lineHeight: 1.4,
          }}
        >
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

export default function AnalysisKPISection({
  kpi,
  comparison,
  loading,
}: AnalysisKPIProps) {
  if (loading) {
    return (
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[...Array(5)].map((_, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: "0.75rem",
                height: 88,
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 0.6 },
                  "50%": { opacity: 0.3 },
                },
              }}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  const gradeLabel = (key: string) =>
    GradeKeyToKorean[key as keyof typeof GradeKeyToKorean] || key;

  return (
    <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
      <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
        <KPICard
          title="평균 단가"
          value={`${kpi.avgPrice.toLocaleString()}원`}
          change={comparison?.changes.avgPrice}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
        <KPICard
          title="총 거래량"
          value={`${kpi.totalQuantity.toLocaleString()}kg`}
          change={comparison?.changes.totalQuantity}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
        <KPICard
          title="최고가"
          value={`${kpi.maxPrice.value.toLocaleString()}원`}
          sub={
            kpi.maxPrice.date
              ? `${kpi.maxPrice.date} ${gradeLabel(kpi.maxPrice.grade)}`
              : undefined
          }
          change={comparison?.changes.maxPrice}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
        <KPICard
          title="최저가"
          value={`${kpi.minPrice.value.toLocaleString()}원`}
          sub={
            kpi.minPrice.date
              ? `${kpi.minPrice.date} ${gradeLabel(kpi.minPrice.grade)}`
              : undefined
          }
          change={comparison?.changes.minPrice}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
        <KPICard
          title="거래일수"
          value={`${kpi.tradingDays}일`}
          change={comparison?.changes.tradingDays}
        />
      </Grid>
    </Grid>
  );
}
