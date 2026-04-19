import { useState, useEffect, useRef } from "react";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import HeightIcon from "@mui/icons-material/Height";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import type { WeeklyPriceDatum } from "../../../types/data";
import type { MovingAverageDatum } from "../../../utils/analysis/statistics";
import { CHART_LAYOUT } from "../../../const/Numbers";
import useDrawAnalysisChart from "./useDrawAnalysisChart";
import type { ChartMode, ChartLayout } from "./seriesBuilder";
import { groupByYear, filterMushroomSeason } from "./seriesBuilder";
import { useChartExport } from "../../../hooks/useChartExport";

export type DataAnalysisChartProps = {
  data: WeeklyPriceDatum[];
  height?: number;
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
  maData: MovingAverageDatum[];
};

/**
 * 송이버섯 공판 데이터 분석 차트의 레이아웃과 토글 상태를 관리합니다.
 */
const DataAnalysisChart = ({
  data,
  height = CHART_LAYOUT.DEFAULT_HEIGHT,
  mode,
  onModeChange,
  maData,
}: DataAnalysisChartProps) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showMA, setShowMA] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [layout, setLayout] = useState<ChartLayout>("subplot");

  const yearCount = groupByYear(filterMushroomSeason(data)).size;
  const isMultiYear = yearCount > 1;

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

  const { svgRef, hiddenSeriesRef } = useDrawAnalysisChart({
    data,
    height,
    theme,
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    mode,
    maData,
    showMA: showMA && mode === "price",
    showMarkers,
    layout: isMultiYear ? layout : "subplot",
  });
  const { exportToPng } = useChartExport(
    svgRef,
    theme.palette.background.paper,
  );

  /** 데이터/모드/레이아웃 변경 시 숨김 상태 리셋 */
  useEffect(() => {
    hiddenSeriesRef.current.clear();
  }, [data, mode, layout, hiddenSeriesRef]);

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ChartMode | null,
  ) => {
    if (newMode !== null) onModeChange(newMode);
  };

  return (
    <Box sx={{ width: "100%", mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
        {data.length > 0 && (
          <Tooltip title="PNG 다운로드">
            <IconButton
              size="small"
              onClick={() => exportToPng("가격수량추이")}
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {mode === "price" && (
          <Tooltip title={showMA ? "이동평균선 숨기기" : "이동평균선 표시"}>
            <IconButton
              size="small"
              onClick={() => setShowMA((prev) => !prev)}
              sx={{
                color: showMA
                  ? theme.palette.primary.main
                  : theme.palette.text.disabled,
                border: `1px solid ${showMA ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: 1,
                transition: "color 0.2s, border-color 0.2s",
              }}
            >
              <ShowChartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {isMultiYear && (
          <ToggleButtonGroup
            value={layout}
            exclusive
            onChange={(_e, v) => {
              if (v) setLayout(v);
            }}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                px: { xs: 0.75, sm: 1.5 },
                py: 0.5,
                border: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <ToggleButton value="subplot">
              <Tooltip title="연도별 분리">
                <ViewColumnIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="overlay">
              <Tooltip title="연도 겹쳐보기">
                <CompareArrowsIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        )}
        <Tooltip title={showMarkers ? "극값 마커 숨기기" : "극값 마커 표시"}>
          <IconButton
            size="small"
            onClick={() => setShowMarkers((prev) => !prev)}
            sx={{
              color: showMarkers
                ? theme.palette.primary.main
                : theme.palette.text.disabled,
              border: `1px solid ${showMarkers ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 1,
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            <HeightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
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
          height: { xs: Math.min(height, 500), sm: height, md: height },
          minHeight: CHART_LAYOUT.MIN_HEIGHT,
        }}
      >
        <svg ref={svgRef} />
      </Box>
    </Box>
  );
};

export default DataAnalysisChart;
