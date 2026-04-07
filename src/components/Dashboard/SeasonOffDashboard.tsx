import {
  Box,
  Grid,
  Typography,
  Skeleton,
  useTheme,
} from "@mui/material";
import DashboardCard from "./DashboardCard";
import { useEffect, useState } from "react";

interface SeasonSummary {
  year: number;
  startDate: string;
  endDate: string;
  totalQuantityKg: number;
  totalAmountWon: number;
  avgPricePerKg: number;
  highestPrice: { date: string; gradeKey: string; price: number } | null;
  lowestPrice: { date: string; gradeKey: string; price: number } | null;
}

interface MonthlyPattern {
  month: number;
  avgQuantityKg: number;
  avgPriceWon: number;
  yearCount: number;
}

interface RegionRanking {
  region: string;
  avgPriceWon: number;
  totalQuantityKg: number;
}

interface RegionSeasonSummary {
  totalQuantityKg: number;
  totalAmountWon: number;
  avgPricePerKg: number;
}

interface SeasonManifest {
  generatedAt: string;
  latestSeasonSummary: SeasonSummary | null;
  regionSeasonSummaries: Record<string, RegionSeasonSummary>;
  monthlyPatterns: MonthlyPattern[];
  regionRanking: RegionRanking[];
}

interface YearlyEntry {
  totalQuantityKg: number;
  totalAmountWon: number;
  topRegion: { region: string; quantityKg: number } | null;
  topUnion: { union: string; quantityKg: number } | null;
}

interface YearlyManifest {
  generatedAt: string;
  yearly: Record<string, YearlyEntry>;
  regionYearly: Record<string, Record<string, { totalQuantityKg: number; totalAmountWon: number }>>;
}

const MONTH_NAMES = ["", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

interface SeasonOffDashboardProps {
  myRegion?: string | null;
}

export default function SeasonOffDashboard({ myRegion }: SeasonOffDashboardProps) {
  const theme = useTheme();
  const [seasonData, setSeasonData] = useState<SeasonManifest | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyManifest | null>(null);

  useEffect(() => {
    fetch("/auction-stats/season-manifest.json")
      .then((res) => res.json())
      .then(setSeasonData)
      .catch(console.error);

    fetch("/auction-stats/yearly-manifest.json")
      .then((res) => res.json())
      .then(setYearlyData)
      .catch(console.error);
  }, []);

  if (!seasonData || !yearlyData) {
    return (
      <Box>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 1.5 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 6, sm: 3 }}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: "0.75rem" }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={200} sx={{ mt: 3, borderRadius: "0.75rem" }} />
      </Box>
    );
  }

  const summary = seasonData.latestSeasonSummary;
  const patterns = seasonData.monthlyPatterns;
  const rankings = seasonData.regionRanking;

  // 지역별 시즌 요약 (선택된 지역이 있으면 해당 지역 데이터)
  const regionSeason = myRegion
    ? seasonData.regionSeasonSummaries?.[myRegion]
    : null;

  // 연간 데이터: 지역이 선택되면 해당 지역만, 아니면 전체
  const yearlyEntries = myRegion && yearlyData.regionYearly?.[myRegion]
    ? Object.entries(yearlyData.regionYearly[myRegion])
        .map(([year, data]) => ({
          year: parseInt(year, 10),
          totalQuantityKg: data.totalQuantityKg,
          totalAmountWon: data.totalAmountWon,
        }))
        .sort((a, b) => a.year - b.year)
    : Object.entries(yearlyData.yearly)
        .map(([year, data]) => ({
          year: parseInt(year, 10),
          totalQuantityKg: data.totalQuantityKg,
          totalAmountWon: data.totalAmountWon,
        }))
        .sort((a, b) => a.year - b.year);

  const yearlyLabel = myRegion ? `${myRegion} 연간 거래량 추이` : "연간 거래량 추이";

  return (
    <Box>
      {/* 직전 시즌 요약 */}
      {summary && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5 }}
          >
            {myRegion ? `${myRegion} ` : ""}{summary.year}년 시즌 요약
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
                  {((regionSeason?.totalQuantityKg ?? summary.totalQuantityKg) / 1000).toFixed(1)}
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
                  {((regionSeason?.totalAmountWon ?? summary.totalAmountWon) / 100_000_000).toFixed(1)}
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
      )}

      {/* 연간 거래량 추이 */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5 }}
        >
          {yearlyLabel} ({yearlyEntries[0]?.year}~{yearlyEntries[yearlyEntries.length - 1]?.year})
        </Typography>
        <DashboardCard>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {yearlyEntries.map((entry) => {
              const maxQty = Math.max(
                ...yearlyEntries.map((e) => e.totalQuantityKg)
              );
              const widthPercent =
                maxQty > 0
                  ? (entry.totalQuantityKg / maxQty) * 100
                  : 0;
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
                    sx={{
                      flexShrink: 0,
                      fontWeight: 500,
                    }}
                  >
                    {(entry.totalQuantityKg / 1000).toFixed(0)}톤
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </DashboardCard>
      </Box>

      {/* 시즌 패턴 + 지역 랭킹 */}
      <Grid container spacing={2}>
        {patterns.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
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
                          width: `${(p.avgQuantityKg / Math.max(...patterns.map((pp) => pp.avgQuantityKg))) * 100}%`,
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
          </Grid>
        )}

        {rankings.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
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
                            width: `${(r.avgPriceWon / Math.max(...rankings.map((rr) => rr.avgPriceWon))) * 100}%`,
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
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
