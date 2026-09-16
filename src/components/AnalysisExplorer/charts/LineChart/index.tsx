import { Box, Typography, useTheme } from "@mui/material";
import useDrawLineChart from "./useDrawLineChart";
import { chartTooltipSx } from "../chartTooltip";
import { resolveSeriesColor } from "../seriesColor";
import { buildLineChartModel, type ChartSeries } from "../../../../utils/analysisQuery/lineChartModel";
import { METRIC_LABELS } from "../../../../utils/analysisQuery/labels";
import type { AnalysisQuery, AnalysisResult } from "../../../../utils/analysisQuery/types";

type LineChartProps = {
  query: AnalysisQuery;
  result: AnalysisResult;
  /** 전년 비교 결과 (점선으로 겹침) */
  comparison?: AnalysisResult | null;
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

/** 연도 겹침·추이 선 차트 */
const LineChart = ({ query, result, comparison = null }: LineChartProps) => {
  const theme = useTheme();
  const model = buildLineChartModel(result, query, comparison);
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
        <Box ref={tooltipRef} sx={chartTooltipSx} aria-hidden />
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
            variant={series.role === "comparison" ? "dashed" : "line"}
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
