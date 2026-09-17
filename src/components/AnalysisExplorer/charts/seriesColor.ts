import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { REGION_UNION_MAP } from "../../../const/Common";
import { UNION_LIGHTNESS_SPREAD } from "../../../const/AnalysisCharts";
import { findRegionOfUnion, regionColor } from "../../../const/Regions";
import type { ChartSeries } from "../../../utils/analysisQuery/lineChartModel";
import type { AnalysisGroupBy, GradeKey } from "../../../utils/analysisQuery/types";


/**
 * 조합 색 — 지역 색조를 유지하고 지역 내 순번으로 밝기만 달리한다.
 * 조합이 21곳이라 고유 색상을 따로 두면 범주 색 한계를 넘는다.
 */
const unionColor = (union: string): string => {
  const region = findRegionOfUnion(union);
  if (!region) return "gray";
  const unions = REGION_UNION_MAP[region];
  const color = d3.hsl(regionColor(region));
  const step = unions.length > 1 ? UNION_LIGHTNESS_SPREAD / (unions.length - 1) : 0;
  color.l += (unions.indexOf(union) - (unions.length - 1) / 2) * step;
  return color.formatHex();
};

/**
 * 시리즈 색. 색은 순위가 아니라 대상을 따른다 —
 * 필터로 시리즈 수가 바뀌어도 남은 시리즈 색은 그대로다.
 */
export const resolveSeriesColor = (
  series: Pick<ChartSeries, "colorKey" | "role">,
  groupBy: AnalysisGroupBy,
  theme: Theme,
): string => {
  if (series.role === "focus") return theme.palette.primary.main;
  if (series.role === "context") return theme.palette.text.secondary;
  switch (groupBy) {
    case "region":
      return regionColor(series.colorKey);
    case "grade":
      return theme.palette.chart[series.colorKey as GradeKey];
    case "union":
      return unionColor(series.colorKey);
    default:
      return theme.palette.primary.main;
  }
};
