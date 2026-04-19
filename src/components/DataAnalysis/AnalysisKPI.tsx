import { Box, Grid, Paper, Typography, useTheme } from "@mui/material";
import type { AnalysisKPI as KPIType } from "../../utils/analysisUtils";
import { GradeKeyToKorean } from "../../const/Common";

type AnalysisKPIProps = {
  kpi: KPIType;
  comparison?: {
    changes: {
      avgPrice: number;
      totalQuantity: number;
      maxPrice: number;
      minPrice: number;
      tradingDays: number;
      medianPrice: number;
      priceStdDev: number;
      priceCV: number;
    };
  } | null;
  loading?: boolean;
};

export const ChangeIndicator = ({
  value,
  inverted = false,
}: {
  value: number;
  inverted?: boolean;
}) => {
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
};

const KPICard = ({
  title,
  description,
  value,
  sub,
  change,
}: {
  title: string;
  description?: string;
  value: string;
  sub?: string;
  change?: number;
}) => {
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
        sx={{ fontWeight: 500, display: "block", mb: 0.5, letterSpacing: "0.02em" }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          sx={{
            fontSize: "0.68rem",
            color: "text.disabled",
            display: "block",
            mb: 0.75,
            lineHeight: 1.3,
          }}
        >
          {description}
        </Typography>
      )}
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
          sx={{ display: "block", mt: 0.5, fontSize: "0.75rem", lineHeight: 1.4 }}
        >
          {sub}
        </Typography>
      )}
    </Paper>
  );
};

const skeletonSx = {
  p: 2,
  borderRadius: "0.75rem",
  height: 88,
  animation: "pulse 1.5s ease-in-out infinite",
  "@keyframes pulse": {
    "0%, 100%": { opacity: 0.6 },
    "50%": { opacity: 0.3 },
  },
};

const AnalysisKPISection = ({
  kpi,
  comparison,
  loading,
}: AnalysisKPIProps) => {
  if (loading) {
    return (
      <Box sx={{ mb: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Grid container spacing={1.5}>
          {[...Array(5)].map((_, i) => (
            <Grid key={i} size={{ xs: 6, sm: 4, md: 2.4 }}>
              <Paper variant="outlined" sx={skeletonSx} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={1.5}>
          {[...Array(3)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 4, md: 4 }}>
              <Paper variant="outlined" sx={skeletonSx} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const gradeLabel = (key: string) =>
    GradeKeyToKorean[key as keyof typeof GradeKeyToKorean] || key;

  return (
    <Box sx={{ mb: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KPICard
            title="평균 단가"
            description="거래량 가중 평균 단가 (원/kg)"
            value={`${kpi.avgPrice.toLocaleString()}원`}
            change={comparison?.changes.avgPrice}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KPICard
            title="총 거래량"
            description="선택 기간 내 전체 거래량 합계"
            value={`${kpi.totalQuantity.toLocaleString()}kg`}
            change={comparison?.changes.totalQuantity}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KPICard
            title="최고가"
            description="기간 내 단일 거래 최고 단가"
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
            description="기간 내 단일 거래 최저 단가"
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
            description="실제 경매가 진행된 날수"
            value={`${kpi.tradingDays}일`}
            change={comparison?.changes.tradingDays}
          />
        </Grid>
      </Grid>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <KPICard
            title="중앙값"
            description="가격을 크기순 정렬했을 때 중간에 위치한 값. 극단값 영향을 덜 받아 실질 시세를 반영"
            value={`${kpi.medianPrice.toLocaleString()}원`}
            change={comparison?.changes.medianPrice}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <KPICard
            title="가격 표준편차"
            description="가격이 평균에서 얼마나 분산되어 있는지를 나타냄. 클수록 가격 변동이 심함"
            value={`${kpi.priceStdDev.toLocaleString()}원`}
            change={comparison?.changes.priceStdDev}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <KPICard
            title="변동계수(CV)"
            description="표준편차 ÷ 평균 × 100. 평균 대비 변동성 비율로, 클수록 가격이 불안정"
            value={`${kpi.priceCV.toFixed(1)}%`}
            change={comparison?.changes.priceCV}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalysisKPISection;
