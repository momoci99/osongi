import { Box, useTheme } from "@mui/material";
import { chartTooltipSx } from "../chartTooltip";
import useDrawMonthlyStrips from "./useDrawMonthlyStrips";
import type { MetricStrips } from "../../../../utils/weather/weatherNormals";

type MonthlyStripsChartProps = {
  strips: MetricStrips[];
  selectedYear: number;
};

/** (a) 월별 점 분포 */
const MonthlyStripsChart = ({ strips, selectedYear }: MonthlyStripsChartProps) => {
  const theme = useTheme();
  const { containerRef, svgRef, tooltipRef } = useDrawMonthlyStrips({ strips, selectedYear, theme });
  return (
    <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
      <svg
        ref={svgRef}
        role="img"
        aria-label={`${selectedYear} 시즌의 달별 강수·기온·지면온도를 역대 시즌과 비교`}
        style={{ display: "block" }}
      />
      <Box ref={tooltipRef} sx={chartTooltipSx} aria-hidden />
    </Box>
  );
};

export default MonthlyStripsChart;
