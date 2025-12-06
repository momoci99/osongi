import { useState, useEffect, useMemo } from "react";
import { Container, Box, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import type { MushroomAuctionDataRaw } from "../types/data";
import {
  AVAILABLE_REGIONS,
  GRADE_OPTIONS,
  REGION_UNION_MAP,
} from "../const/Common";
import {
  type AnalysisFilters,
  getDefaultDateRange,
  applyFilters,
  transformToChartData,
} from "../utils/analysisUtils";
import { loadDateRangeData } from "../utils/dataAnalysisLoader";
import AnalysisFiltersComponent from "../components/DataAnalysis/AnalysisFilters";
import ChartSection from "../components/DataAnalysis/ChartSection";
import TableSection from "../components/DataAnalysis/TableSection";

const DataAnalysis = () => {
  // 상태 관리
  const [rawData, setRawData] = useState<MushroomAuctionDataRaw[]>([]);
  const [loading, setLoading] = useState(false);

  // 필터 상태
  const [filters, setFilters] = useState<AnalysisFilters>(() => {
    const { startDate, endDate } = getDefaultDateRange();
    const defaultRegion = AVAILABLE_REGIONS[0];
    const defaultUnion =
      REGION_UNION_MAP[defaultRegion as keyof typeof REGION_UNION_MAP]?.[0] ||
      "";
    return {
      region: defaultRegion, // 기본으로 첫 번째 지역 선택
      union: defaultUnion, // 기본으로 첫 번째 지역의 첫 번째 조합 선택
      grades: GRADE_OPTIONS.map((option) => option.value),
      startDate,
      endDate,
    };
  });

  // 차트 모드 상태
  const [chartMode, setChartMode] = useState<"price" | "quantity">("price");

  // 날짜 범위 변경 시 데이터 로드 (초기 로드 포함)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await loadDateRangeData(
          filters.startDate,
          filters.endDate
        );
        setRawData(data);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters.startDate, filters.endDate]); // 날짜 변경 시마다 실행

  // 필터 적용된 데이터
  const filteredData = useMemo(() => {
    return applyFilters(rawData, filters);
  }, [rawData, filters]);

  // 차트 데이터 생성
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];
    return transformToChartData(filteredData, filters.grades);
  }, [filteredData, filters.grades]);

  // 필터 초기화 함수
  const handleResetFilters = () => {
    const { startDate, endDate } = getDefaultDateRange();
    const defaultRegion = AVAILABLE_REGIONS[0];
    const defaultUnion =
      REGION_UNION_MAP[defaultRegion as keyof typeof REGION_UNION_MAP]?.[0] ||
      "";

    setFilters({
      region: defaultRegion,
      union: defaultUnion,
      grades: ["grade1", "grade2"],
      startDate,
      endDate,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          {/* 페이지 헤더 */}
          <Typography variant="h4" component="h1" gutterBottom>
            데이터 분석
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            필터를 사용하여 송이버섯 공판 데이터를 자세히 분석해보세요.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            🍄 송이버섯은 8월~12월 시즌에만 출하되므로, 해당 기간의 데이터만
            분석 가능합니다.
          </Typography>

          {/* 필터 섹션 */}
          <AnalysisFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onResetFilters={handleResetFilters}
          />

          {/* 차트 섹션 */}
          <ChartSection
            chartData={chartData}
            loading={loading}
            filteredDataLength={filteredData.length}
            chartMode={chartMode}
            onChartModeChange={setChartMode}
          />

          {/* 테이블 섹션 */}
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
