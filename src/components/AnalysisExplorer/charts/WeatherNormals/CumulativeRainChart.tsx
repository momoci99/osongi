import { Box, useTheme } from "@mui/material";
import { chartTooltipSx } from "../chartTooltip";
import useDrawCumulativeRain from "./useDrawCumulativeRain";
import type { CumulativeRainModel } from "../../../../utils/weather/weatherNormals";

type CumulativeRainChartProps = {
  model: CumulativeRainModel;
  selectedYear: number;
};

/** (b) 7월 1일부터 쌓인 강수 */
const CumulativeRainChart = ({ model, selectedYear }: CumulativeRainChartProps) => {
  const theme = useTheme();
  const { containerRef, svgRef, tooltipRef } = useDrawCumulativeRain({ model, selectedYear, theme });
  return (
    <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
      <svg
        ref={svgRef}
        role="img"
        aria-label={`${selectedYear} 시즌 7월부터의 누적 강수와 역대 범위`}
        style={{ display: "block" }}
      />
      <Box ref={tooltipRef} sx={chartTooltipSx} aria-hidden />
    </Box>
  );
};

export default CumulativeRainChart;
