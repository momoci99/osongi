import { Box, Typography, useTheme } from "@mui/material";
import DashboardCard from "../../Dashboard/DashboardCard";
import useDrawYearlyTrend from "./useDrawYearlyTrend";
import { YEARLY_TREND_CHART } from "../../../const/Charts";
import type { YearStat } from "../../../types/region";

type ScopeYearlyChartProps = {
  yearly: YearStat[];
  scopeName: string;
  height?: number;
};

type LegendItemProps = {
  color: string;
  label: string;
  shape: "bar" | "line";
};

const LegendItem = ({ color, label, shape }: LegendItemProps) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
    <Box
      sx={{
        width: 12,
        height: shape === "bar" ? 12 : 2,
        borderRadius: shape === "bar" ? "2px" : 0,
        bgcolor: color,
      }}
    />
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
      {label}
    </Typography>
  </Box>
);

/** 연도별 공판량·평균 단가 추이 (D3) */
const ScopeYearlyChart = ({
  yearly,
  scopeName,
  height = YEARLY_TREND_CHART.HEIGHT,
}: ScopeYearlyChartProps) => {
  const theme = useTheme();
  const { containerRef, svgRef } = useDrawYearlyTrend({ yearly, height, theme });
  const firstYear = yearly[0]?.year;
  const lastYear = yearly[yearly.length - 1]?.year;

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Typography
          component="h2"
          variant="h6"
          sx={{ fontWeight: 700, fontSize: "1rem" }}
        >
          연도별 공판 추이 {firstYear && `(${firstYear}~${lastYear})`}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
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
        </Box>
      </Box>
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
      </DashboardCard>
    </Box>
  );
};

export default ScopeYearlyChart;
