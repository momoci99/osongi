import * as d3 from "d3";
import { Box, Typography, useTheme } from "@mui/material";
import useDrawHeatmap from "./useDrawHeatmap";
import { chartTooltipSx } from "../chartTooltip";
import { HEATMAP } from "../../../../const/AnalysisLayout";
import { SEASON_NOTES } from "../../../../const/Analysis";
import { buildHeatmapModel, type HeatmapCell } from "../../../../utils/analysisQuery/heatmapModel";
import { formatAxisTick } from "../../../../utils/analysisQuery/format";
import type { AnalysisQuery, AnalysisResult } from "../../../../utils/analysisQuery/types";

type HeatmapProps = {
  query: AnalysisQuery;
  result: AnalysisResult;
  onSelectSeason: (year: number) => void;
};

/**
 * 시즌 × 날짜 히트맵.
 * 크기는 한 색조의 명도로만 인코딩한다(순차 팔레트). 물량은 쏠림이 커서 제곱근 스케일.
 */
const Heatmap = ({ query, result, onSelectSeason }: HeatmapProps) => {
  const theme = useTheme();
  const model = buildHeatmapModel(result, query);
  const accent = query.metric === "unitPrice" ? theme.palette.chart.price.main : theme.palette.primary.main;
  const rampStart = d3.interpolateRgb(theme.palette.surface.raised, accent)(HEATMAP.RAMP_START);
  const interpolate = d3.interpolateRgb(rampStart, accent);
  const colorScale =
    query.metric === "unitPrice"
      ? d3.scaleSequential(interpolate).domain(model.valueDomain)
      : d3.scaleSequentialSqrt(interpolate).domain(model.valueDomain);

  const { containerRef, svgRef, tooltipRef } = useDrawHeatmap({
    model,
    query,
    axis: result.axis,
    colorScale: (value) => colorScale(value),
    theme,
    onCellClick: (cell: HeatmapCell) => onSelectSeason(cell.year),
  });

  const hasNotes = query.groupBy === "year" && model.rows.some((row) => SEASON_NOTES[row.year]);

  return (
    <Box>
      <Box ref={containerRef} sx={{ position: "relative", overflowX: "auto", px: { xs: 0.5, sm: 1 } }}>
        <svg ref={svgRef} role="img" aria-label={`시즌 ${model.rows.length}개 히트맵`} style={{ display: "block" }} />
        <Box ref={tooltipRef} sx={chartTooltipSx} aria-hidden />
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          px: { xs: 1.75, sm: 2.25 },
          pt: 1.25,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
            {formatAxisTick(query.metric, model.valueDomain[0])}
          </Typography>
          <Box
            sx={{
              width: HEATMAP.LEGEND_WIDTH,
              height: HEATMAP.LEGEND_HEIGHT,
              borderRadius: "4px",
              background: `linear-gradient(90deg, ${rampStart}, ${accent})`,
            }}
          />
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
            {formatAxisTick(query.metric, model.valueDomain[1])}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>
          빈칸은 공판 없음 · 칸을 누르면 그 시즌 추이로 이동
          {hasNotes ? " · • 이상 시즌" : ""}
        </Typography>
      </Box>
    </Box>
  );
};

export default Heatmap;
