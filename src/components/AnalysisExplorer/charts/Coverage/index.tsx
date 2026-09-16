import * as d3 from "d3";
import { Box, Typography, useTheme } from "@mui/material";
import { COVERAGE_MATRIX } from "../../../../const/AnalysisLayout";
import { buildCoverage } from "../../../../utils/analysisQuery/seasonTables";
import type { AnalysisResult } from "../../../../utils/analysisQuery/types";
import { chartTooltipSx } from "../chartTooltip";
import useDrawCoverage from "./useDrawCoverage";

type CoverageProps = {
  result: AnalysisResult;
};

/** 조합별 시즌 공판일 커버리지 행렬 */
const Coverage = ({ result }: CoverageProps) => {
  const theme = useTheme();
  const coverage = buildCoverage(result.rows);
  const maxValue = Math.max(...coverage.cells.map((cell) => cell.tradingDays), 0);
  const rampStart = d3.interpolateRgb(theme.palette.surface.raised, theme.palette.primary.main)(COVERAGE_MATRIX.RAMP_START);
  const interpolate = d3.interpolateRgb(rampStart, theme.palette.primary.main);
  const colorScale = d3.scaleSequential(interpolate).domain([0, Math.max(1, maxValue)]);
  const { containerRef, svgRef, tooltipRef } = useDrawCoverage({ coverage, colorScale: (value) => colorScale(value), theme });

  return (
    <Box>
      <Box ref={containerRef} sx={{ position: "relative", overflowX: "auto", px: { xs: 0.5, sm: 1 } }}>
        <svg ref={svgRef} role="img" aria-label={`조합 ${coverage.unions.length}개 시즌 커버리지 행렬`} style={{ display: "block" }} />
        <Box ref={tooltipRef} sx={chartTooltipSx} aria-hidden />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5, px: { xs: 1.75, sm: 2.25 }, pt: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ color: "text.secondary", fontSize: "0.75rem" }}>공판일 적음 → 많음</Typography>
          <Box sx={{ width: COVERAGE_MATRIX.LEGEND_WIDTH, height: COVERAGE_MATRIX.LEGEND_HEIGHT, borderRadius: "4px", background: `linear-gradient(90deg, ${rampStart}, ${theme.palette.primary.main})` }} />
        </Box>
        <Typography sx={{ color: "text.disabled", fontSize: "0.75rem" }}>빈칸은 해당 시즌 공판 없음</Typography>
      </Box>
    </Box>
  );
};

export default Coverage;
