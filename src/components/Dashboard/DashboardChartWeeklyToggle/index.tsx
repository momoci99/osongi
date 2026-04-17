import { useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { WeeklyPriceDatum } from "../../../types/data";
import { useContainerWidth } from "../../../utils/d3/useContainerSize";
import useDrawWeeklyToggle from "./useDrawWeeklyToggle";
import type { ChartMode } from "./seriesBuilder";

export type DashboardChartWeeklyToggleProps = {
  data: WeeklyPriceDatum[];
  height?: number;
};

/**
 * 주간 가격/수량 토글 차트의 레이아웃과 상태를 관리합니다.
 */
const DashboardChartWeeklyToggle = ({
  data,
  height = 400,
}: DashboardChartWeeklyToggleProps) => {
  const theme = useTheme();
  const { containerRef, width: containerWidth } = useContainerWidth();
  const [chartMode, setChartMode] = useState<ChartMode>("price");
  const { svgRef } = useDrawWeeklyToggle({
    data,
    height,
    theme,
    containerWidth,
    chartMode,
  });

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ChartMode | null
  ) => {
    if (newMode !== null) {
      setChartMode(newMode);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <ToggleButtonGroup
          value={chartMode}
          exclusive
          onChange={handleModeChange}
          size="small"
        >
          <ToggleButton value="price">가격</ToggleButton>
          <ToggleButton value="quantity">수량</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <div ref={containerRef} style={{ width: "100%" }}>
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          style={{ display: "block" }}
        />
      </div>
    </Box>
  );
};

export default DashboardChartWeeklyToggle;
