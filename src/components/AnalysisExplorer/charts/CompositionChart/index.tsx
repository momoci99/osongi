import { Box, Typography, useTheme } from "@mui/material";
import useDrawCompositionChart from "./useDrawCompositionChart";
import { chartTooltipSx } from "../chartTooltip";
import { GRADE_OPTIONS } from "../../../../const/Common";
import { buildCompositionModel } from "../../../../utils/analysisQuery/compositionModel";
import type { AnalysisQuery, AnalysisResultCore } from "../../../../utils/analysisQuery/types";

type CompositionChartProps = {
  query: AnalysisQuery;
  result: AnalysisResultCore;
};

/** 등급 구성 뷰 — 구간별 등급 물량 비중 */
const CompositionChart = ({ query, result }: CompositionChartProps) => {
  const theme = useTheme();
  const columns = buildCompositionModel(result);
  const { containerRef, svgRef, tooltipRef, height } = useDrawCompositionChart({
    columns,
    axis: result.axis,
    granularity: query.granularity,
    theme,
  });
  const presentGrades = new Set(columns.flatMap((column) => column.segments.map((segment) => segment.grade)));

  return (
    <Box>
      <Box ref={containerRef} sx={{ position: "relative", width: "100%", px: { xs: 0.5, sm: 1 } }}>
        <svg
          ref={svgRef}
          role="img"
          aria-label={`등급 구성 누적 막대, 구간 ${columns.length}개`}
          style={{ display: "block", height }}
        />
        <Box ref={tooltipRef} sx={chartTooltipSx} aria-hidden />
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: 0.75, px: { xs: 1.75, sm: 2.25 }, pt: 1 }}>
        {GRADE_OPTIONS.filter((option) => presentGrades.has(option.value)).map((option) => (
          <Box key={option.value} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: theme.palette.chart[option.value] }} />
            <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              {option.label}
            </Typography>
          </Box>
        ))}
        <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.disabled" }}>
          막대 안 숫자는 비중(%) · 1등품이 아래
        </Typography>
      </Box>
    </Box>
  );
};

export default CompositionChart;
