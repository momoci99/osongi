import { Box, Typography, useTheme } from "@mui/material";
import useDrawLineChart from "./useDrawLineChart";
import { LINE_CHART } from "../../../../const/AnalysisLayout";
import { resolveSeriesColor } from "../seriesColor";
import { buildLineChartModel, type ChartSeries } from "../../../../utils/analysisQuery/lineChartModel";
import { METRIC_LABELS } from "../../../../utils/analysisQuery/labels";
import type { AnalysisQuery, AnalysisResult } from "../../../../utils/analysisQuery/types";

type LineChartProps = {
  query: AnalysisQuery;
  result: AnalysisResult;
};

type LegendItemProps = {
  color: string;
  label: string;
  variant: "line" | "dashed" | "band";
  opacity?: number;
  bold?: boolean;
};

/** 범례 항목 — 색 표본은 마크 모양을 따르고 글자는 텍스트 색 */
const LegendItem = ({ color, label, variant, opacity = 1, bold = false }: LegendItemProps) => (
  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
    <Box
      component="span"
      sx={{
        width: 16,
        height: variant === "band" ? 10 : 0,
        borderTop: variant === "band" ? "none" : `2px ${variant === "dashed" ? "dashed" : "solid"} ${color}`,
        bgcolor: variant === "band" ? color : "transparent",
        opacity: variant === "band" ? 0.3 : opacity,
        borderRadius: variant === "band" ? "2px" : 0,
      }}
    />
    <Typography
      component="span"
      sx={{ fontSize: "0.75rem", fontWeight: bold ? 700 : 500, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
    >
      {label}
    </Typography>
  </Box>
);

/** 툴팁 스타일 — D3가 innerHTML로 채우는 클래스들 */
const tooltipSx = {
  position: "absolute",
  top: 0,
  left: 0,
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity 0.12s ease",
  bgcolor: "surface.overlay",
  border: "1px solid",
  borderColor: "surface.border",
  borderRadius: "8px",
  boxShadow: 4,
  px: 1.5,
  py: 1.125,
  minWidth: 180,
  maxWidth: LINE_CHART.TOOLTIP_MAX_WIDTH,
  zIndex: 2,
  fontSize: "0.75rem",
  "& .tt-title": { fontWeight: 700, fontSize: "0.8125rem", mb: 0.75 },
  "& .tt-row": {
    display: "grid",
    gridTemplateColumns: "10px auto 1fr",
    columnGap: "8px",
    alignItems: "center",
    py: "2px",
  },
  "& .tt-low": { opacity: 0.55 },
  "& .tt-swatch": { width: 10, height: 3, borderRadius: "2px" },
  "& .tt-label": { color: "text.secondary", whiteSpace: "nowrap" },
  "& .tt-value": { fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" },
  "& .tt-detail": { gridColumn: "2 / 4", color: "text.disabled", fontSize: "0.6875rem", mt: "-2px" },
  "& .tt-normal": {
    mt: 0.75,
    pt: 0.75,
    borderTop: "1px solid",
    borderColor: "surface.border",
    color: "text.secondary",
  },
} as const;

/** 연도 겹침·추이 선 차트 */
const LineChart = ({ query, result }: LineChartProps) => {
  const theme = useTheme();
  const model = buildLineChartModel(result, query);
  const colorOf = (series: ChartSeries) => resolveSeriesColor(series, query.groupBy, theme);

  const { containerRef, svgRef, tooltipRef, height } = useDrawLineChart({
    model,
    query,
    axis: result.axis,
    seasonStarts: result.seasonStarts,
    colorOf,
    theme,
  });

  /** 시즌 겹침은 최근 시즌부터, 나머지는 집계 순서 그대로 */
  const legendSeries =
    query.groupBy === "year" ? [...model.series].sort((a, b) => b.key.localeCompare(a.key)) : model.series;

  return (
    <Box>
      <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
        <svg
          ref={svgRef}
          role="img"
          aria-label={`${METRIC_LABELS[query.metric]} 선 차트, 시리즈 ${model.series.length}개`}
          style={{ display: "block", height }}
        />
        <Box ref={tooltipRef} sx={tooltipSx} aria-hidden />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          columnGap: 2,
          rowGap: 0.75,
          px: { xs: 1.75, sm: 2.25 },
          pt: 1,
        }}
      >
        {legendSeries.map((series) => (
          <LegendItem
            key={series.key}
            color={colorOf(series)}
            label={series.label}
            variant="line"
            opacity={series.opacity}
            bold={series.role === "focus"}
          />
        ))}
        {model.band ? (
          <>
            <LegendItem color={theme.palette.text.secondary} label="평년 중앙값" variant="dashed" />
            <LegendItem color={theme.palette.text.secondary} label="평년 범위 (P25–P75)" variant="band" />
          </>
        ) : null}
      </Box>
    </Box>
  );
};

export default LineChart;
