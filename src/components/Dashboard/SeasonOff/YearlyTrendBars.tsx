import { Box, Typography, useTheme } from "@mui/material";
import DashboardCard from "../DashboardCard";
import type { YearlyChartEntry } from "../../../hooks/useSeasonOffData";

type YearlyTrendBarsProps = {
  yearlyEntries: YearlyChartEntry[];
  yearlyLabel: string;
};

/** 연간 거래량 추이 수평 바 차트 */
const YearlyTrendBars = ({
  yearlyEntries,
  yearlyLabel,
}: YearlyTrendBarsProps) => {
  const theme = useTheme();
  const maxQty = Math.max(...yearlyEntries.map((e) => e.totalQuantityKg));

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5 }}
      >
        {yearlyLabel} ({yearlyEntries[0]?.year}~
        {yearlyEntries[yearlyEntries.length - 1]?.year})
      </Typography>
      <DashboardCard>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {yearlyEntries.map((entry) => {
            const widthPercent =
              maxQty > 0 ? (entry.totalQuantityKg / maxQty) * 100 : 0;
            return (
              <Box
                key={entry.year}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    width: 36,
                    flexShrink: 0,
                    color: theme.palette.text.secondary,
                    textAlign: "right",
                  }}
                >
                  {entry.year}
                </Typography>
                <Box
                  sx={{
                    height: 20,
                    width: `${widthPercent}%`,
                    minWidth: 2,
                    bgcolor: theme.palette.primary.main,
                    borderRadius: "0 4px 4px 0",
                    opacity: 0.8,
                    transition: "width 0.6s ease",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ flexShrink: 0, fontWeight: 500 }}
                >
                  {(entry.totalQuantityKg / 1000).toFixed(0)}톤
                </Typography>
              </Box>
            );
          })}
        </Box>
      </DashboardCard>
    </Box>
  );
};

export default YearlyTrendBars;
