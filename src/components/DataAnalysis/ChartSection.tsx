import { useMemo } from "react";
import { Box, Typography, Alert, Button } from "@mui/material";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import type { WeeklyPriceDatum } from "../../types/data";
import type { MovingAverageDatum } from "../../utils/analysis/statistics";
import DataAnalysisChart from "./DataAnalysisChart";
import { CHART_LAYOUT, UI_LAYOUT } from "../../const/Numbers";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";
import { countUniqueSeries } from "./DataAnalysisChart/seriesBuilder";

const SERIES_WARNING_THRESHOLD = 20;

type ChartSectionProps = {
  chartData: WeeklyPriceDatum[];
  loading: boolean;
  filteredDataLength: number;
  chartMode: "price" | "quantity";
  onChartModeChange: (mode: "price" | "quantity") => void;
  maData: MovingAverageDatum[];
  emptyMessage?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

const ChartSection = ({
  chartData,
  loading,
  filteredDataLength,
  chartMode,
  onChartModeChange,
  maData,
  emptyMessage,
  expanded = false,
  onExpandedChange,
}: ChartSectionProps) => {
  const seriesCount = useMemo(() => countUniqueSeries(chartData), [chartData]);
  const chartHeight = expanded
    ? CHART_LAYOUT.EXPANDED_HEIGHT
    : CHART_LAYOUT.DEFAULT_HEIGHT;

  return (
    <SectionCard sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: UI_LAYOUT.SECTION_MARGIN_BOTTOM,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          가격 및 수량 변동 추이
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            variant="text"
            startIcon={expanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
            onClick={() => onExpandedChange?.(!expanded)}
            sx={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
          >
            {expanded ? "차트 축소" : "차트 확대"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? "로딩 중..."
              : `${filteredDataLength}개 레코드 · ${seriesCount}개 시리즈`}
          </Typography>
        </Box>
      </Box>

      {!loading && seriesCount > SERIES_WARNING_THRESHOLD && (
        <Alert severity="info" variant="outlined" sx={{ mb: 1.5, py: 0.5 }}>
          현재 {seriesCount}개 시리즈가 표시 중입니다. 범례를 클릭하여 관심
          시리즈만 남겨보세요.
        </Alert>
      )}

      {loading ? (
        <EmptyState loading height={chartHeight} />
      ) : chartData.length > 0 ? (
        <DataAnalysisChart
          data={chartData}
          height={chartHeight}
          mode={chartMode}
          onModeChange={onChartModeChange}
          maData={maData}
        />
      ) : (
        <EmptyState height={chartHeight} message={emptyMessage} />
      )}
    </SectionCard>
  );
};

export default ChartSection;
