import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import type { WeeklyPriceDatum } from "../../../../types/data";
import type { AnalysisSeries, ChartMode } from "../seriesBuilder";

export type DrawExtremeMarkersParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  seriesList: AnalysisSeries[];
  xScale: d3.ScaleTime<number, number>;
  globalYScale: d3.ScaleLinear<number, number>;
  yValue: (d: WeeklyPriceDatum) => number;
  mode: ChartMode;
  isMobile: boolean;
  theme: Theme;
};

/** 각 시리즈의 최고/최저 포인트에 마커를 표시합니다. */
export const drawExtremeMarkers = ({
  subplotGroup,
  seriesList,
  xScale,
  globalYScale,
  yValue,
  mode,
  isMobile,
  theme,
}: DrawExtremeMarkersParams) => {
  const markerFontSize = isMobile ? "8px" : "10px";
  const markerOffset = isMobile ? 10 : 14;

  seriesList.forEach((series) => {
    if (series.data.length < 2) return;
    const seriesKey = `${series.region}-${series.gradeKey}`;

    let maxPoint = series.data[0];
    let minPoint = series.data[0];
    series.data.forEach((d) => {
      if (yValue(d) > yValue(maxPoint)) maxPoint = d;
      if (yValue(d) < yValue(minPoint)) minPoint = d;
    });

    if (yValue(maxPoint) === yValue(minPoint)) return;

    const drawMarker = (point: WeeklyPriceDatum, type: "max" | "min") => {
      const cx = xScale(new Date(point.date));
      const cy = globalYScale(yValue(point));
      const isMax = type === "max";
      const symbol = isMax ? "▲" : "▼";
      const yOffset = isMax ? -markerOffset : markerOffset;

      const markerGroup = subplotGroup
        .append("g")
        .attr("data-series-key", seriesKey)
        .attr("class", "extreme-marker");

      markerGroup
        .append("text")
        .attr("x", cx)
        .attr("y", cy + yOffset)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", isMax ? "auto" : "hanging")
        .style("font-size", markerFontSize)
        .style("fill", series.color)
        .style("pointer-events", "none")
        .text(symbol);

      const value = yValue(point);
      const unit = mode === "price" ? "원" : "kg";
      const label =
        value >= 10000
          ? `${(value / 10000).toFixed(1)}만${unit}`
          : `${value.toLocaleString()}${unit}`;

      markerGroup
        .append("text")
        .attr("x", cx)
        .attr("y", cy + yOffset + (isMax ? -10 : 10))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", isMax ? "auto" : "hanging")
        .style("font-size", markerFontSize)
        .style("fill", theme.palette.text.primary)
        .style("font-weight", "600")
        .style("pointer-events", "none")
        .text(label);
    };

    drawMarker(maxPoint, "max");
    drawMarker(minPoint, "min");
  });
};

export default drawExtremeMarkers;
