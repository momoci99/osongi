import { useState, useEffect, useMemo } from "react";
import { Container, Box, Grid, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import type { MushroomAuctionDataRaw } from "../types/data";
import { GRADE_OPTIONS } from "../const/Common";
import {
  type AnalysisFilters,
  type MovingAverageDatum,
  type SeasonReport,
  getDefaultDateRange,
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
import AnalysisFiltersComponent from "../components/DataAnalysis/AnalysisFilters";
import AnalysisKPISection from "../components/DataAnalysis/AnalysisKPI";
import ChartSection from "../components/DataAnalysis/ChartSection";
import GradeBreakdownChart from "../components/DataAnalysis/GradeBreakdownChart";
import SeasonReportSection from "../components/DataAnalysis/SeasonReport/index";
import ScatterPlotChart from "../components/DataAnalysis/ScatterPlotChart";
import RegionComparisonSection from "../components/DataAnalysis/RegionComparisonSection";
import PriceDistributionChart from "../components/DataAnalysis/PriceDistributionChart";
import TableSection from "../components/DataAnalysis/TableSection";

const DataAnalysis = () => {
  const [rawData, setRawData] = useState<MushroomAuctionDataRaw[]>([]);
  const [comparisonRawData, setComparisonRawData] = useState<
    MushroomAuctionDataRaw[]
  >([]);
  const [loading, setLoading] = useState(false);

  // 필터 상태 (새 구조)
  const [filters, setFilters] = useState<AnalysisFilters>(() => {
    const { startDate, endDate } = getDefaultDateRange();
    return {
      regions: [],
      unions: [],
      grades: GRADE_OPTIONS.map((o) => o.value),
      startDate,
      endDate,
      comparisonEnabled: false,
      comparisonStartDate: null,
      comparisonEndDate: null,
    };
  });

  const [chartMode, setChartMode] = useState<"price" | "quantity">("price");

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

  // 필터 초기화
  const handleResetFilters = () => {
    const { startDate, endDate } = getDefaultDateRange();
    setFilters({
      regions: [],
      unions: [],
      grades: GRADE_OPTIONS.map((o) => o.value),
      startDate,
      endDate,
      comparisonEnabled: false,
      comparisonStartDate: null,
      comparisonEndDate: null,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
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

          {/* 필터 */}
          <AnalysisFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onResetFilters={handleResetFilters}
          />

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
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <GradeBreakdownChart data={gradeBreakdown} />
            </Grid>
          </Grid>

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
            <PriceDistributionChart data={distributionData} loading={loading} />
          </Box>

          {/* 상세 테이블 */}
          <TableSection
            loading={loading}
            filteredData={filteredData}
            filters={filters}
          />
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default DataAnalysis;
