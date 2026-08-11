import { Box } from "@mui/material";
import { REGION_SPARKLINE } from "../../const/RegionLayout";
import { buildSparkPaths } from "../../utils/d3/sparkPath";
import type { YearStat } from "../../types/region";

type RegionSparklineProps = {
  yearly: YearStat[];
  /** 지역 식별 색 */
  color: string;
};

/**
 * 지역 카드의 연도별 단가 스파크라인.
 *
 * 카드 오른쪽 절반이 비어 있어 3장이면 660px가 죽은 면적이었다.
 * 그 자리에 추이를 넣어 카드가 지역 요약 역할을 하게 한다.
 */
const RegionSparkline = ({ yearly, color }: RegionSparklineProps) => {
  const points = yearly
    .slice(-REGION_SPARKLINE.MAX_YEARS)
    .map((entry) => entry.avgPricePerKg);
  const paths = buildSparkPaths(points);

  if (!paths) return null;

  return (
    <Box
      component="svg"
      aria-hidden
      viewBox={`0 0 ${REGION_SPARKLINE.WIDTH} ${REGION_SPARKLINE.HEIGHT}`}
      width={REGION_SPARKLINE.WIDTH}
      height={REGION_SPARKLINE.HEIGHT}
      sx={{ display: "block", overflow: "visible" }}
    >
      <path d={paths.area} fill={color} opacity={REGION_SPARKLINE.AREA_OPACITY} />
      <path
        d={paths.line}
        fill="none"
        stroke={color}
        strokeWidth={REGION_SPARKLINE.LINE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={paths.lastX}
        cy={paths.lastY}
        r={REGION_SPARKLINE.DOT_RADIUS}
        fill={color}
      />
    </Box>
  );
};

export default RegionSparkline;
