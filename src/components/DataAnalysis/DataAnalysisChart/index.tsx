import { useState, useEffect, useRef } from "react";
import { Box, ToggleButton, ToggleButtonGroup, IconButton, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import type { WeeklyPriceDatum } from "../../../types/data";
import { CHART_LAYOUT } from "../../../const/Numbers";
import useDrawAnalysisChart from "./useDrawAnalysisChart";
import type { ChartMode } from "./seriesBuilder";
import { useChartExport } from "../../../hooks/useChartExport";

export type DataAnalysisChartProps = {
  data: WeeklyPriceDatum[];
  height?: number;
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
};

/**
 * 송이버섯 공판 데이터 분석 차트의 레이아웃과 토글 상태를 관리합니다.
 */
const DataAnalysisChart = ({
  data,
  height = CHART_LAYOUT.DEFAULT_HEIGHT,
  mode,
  onModeChange,
}: DataAnalysisChartProps) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: observedHeight } = entry.contentRect;
        setContainerSize({ width, height: observedHeight || height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [height]);

  const { svgRef } = useDrawAnalysisChart({
    data,
    height,
    theme,
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    mode,
  });
  const { exportToPng } = useChartExport(svgRef, theme.palette.background.paper);

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ChartMode | null,
  ) => {
    if (newMode !== null) onModeChange(newMode);
  };

  return (
    <Box sx={{ width: "100%", mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 2 }}>
        {data.length > 0 && (
          <Tooltip title="PNG 다운로드">
            <IconButton size="small" onClick={() => exportToPng("가격수량추이")}>
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              px: { xs: 1, sm: 2 },
              py: 0.5,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              border: `1px solid ${theme.palette.divider}`,
              "&.Mui-selected": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              },
            },
          }}
        >
          <ToggleButton value="price">가격</ToggleButton>
          <ToggleButton value="quantity">수량</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: { xs: 300, sm: 400, md: height },
          minHeight: 300,
        }}
      >
        <svg ref={svgRef} />
      </Box>
    </Box>
  );
};

export default DataAnalysisChart;
