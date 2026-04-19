import { type RefObject } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import type { WeeklyPriceDatum } from "../../../../types/data";
import type { MovingAverageDatum } from "../../../../utils/analysis/statistics";
import { CHART_MARGINS } from "../../../../const/Numbers";
import type { ChartMode } from "../seriesBuilder";
import { buildYearSeries } from "../seriesBuilder";
import { drawSeriesLineAndPoints } from "./drawSeriesLineAndPoints";
import { drawMAOverlay } from "./drawMAOverlay";
import { drawExtremeMarkers } from "./drawExtremeMarkers";
import { drawSubplotCrosshair } from "./drawSubplotCrosshair";

export type DrawSubplotParams = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  yearData: WeeklyPriceDatum[];
  year: number;
  yearIndex: number;
  xOffset: number;
  subplotWidth: number;
  subplotHeight: number;
  globalYScale: d3.ScaleLinear<number, number>;
  colorScale: d3.ScaleOrdinal<string, string>;
  yValue: (d: WeeklyPriceDatum) => number;
  mode: ChartMode;
  isMobile: boolean;
  fontSize: { title: string; axis: string; legend: string; message: string };
  theme: Theme;
  yearMAData: MovingAverageDatum[];
  showMA: boolean;
  showMarkers: boolean;
  hiddenSeriesRef: RefObject<Set<string>>;
};

/** 연도별 서브플롯을 그립니다. */
export const drawSubplot = ({
  svg,
  yearData,
  year,
  yearIndex,
  xOffset,
  subplotWidth,
  subplotHeight,
  globalYScale,
  colorScale,
  yValue,
  mode,
  isMobile,
  fontSize,
  theme,
  yearMAData,
  showMA,
  showMarkers,
  hiddenSeriesRef,
}: DrawSubplotParams) => {
  const yearDates = yearData
    .map((d) => new Date(d.date))
    .sort((a, b) => a.getTime() - b.getTime());
  const dateExtent = d3.extent(yearDates) as [Date, Date];
  const xScale = d3.scaleTime().domain(dateExtent).range([0, subplotWidth]);

  const subplotGroup = svg
    .append("g")
    .attr("transform", `translate(${xOffset}, ${CHART_MARGINS.TOP})`);

  subplotGroup
    .append("text")
    .attr("x", subplotWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", fontSize.title)
    .style("font-weight", "bold")
    .style("fill", theme.palette.text.primary)
    .text(`${year}년`);

  const uniqueDates = [...new Set(yearData.map((d) => d.date))]
    .sort()
    .map((s) => new Date(s));

  const dataSpanDays = uniqueDates.length;
  let tickInterval = 1;
  if (dataSpanDays > 15) {
    tickInterval = Math.ceil(dataSpanDays / (isMobile ? 3 : 5));
  } else if (dataSpanDays > 7) {
    tickInterval = isMobile ? 3 : 2;
  } else {
    tickInterval = isMobile ? 2 : 1;
  }
  const selectedTicks = uniqueDates.filter((_, i) => i % tickInterval === 0);

  const xAxis = d3
    .axisBottom(xScale)
    .tickValues(selectedTicks)
    .tickFormat((d) => d3.timeFormat("%m/%d")(d as Date));

  subplotGroup
    .append("g")
    .attr("transform", `translate(0, ${subplotHeight})`)
    .call(xAxis)
    .selectAll("text")
    .style("fill", theme.palette.text.primary)
    .style("font-size", fontSize.axis);

  if (yearIndex === 0) {
    const yAxis = d3
      .axisLeft(globalYScale)
      .ticks(isMobile ? 5 : 8)
      .tickFormat((d) => `${d}${mode === "price" ? "원" : "kg"}`);

    subplotGroup
      .append("g")
      .call(yAxis)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", fontSize.axis);
  }

  const seriesList = buildYearSeries(yearData, colorScale);
  seriesList.forEach((series) => {
    drawSeriesLineAndPoints({
      subplotGroup,
      series,
      xScale,
      globalYScale,
      yValue,
      isMobile,
      theme,
    });
  });

  if (showMA && yearMAData.length > 0) {
    seriesList.forEach((series) => {
      drawMAOverlay({
        subplotGroup,
        series,
        xScale,
        globalYScale,
        yearMAData,
        isMobile,
      });
    });
  }

  if (showMarkers) {
    drawExtremeMarkers({
      subplotGroup,
      seriesList,
      xScale,
      globalYScale,
      yValue,
      mode,
      isMobile,
      theme,
    });
  }

  drawSubplotCrosshair({
    subplotGroup,
    yearData,
    seriesList,
    xScale,
    yValue,
    subplotWidth,
    subplotHeight,
    isMobile,
    theme,
    hiddenSeriesRef,
  });
};

export default drawSubplot;
