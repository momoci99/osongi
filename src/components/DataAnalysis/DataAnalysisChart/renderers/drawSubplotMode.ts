import { type RefObject } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import type { WeeklyPriceDatum } from "../../../../types/data";
import type { MovingAverageDatum } from "../../../../utils/analysis/statistics";
import { buildColorScale, collectLegendItems } from "../seriesBuilder";
import type { ChartMode } from "../seriesBuilder";
import { drawSubplot } from "./drawSubplot";
import { drawLegend } from "./drawLegend";

export type DrawSubplotModeParams = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  containerWidth: number;
  chartHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
  fontSize: { title: string; axis: string; legend: string; message: string };
  years: number[];
  yearGroups: Map<number, WeeklyPriceDatum[]>;
  seasonData: WeeklyPriceDatum[];
  yValue: (d: WeeklyPriceDatum) => number;
  mode: ChartMode;
  maData: MovingAverageDatum[];
  showMA: boolean;
  showMarkers: boolean;
  isMobile: boolean;
  theme: Theme;
  hiddenSeriesRef: RefObject<Set<string>>;
  onToggleSeries: (seriesKey: string) => void;
};

/** Subplot 모드 차트를 그립니다. 총 SVG 높이를 반환합니다. */
export const drawSubplotMode = ({
  svg,
  containerWidth,
  chartHeight,
  margin,
  fontSize,
  years,
  yearGroups,
  seasonData,
  yValue,
  mode,
  maData,
  showMA,
  showMarkers,
  isMobile,
  theme,
  hiddenSeriesRef,
  onToggleSeries,
}: DrawSubplotModeParams): number => {
  const yearCount = years.length;
  const subplotGap = isMobile ? 20 : 40;
  const subplotWidth =
    (containerWidth - margin.left - margin.right - (yearCount - 1) * subplotGap) /
    yearCount;
  const subplotHeight = chartHeight - margin.top - margin.bottom;

  const yExtent = d3.extent(seasonData, yValue) as [number, number];
  const globalYScale = d3
    .scaleLinear()
    .domain([0, yExtent[1] * 1.1])
    .range([subplotHeight, 0]);

  const colorScale = buildColorScale(seasonData, theme);

  const filteredMAData = maData.filter((d) => {
    const month = new Date(d.date).getMonth() + 1;
    return month >= 8 && month <= 12;
  });

  years.forEach((year, yearIndex) => {
    const yearData = yearGroups.get(year)!;
    const xOffset = margin.left + yearIndex * (subplotWidth + subplotGap);
    const yearMAData = filteredMAData.filter(
      (d) => new Date(d.date).getFullYear() === year,
    );
    drawSubplot({
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
    });
  });

  const legendItems = collectLegendItems(yearGroups, colorScale);
  const legendTop = margin.top + subplotHeight + margin.bottom + 4;
  const availableWidth = containerWidth - margin.left - margin.right;

  return drawLegend({
    svg,
    items: legendItems,
    legendTop,
    marginLeft: margin.left,
    availableWidth,
    isMobile,
    fontSize,
    theme,
    onLegendClick: onToggleSeries,
  });
};

export default drawSubplotMode;
