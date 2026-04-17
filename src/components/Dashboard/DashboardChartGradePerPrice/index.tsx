import { useTheme } from "@mui/material/styles";
import useDrawGradeBarPrice from "./useDrawGradeBarPrice";

export type { PriceDatum } from "./chartHelpers";

type DashboardChartGradePerPriceProps = {
  data: { gradeKey: string; unitPriceWon: number }[];
  height?: number;
  yMaxOverride?: number;
  labelYOffset?: number;
};

/**
 * 등급별 평균 단가(원) 막대 차트의 레이아웃을 관리합니다.
 */
const DashboardChartGradePerPrice = ({
  data,
  height = 350,
  yMaxOverride,
  labelYOffset = 4,
}: DashboardChartGradePerPriceProps) => {
  const theme = useTheme();
  const { containerRef, svgRef } = useDrawGradeBarPrice({
    data,
    height,
    yMaxOverride,
    labelYOffset,
    theme,
  });

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <svg ref={svgRef} role="img" aria-label="등급별 평균 단가 막대 차트" />
    </div>
  );
};

export default DashboardChartGradePerPrice;
