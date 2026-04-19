import { Box, Typography } from "@mui/material";
import type { WeeklyPriceDatum } from "../../types/data";
import type { MovingAverageDatum } from "../../utils/analysis/statistics";
import DataAnalysisChart from "./DataAnalysisChart";
import { CHART_LAYOUT, UI_LAYOUT } from "../../const/Numbers";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";

type ChartSectionProps = {
  chartData: WeeklyPriceDatum[];
  loading: boolean;
  filteredDataLength: number;
  chartMode: "price" | "quantity";
  onChartModeChange: (mode: "price" | "quantity") => void;
  maData: MovingAverageDatum[];
  emptyMessage?: string;
};

const ChartSection = ({
  chartData,
  loading,
  filteredDataLength,
  chartMode,
  onChartModeChange,
  maData,
  emptyMessage,
}: ChartSectionProps) => {
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
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>가격 및 수량 변동 추이</Typography>
        <Typography variant="body2" color="text.secondary">
          {loading ? "로딩 중..." : `${filteredDataLength}개 레코드`}
        </Typography>
      </Box>

      {loading ? (
        <EmptyState loading height={CHART_LAYOUT.DEFAULT_HEIGHT} />
      ) : chartData.length > 0 ? (
        <DataAnalysisChart
          data={chartData}
          height={CHART_LAYOUT.DEFAULT_HEIGHT}
          mode={chartMode}
          onModeChange={onChartModeChange}
          maData={maData}
        />
      ) : (
        <EmptyState height={CHART_LAYOUT.DEFAULT_HEIGHT} message={emptyMessage} />
      )}
    </SectionCard>
  );
};

export default ChartSection;
