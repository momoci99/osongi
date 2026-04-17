import { Box, Typography, useTheme } from "@mui/material";
import DashboardCard from "../DashboardCard";
import type { MonthlyPattern } from "../../../types/seasonOff";

const MONTH_NAMES = [
  "",
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

type MonthlyPatternListProps = {
  patterns: MonthlyPattern[];
};

/** 시즌 내 월별 패턴 리스트 */
const MonthlyPatternList = ({ patterns }: MonthlyPatternListProps) => {
  const theme = useTheme();
  const maxQty = Math.max(...patterns.map((pp) => pp.avgQuantityKg));

  return (
    <>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5 }}
      >
        시즌 내 월별 패턴
      </Typography>
      <DashboardCard>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {patterns.map((p) => (
            <Box key={p.month}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.25,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {MONTH_NAMES[p.month]}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  평균 {p.avgPriceWon.toLocaleString()}원/kg ·{" "}
                  {(p.avgQuantityKg / 1000).toFixed(1)}톤
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 6,
                  bgcolor: theme.palette.divider,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${(p.avgQuantityKg / maxQty) * 100}%`,
                    bgcolor: theme.palette.primary.main,
                    borderRadius: 3,
                    transition: "width 0.6s ease",
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </DashboardCard>
    </>
  );
};

export default MonthlyPatternList;
