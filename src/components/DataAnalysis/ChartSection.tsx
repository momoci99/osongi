import { Box, Typography, Paper, CircularProgress, useTheme } from "@mui/material";
import type { WeeklyPriceDatum } from "../../types/data";
import DataAnalysisChart from "./DataAnalysisChart";
import { CHART_LAYOUT, UI_LAYOUT } from "../../const/Numbers";

interface ChartSectionProps {
  chartData: WeeklyPriceDatum[];
  loading: boolean;
  filteredDataLength: number;
  chartMode: "price" | "quantity";
  onChartModeChange: (mode: "price" | "quantity") => void;
}

export default function ChartSection({
  chartData,
  loading,
  filteredDataLength,
  chartMode,
  onChartModeChange,
}: ChartSectionProps) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "0.75rem",
        width: "100%",
        backgroundColor: theme.palette.background.paper,
      }}
    >
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
        <Box
          sx={{
            height: CHART_LAYOUT.DEFAULT_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            flexDirection: "column",
          }}
        >
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            데이터 로딩 중...
          </Typography>
        </Box>
      ) : chartData.length > 0 ? (
        <DataAnalysisChart
          data={chartData}
          height={CHART_LAYOUT.DEFAULT_HEIGHT}
          mode={chartMode}
          onModeChange={onChartModeChange}
        />
      ) : (
        <Box
          sx={{
            height: CHART_LAYOUT.DEFAULT_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            표시할 데이터가 없습니다
          </Typography>
          <Typography variant="caption" color="text.secondary">
            필터 조건을 조정해보세요
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
