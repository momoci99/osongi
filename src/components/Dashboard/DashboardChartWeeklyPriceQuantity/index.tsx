import { useTheme } from "@mui/material/styles";
import type { WeeklyPriceDatum } from "../../../types/data";
import { useContainerWidth } from "../../../utils/d3/useContainerSize";
import useDrawPriceQuantity from "./useDrawPriceQuantity";

export type DashboardChartWeeklyPriceQuantityProps = {
  data: WeeklyPriceDatum[];
  height?: number;
  showQuantity?: boolean;
};

/**
 * 주간 가격/수량 이중축 차트의 레이아웃을 관리합니다.
 */
const DashboardChartWeeklyPriceQuantity = ({
  data,
  height = 400,
  showQuantity = true,
}: DashboardChartWeeklyPriceQuantityProps) => {
  const theme = useTheme();
  const { containerRef, width: containerWidth } = useContainerWidth();
  const { svgRef } = useDrawPriceQuantity({
    data,
    height,
    theme,
    containerWidth,
    showQuantity,
  });

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ display: "block" }}
      />
    </div>
  );
};

export default DashboardChartWeeklyPriceQuantity;
