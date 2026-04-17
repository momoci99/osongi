import useDrawGradeBarKg from "./useDrawGradeBarKg";
import { useTheme } from "@mui/material/styles";

export type { ChartDatum } from "./chartHelpers";

type DashboardChartGradePerKgProps = {
  data: { gradeKey: string; quantityKg: number }[];
  height?: number;
  yMaxOverride?: number;
  labelYOffset?: number;
};

/**
 * 등급별 무게(kg) 막대 차트의 레이아웃을 관리합니다.
 */
const DashboardChartGradePerKg = ({
  data,
  height = 350,
  yMaxOverride,
  labelYOffset = 4,
}: DashboardChartGradePerKgProps) => {
  const theme = useTheme();
  const { containerRef, svgRef } = useDrawGradeBarKg({
    data,
    height,
    yMaxOverride,
    labelYOffset,
    theme,
  });

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <svg ref={svgRef} role="img" aria-label="등급별 무게 막대 차트" />
    </div>
  );
};

export default DashboardChartGradePerKg;
