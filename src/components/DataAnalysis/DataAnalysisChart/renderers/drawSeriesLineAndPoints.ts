import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import type { WeeklyPriceDatum } from "../../../../types/data";
import type { AnalysisSeries } from "../seriesBuilder";

export type DrawSeriesParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  series: AnalysisSeries;
  xScale: d3.ScaleTime<number, number>;
  globalYScale: d3.ScaleLinear<number, number>;
  yValue: (d: WeeklyPriceDatum) => number;
  isMobile: boolean;
  theme: Theme;
};

/** 시리즈별 라인 + 포인트 */
export const drawSeriesLineAndPoints = ({
  subplotGroup,
  series,
  xScale,
  globalYScale,
  yValue,
  isMobile,
  theme,
}: DrawSeriesParams) => {
  const seriesKey = `${series.region}-${series.gradeKey}`;

  if (series.data.length > 1) {
    const line = d3
      .line<WeeklyPriceDatum>()
      .x((d) => xScale(new Date(d.date)))
      .y((d) => globalYScale(yValue(d)))
      .curve(d3.curveMonotoneX);

    subplotGroup
      .append("path")
      .datum(series.data)
      .attr("data-series-key", seriesKey)
      .attr("fill", "none")
      .attr("stroke", series.color)
      .attr("stroke-width", isMobile ? 1.5 : 2)
      .attr("stroke-opacity", 0.8)
      .attr("stroke-dasharray", series.dashPattern)
      .attr("d", line);
  }

  series.data.forEach((d) => {
    subplotGroup
      .append("circle")
      .attr("data-series-key", seriesKey)
      .attr("cx", xScale(new Date(d.date)))
      .attr("cy", globalYScale(yValue(d)))
      .attr("r", isMobile ? 2 : 3)
      .attr("fill", series.color)
      .attr("stroke", theme.palette.background.paper)
      .attr("stroke-width", 1)
      .style("pointer-events", "none");
  });
};

export default drawSeriesLineAndPoints;
