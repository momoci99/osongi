import { Box, Grid, Typography, useTheme } from "@mui/material";
import DashboardCard from "../DashboardCard";
import type {
  SeasonSummary,
  RegionSeasonSummary,
} from "../../../types/seasonOff";

type SeasonSummaryCardsProps = {
  summary: SeasonSummary;
  regionSeason: RegionSeasonSummary | null;
  myRegion?: string | null;
};

/** 직전 시즌 요약 카드 4장 */
const SeasonSummaryCards = ({
  summary,
  regionSeason,
  myRegion,
}: SeasonSummaryCardsProps) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5 }}
      >
        {myRegion ? `${myRegion} ` : ""}
        {summary.year}년 시즌 요약
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <DashboardCard>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              총 거래량
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {(
                (regionSeason?.totalQuantityKg ?? summary.totalQuantityKg) /
                1000
              ).toFixed(1)}
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 0.5, color: theme.palette.text.secondary }}
              >
                톤
              </Typography>
            </Typography>
          </DashboardCard>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <DashboardCard>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              총 거래금액
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {(
                (regionSeason?.totalAmountWon ?? summary.totalAmountWon) /
                100_000_000
              ).toFixed(1)}
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 0.5, color: theme.palette.text.secondary }}
              >
                억원
              </Typography>
            </Typography>
          </DashboardCard>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <DashboardCard>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              최고가
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {summary.highestPrice
                ? summary.highestPrice.price.toLocaleString()
                : "—"}
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 0.5, color: theme.palette.text.secondary }}
              >
                원/kg
              </Typography>
            </Typography>
          </DashboardCard>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <DashboardCard>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              최저가
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {summary.lowestPrice
                ? summary.lowestPrice.price.toLocaleString()
                : "—"}
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 0.5, color: theme.palette.text.secondary }}
              >
                원/kg
              </Typography>
            </Typography>
          </DashboardCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeasonSummaryCards;
