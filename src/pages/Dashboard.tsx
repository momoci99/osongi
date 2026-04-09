import {
  Box,
  Container,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Skeleton,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DashboardKpiCard from "../components/Dashboard/DashboardKpiCard";
import { useEffect, useState } from "react";
import { DailyDataScheme, type DailyDataType } from "../types/DailyData";
import { GradeKeyToKorean, AVAILABLE_REGIONS } from "../const/Common";
import DashboardChartGradePerKg from "../components/Dashboard/DashboardChartGradePerKg";
import DashboardChartGradePerPrice from "../components/Dashboard/DashboardChartGradePerPrice";
import DashboardChartWeeklyToggle from "../components/Dashboard/DashboardChartWeeklyToggle";
import DashboardCard from "../components/Dashboard/DashboardCard";
import type { WeeklyManifest } from "../types/data";
import { useSettingsStore } from "../stores/useSettingsStore";
import SeasonOffDashboard from "../components/Dashboard/SeasonOffDashboard";

/** 최신 데이터가 7일 이내이면 시즌 중. ?season=on|off 로 강제 가능 */
function isInSeason(latestDate: string): boolean {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("season");
  if (override === "on") return true;
  if (override === "off") return false;

  const latest = new Date(latestDate);
  const now = new Date();
  const diffMs = now.getTime() - latest.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

const Dashboard = () => {
  const theme = useTheme();
  const myRegion = useSettingsStore((s) => s.myRegion);
  const setMyRegion = useSettingsStore((s) => s.setMyRegion);

  const [dailyData, setDailyData] = useState<DailyDataType | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyManifest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(function initDailyData() {
    fetch("/auction-stats/daily-manifest.json")
      .then((res) => res.json())
      .then((data) => {
        const parsed = DailyDataScheme.safeParse(data);
        if (parsed.success) {
          setDailyData(parsed.data);
        } else {
          console.error("Failed to parse daily data:", parsed.error);
        }
      })
      .catch((err) => console.error("Error fetching daily data:", err));
  }, [refreshKey]);

  useEffect(function initWeeklyData() {
    fetch("/auction-stats/weekly-manifest.json")
      .then((res) => res.json())
      .then((data) => setWeeklyData(data))
      .catch((err) => console.error("Error fetching weekly data:", err))
      .finally(() => setIsRefreshing(false));
  }, [refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  if (!dailyData || !weeklyData) {
    return (
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  const { latestDaily, latestDate } = dailyData;
  const inSeason = isInSeason(latestDate);

  // 지역 셀렉트 (시즌 중/외 공통)
  const regionSelector = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        mb: 2,
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, flexShrink: 0 }}
      >
        내 지역
      </Typography>
      <Select
        value={myRegion ?? ""}
        onChange={(e) =>
          setMyRegion(e.target.value as (typeof AVAILABLE_REGIONS)[number])
        }
        size="small"
        variant="outlined"
        sx={{
          minWidth: 100,
          fontSize: "0.875rem",
          fontWeight: 600,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.divider,
          },
        }}
      >
        {AVAILABLE_REGIONS.map((region) => (
          <MenuItem key={region} value={region}>
            {region}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );

  // 시즌 외: 분석/회고 모드
  if (!inSeason) {
    return (
      <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
            mb: 2,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                송이버섯 시세 대시보드
              </Typography>
              <Tooltip title="데이터 새로고침">
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  sx={{
                    animation: isRefreshing ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
            >
              현재 시즌 외 기간입니다. 지난 시즌의 데이터를 분석합니다.
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              마지막 데이터: {latestDate}
            </Typography>
          </Box>
          {regionSelector}
        </Box>
        <SeasonOffDashboard myRegion={myRegion} />
      </Container>
    );
  }

  // 시즌 중: 실시간 시세 모드
  const regionData = myRegion
    ? latestDaily.regionGradeBreakdown?.[myRegion]
    : null;
  const dayComparison = latestDaily.previousDayComparison;

  const upColor = theme.palette.chart.up;
  const downColor = theme.palette.chart.down;

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
      {/* 지역 셀렉트 + 내 지역 시세 — 최상단 */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: theme.palette.primary.main,
              flexShrink: 0,
            }}
          />
          {regionSelector}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              {latestDate} 기준
            </Typography>
            <Tooltip title="데이터 새로고침">
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              >
                <RefreshIcon sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

      {myRegion && (!regionData || regionData.length === 0) && (
          <DashboardCard>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                textAlign: "center",
                py: 3,
              }}
            >
              {myRegion} 지역의 거래 데이터가 없습니다. 시즌 중 공판이 진행되면
              데이터가 표시됩니다.
            </Typography>
          </DashboardCard>
      )}

      {myRegion && regionData && regionData.length > 0 && (
          <DashboardCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, opacity: 0.6 }}>
                      등급
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, opacity: 0.6 }}
                    >
                      수량 (kg)
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, opacity: 0.6 }}
                    >
                      단가 (원/kg)
                    </TableCell>
                    {dayComparison && (
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 600, opacity: 0.6 }}
                      >
                        전일 대비
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {regionData.map((item) => {
                    const gradeLabel =
                      GradeKeyToKorean[
                        item.gradeKey as keyof typeof GradeKeyToKorean
                      ] || item.gradeKey;
                    const gradeColor =
                      theme.palette.chart[
                        item.gradeKey as keyof typeof theme.palette.chart
                      ];
                    const change = dayComparison?.gradeChanges.find(
                      (c) => c.gradeKey === item.gradeKey
                    );

                    return (
                      <TableRow key={item.gradeKey}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                            }}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "2px",
                                bgcolor:
                                  typeof gradeColor === "string"
                                    ? gradeColor
                                    : theme.palette.text.secondary,
                                flexShrink: 0,
                              }}
                            />
                            {gradeLabel}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {item.quantityKg.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 600 }}
                        >
                          {item.unitPriceWon.toLocaleString()}
                        </TableCell>
                        {dayComparison && change && (
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 500,
                              color:
                                change.changePercent > 0
                                  ? upColor
                                  : change.changePercent < 0
                                    ? downColor
                                    : theme.palette.text.secondary,
                            }}
                          >
                            {change.changePercent > 0
                              ? `▲ ${change.changePercent.toFixed(1)}%`
                              : change.changePercent < 0
                                ? `▼ ${Math.abs(change.changePercent).toFixed(1)}%`
                                : "— 0.0%"}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardCard>
      )}
      </Box>

      {/* KPI 카드 */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <DashboardKpiCard
            title="총 판매량"
            content={`${latestDaily.totalQuantityTodayKg.toLocaleString()} kg`}
            caption={latestDate}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <DashboardKpiCard
            title="최다 거래 등급"
            content={
              GradeKeyToKorean[
                latestDaily.topGradeByQuantity
                  .gradeKey as keyof typeof GradeKeyToKorean
              ] || latestDaily.topGradeByQuantity.gradeKey
            }
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

      {/* 등급별 차트 */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCard>
            <Typography variant="subtitle1">
              등급별 수량(Kg) — {latestDate}
            </Typography>
            <DashboardChartGradePerKg data={latestDaily.gradeBreakdown} />
          </DashboardCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCard>
            <Typography variant="subtitle1">
              등급별 가격(원) — {latestDate}
            </Typography>
            <DashboardChartGradePerPrice data={latestDaily.gradeBreakdown} />
          </DashboardCard>
        </Grid>
      </Grid>

      {/* 주간 차트 */}
      <Grid container sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <DashboardCard>
            <Typography variant="subtitle1">
              7일간 등급별 가격·수량 변동
            </Typography>
            <DashboardChartWeeklyToggle data={weeklyData.weeklyData} />
          </DashboardCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
