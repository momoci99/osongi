import { Box, Typography, useTheme } from "@mui/material";
import DashboardCard from "../../Dashboard/DashboardCard";
import ScopeSectionHeading from "../ScopeSectionHeading";
import useDrawYearlyTrend from "./useDrawYearlyTrend";
import FireEventList from "./FireEventList";
import { YEARLY_TREND_CHART } from "../../../const/Charts";
import type { YearStat } from "../../../types/region";
import type { FireEvent } from "../../../utils/wildfire/unionFires";

type ScopeYearlyChartProps = {
  yearly: YearStat[];
  /** 아직 끝나지 않은 시즌 연도 */
  ongoingYear?: number;
  scopeName: string;
  /** 이 범위 조합들의 대형 산불 */
  fires?: FireEvent[];
  height?: number;
};

type LegendShape = "bar" | "line" | "dot";

type LegendItemProps = {
  color: string;
  label: string;
  shape: LegendShape;
};

const LEGEND_SWATCH: Record<LegendShape, { width: number; height: number; borderRadius: string | number }> = {
  bar: { width: 12, height: 12, borderRadius: "2px" },
  line: { width: 12, height: 2, borderRadius: 0 },
  dot: { width: 8, height: 8, borderRadius: "50%" },
};

/** 기본값 배열을 모듈에 두어 매 렌더 새 배열이 차트를 다시 그리게 하지 않는다 */
const NO_FIRES: FireEvent[] = [];

const LegendItem = ({ color, label, shape }: LegendItemProps) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
    <Box sx={{ ...LEGEND_SWATCH[shape], bgcolor: color }} />
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
      {label}
    </Typography>
  </Box>
);

/** 연도별 공판량·평균 단가 추이 (D3) */
const ScopeYearlyChart = ({
  yearly,
  ongoingYear,
  scopeName,
  fires = NO_FIRES,
  height = YEARLY_TREND_CHART.HEIGHT,
}: ScopeYearlyChartProps) => {
  const theme = useTheme();
  const { containerRef, svgRef } = useDrawYearlyTrend({
    yearly,
    ongoingYear,
    fires,
    height,
    theme,
  });
  const firstYear = yearly[0]?.year;
  const lastYear = yearly[yearly.length - 1]?.year;
  /** 차트 연도 범위 밖(공판 기록 이전) 산불은 목록에서도 뺀다 */
  const visibleFires = fires.filter(
    (event) => firstYear !== undefined && event.seasonYear >= firstYear && event.seasonYear <= lastYear
  );

  return (
    <Box>
      <ScopeSectionHeading
        title={`연도별 공판 추이${firstYear ? ` (${firstYear}~${lastYear})` : ""}`}
        action={
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <LegendItem
              color={theme.palette.chart.weight.main}
              label="공판량(톤)"
              shape="bar"
            />
            <LegendItem
              color={theme.palette.chart.price.main}
              label="평균 단가(원/kg)"
              shape="line"
            />
            {visibleFires.length > 0 ? (
              <LegendItem color={theme.palette.chart.fire} label="대형 산불" shape="dot" />
            ) : null}
          </Box>
        }
      />
      <DashboardCard>
        {/** 막대가 최소 폭을 못 지키는 좁은 화면에서는 SVG가 컨테이너보다 넓어져 가로로 스크롤된다 */}
        <Box
          ref={containerRef}
          sx={{
            width: "100%",
            position: "relative",
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <svg
            ref={svgRef}
            role="img"
            aria-label={`${scopeName} 연도별 공판량과 평균 단가 추이 차트`}
          />
        </Box>
        {visibleFires.length > 0 ? <FireEventList events={visibleFires} /> : null}
      </DashboardCard>
    </Box>
  );
};

export default ScopeYearlyChart;
