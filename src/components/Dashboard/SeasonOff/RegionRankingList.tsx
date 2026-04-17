import { Box, Typography, useTheme } from "@mui/material";
import DashboardCard from "../DashboardCard";
import type { RegionRanking } from "../../../types/seasonOff";

type RegionRankingListProps = {
  rankings: RegionRanking[];
  myRegion?: string | null;
};

/** 지역별 평균 시세 랭킹 리스트 */
const RegionRankingList = ({ rankings, myRegion }: RegionRankingListProps) => {
  const theme = useTheme();
  const maxPrice = Math.max(...rankings.map((rr) => rr.avgPriceWon));

  return (
    <>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5 }}
      >
        지역별 평균 시세 랭킹
      </Typography>
      <DashboardCard>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {rankings.map((r, i) => {
            const isMyRegion = myRegion === r.region;
            return (
              <Box
                key={r.region}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 0.75,
                  mx: -0.75,
                  borderRadius: "0.5rem",
                  bgcolor: isMyRegion
                    ? `${theme.palette.primary.main}0A`
                    : "transparent",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    width: 20,
                    color:
                      isMyRegion || i === 0
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                  }}
                >
                  {i + 1}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isMyRegion ? 700 : 500,
                    width: 40,
                  }}
                >
                  {r.region}
                </Typography>
                <Box sx={{ flex: 1 }}>
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
                        width: `${(r.avgPriceWon / maxPrice) * 100}%`,
                        bgcolor:
                          i === 0
                            ? theme.palette.primary.main
                            : theme.palette.secondary.main,
                        borderRadius: 3,
                      }}
                    />
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, flexShrink: 0 }}
                >
                  {r.avgPriceWon.toLocaleString()}원
                </Typography>
              </Box>
            );
          })}
        </Box>
      </DashboardCard>
    </>
  );
};

export default RegionRankingList;
