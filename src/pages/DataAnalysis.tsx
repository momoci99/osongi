import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Box,
  Grid,
  Typography,
  Fab,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import TuneIcon from "@mui/icons-material/Tune";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import type { MushroomAuctionDataRaw } from "../types/data";
import {
  type MovingAverageDatum,
  type SeasonReport,
  applyFilters,
  transformToChartData,
  calculateKPI,
  calculateKPIComparison,
  calculateGradeBreakdown,
  transformToScatterData,
  calculateRegionComparison,
  calculateMovingAverages,
  generateSeasonReport,
  calculatePriceDistribution,
} from "../utils/analysisUtils";
import { loadDateRangeData } from "../utils/dataAnalysisLoader";
import { useAnalysisFilterStore } from "../stores/useAnalysisFilterStore";
import AnalysisKPISection from "../components/DataAnalysis/AnalysisKPI";
import ChartSection from "../components/DataAnalysis/ChartSection";
import GradeBreakdownChart from "../components/DataAnalysis/GradeBreakdownChart";
import SeasonReportSection from "../components/DataAnalysis/SeasonReport/index";
import ScatterPlotChart from "../components/DataAnalysis/ScatterPlotChart";
import RegionComparisonSection from "../components/DataAnalysis/RegionComparisonSection";
import PriceDistributionChart from "../components/DataAnalysis/PriceDistributionChart";
import TableSection from "../components/DataAnalysis/TableSection";
import FilterDrawer from "../components/DataAnalysis/FilterDrawer";
import { FILTER_DRAWER } from "../const/Numbers";
import ActiveFilterSummary from "../components/DataAnalysis/Filters/ActiveFilterSummary";

const DataAnalysis = () => {
  const [rawData, setRawData] = useState<MushroomAuctionDataRaw[]>([]);
  const [comparisonRawData, setComparisonRawData] = useState<
    MushroomAuctionDataRaw[]
  >([]);
  const [loading, setLoading] = useState(false);

  // 필터 상태 (localStorage 영속화)
  const { filters, setFilters, resetFilters, drawerOpen, toggleDrawer } =
    useAnalysisFilterStore();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [chartMode, setChartMode] = useState<"price" | "quantity">("price");
  const [chartExpanded, setChartExpanded] = useState(false);

  const FILTER_FAB_SEEN_KEY = "osongi_filter_fab_seen";
  const [isFilterFabExtended, setIsFilterFabExtended] = useState(
    () => !localStorage.getItem(FILTER_FAB_SEEN_KEY),
  );

  // 메인 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await loadDateRangeData(
          filters.startDate,
          filters.endDate,
        );
        setRawData(data);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filters.startDate, filters.endDate]);

  // 비교 데이터 로드
  useEffect(() => {
    if (
      !filters.comparisonEnabled ||
      !filters.comparisonStartDate ||
      !filters.comparisonEndDate
    ) {
      setComparisonRawData([]);
      return;
    }

    const loadComparisonData = async () => {
      try {
        const data = await loadDateRangeData(
          filters.comparisonStartDate!,
          filters.comparisonEndDate!,
        );
        setComparisonRawData(data);
      } catch (error) {
        console.error("비교 데이터 로드 실패:", error);
      }
    };
    loadComparisonData();
  }, [
    filters.comparisonEnabled,
    filters.comparisonStartDate,
    filters.comparisonEndDate,
  ]);

  // 필터 적용된 데이터
  const filteredData = useMemo(
    () => applyFilters(rawData, filters),
    [rawData, filters],
  );

  const filteredComparisonData = useMemo(() => {
    if (!filters.comparisonEnabled || comparisonRawData.length === 0) return [];
    return applyFilters(comparisonRawData, {
      ...filters,
      startDate: filters.comparisonStartDate!,
      endDate: filters.comparisonEndDate!,
    });
  }, [comparisonRawData, filters]);

  // 차트 데이터
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];
    return transformToChartData(filteredData, filters.grades);
  }, [filteredData, filters.grades]);

  // KPI
  const kpi = useMemo(
    () => calculateKPI(filteredData, filters.grades),
    [filteredData, filters.grades],
  );

  const kpiComparison = useMemo(() => {
    if (!filters.comparisonEnabled || filteredComparisonData.length === 0)
      return null;
    const prevKPI = calculateKPI(filteredComparisonData, filters.grades);
    return calculateKPIComparison(kpi, prevKPI);
  }, [kpi, filteredComparisonData, filters]);

  // 등급별 비중
  const gradeBreakdown = useMemo(
    () => calculateGradeBreakdown(filteredData, filters.grades),
    [filteredData, filters.grades],
  );

  // 산점도
  const scatterData = useMemo(
    () => transformToScatterData(filteredData, filters.grades),
    [filteredData, filters.grades],
  );

  // 지역 비교
  const regionComparison = useMemo(
    () => calculateRegionComparison(filteredData, filters.grades),
    [filteredData, filters.grades],
  );

  // 이동평균
  const maData = useMemo<MovingAverageDatum[]>(
    () => calculateMovingAverages(chartData),
    [chartData],
  );

  // 가격 분포
  const distributionData = useMemo(
    () => calculatePriceDistribution(chartData),
    [chartData],
  );

  // 시즌 리포트
  const seasonReport = useMemo<SeasonReport>(() => {
    const comparisonWeeklyData =
      filters.comparisonEnabled && filteredComparisonData.length > 0
        ? transformToChartData(filteredComparisonData, filters.grades)
        : undefined;
    return generateSeasonReport(
      chartData,
      filters.grades,
      comparisonWeeklyData,
    );
  }, [
    chartData,
    filters.grades,
    filters.comparisonEnabled,
    filteredComparisonData,
  ]);

  const chartEmptyMessage = useMemo(() => {
    if (filters.startDate > filters.endDate) {
      const fmt = (d: Date) =>
        d.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
      return `시작일(${fmt(filters.startDate)})이 종료일(${fmt(filters.endDate)})보다 늦습니다. 기간을 조정해주세요.`;
    }
    return undefined;
  }, [filters.startDate, filters.endDate]);

  const handleResetFilters = () => {
    resetFilters();
  };

  const handleFilterFabClick = () => {
    if (isFilterFabExtended) {
      localStorage.setItem(FILTER_FAB_SEEN_KEY, "1");
      setIsFilterFabExtended(false);
    }
    toggleDrawer();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box sx={{ display: "flex", overflow: "hidden" }}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            transition: "margin 225ms cubic-bezier(0, 0, 0.2, 1)",
            marginRight:
              drawerOpen && !isMobile ? `${FILTER_DRAWER.WIDTH}px` : 0,
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ py: 3 }}>
              {/* 헤더 */}
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 700, mb: 0.5 }}
              >
                데이터 분석
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                필터를 조합하여 송이버섯 공판 데이터를 다각도로 분석하세요.
              </Typography>

              {/* 활성 필터 요약 */}
              <Box sx={{ mb: 2.5 }}>
                <ActiveFilterSummary
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </Box>

              {/* 요약 KPI */}
              <AnalysisKPISection
                kpi={kpi}
                comparison={kpiComparison}
                loading={loading}
              />

              {/* 시즌 요약 리포트 */}
              <Box sx={{ mb: 2.5 }}>
                <SeasonReportSection report={seasonReport} loading={loading} />
              </Box>

              {/* 가격 추이 + 등급별 비중 (2열) */}
              {chartExpanded ? (
                <>
                  <Box sx={{ mb: 2.5 }}>
                    <ChartSection
                      chartData={chartData}
                      loading={loading}
                      filteredDataLength={filteredData.length}
                      chartMode={chartMode}
                      onChartModeChange={setChartMode}
                      maData={maData}
                      emptyMessage={chartEmptyMessage}
                      expanded={chartExpanded}
                      onExpandedChange={setChartExpanded}
                    />
                  </Box>
                  <Box sx={{ mb: 2.5 }}>
                    <GradeBreakdownChart data={gradeBreakdown} />
                  </Box>
                </>
              ) : (
                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <ChartSection
                      chartData={chartData}
                      loading={loading}
                      filteredDataLength={filteredData.length}
                      chartMode={chartMode}
                      onChartModeChange={setChartMode}
                      maData={maData}
                      emptyMessage={chartEmptyMessage}
                      expanded={chartExpanded}
                      onExpandedChange={setChartExpanded}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <GradeBreakdownChart data={gradeBreakdown} />
                  </Grid>
                </Grid>
              )}

              {/* 산점도 + 지역 비교 (2열) */}
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <ScatterPlotChart data={scatterData} />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <RegionComparisonSection data={regionComparison} />
                </Grid>
              </Grid>

              {/* 가격 분포 히스토그램 */}
              <Box sx={{ mb: 2.5 }}>
                <PriceDistributionChart
                  data={distributionData}
                  loading={loading}
                />
              </Box>

              {/* 상세 테이블 */}
              <TableSection
                loading={loading}
                filteredData={filteredData}
                filters={filters}
              />
            </Box>
          </Container>
        </Box>

        <FilterDrawer
          filters={filters}
          onFiltersChange={setFilters}
          onResetFilters={handleResetFilters}
          open={drawerOpen}
          onClose={toggleDrawer}
        />
      </Box>

      {/* FAB — Drawer가 닫혀있을 때만 표시 */}
      {!drawerOpen && (
        <Fab
          color="primary"
          variant={isFilterFabExtended ? "extended" : "circular"}
          onClick={handleFilterFabClick}
          aria-label="필터 열기"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1200,
            ...(isFilterFabExtended && {
              gap: 1,
              px: 2.5,
              animation: "fabPulse 2s ease-in-out 0.5s 2",
              "@keyframes fabPulse": {
                "0%, 100%": { boxShadow: "0 0 0 0 rgba(25,118,210,0.4)" },
                "50%": { boxShadow: "0 0 0 10px rgba(25,118,210,0)" },
              },
            }),
          }}
        >
          {isFilterFabExtended ? (
            <>
              <TuneIcon />
              필터 설정
            </>
          ) : (
            <FilterListIcon />
          )}
        </Fab>
      )}
    </LocalizationProvider>
  );
};

export default DataAnalysis;
