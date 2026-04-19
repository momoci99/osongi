import { type RefObject } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { GradeKeyToKorean } from "../../../../const/Common";
import type { WeeklyPriceDatum } from "../../../../types/data";
import { createD3Tooltip } from "../../../../utils/d3Tooltip";
import {
  normalizeToBaseYear,
  buildOverlayYearSeries,
  YEAR_COLORS,
} from "../seriesBuilder";
import type {
  ChartMode,
  LegendItem,
  OverlaySeries,
  NormalizedDatum,
} from "../seriesBuilder";
import { drawLegend } from "./drawLegend";

export type DrawOverlayModeParams = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  containerWidth: number;
  chartHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
  fontSize: { axis: string; legend: string };
  years: number[];
  yearGroups: Map<number, WeeklyPriceDatum[]>;
  seasonData: WeeklyPriceDatum[];
  yValue: (d: WeeklyPriceDatum) => number;
  mode: ChartMode;
  isMobile: boolean;
  theme: Theme;
  hiddenSeriesRef: RefObject<Set<string>>;
  onToggleSeries: (seriesKey: string) => void;
};

/** Overlay 모드 차트를 그립니다. 총 SVG 높이를 반환합니다. */
export const drawOverlayMode = ({
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
  theme,
  hiddenSeriesRef,
  onToggleSeries,
  isMobile,
}: DrawOverlayModeParams): number => {
  const plotWidth = containerWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  const yearColorScale = d3
    .scaleOrdinal<number, string>()
    .domain(years)
    .range(YEAR_COLORS);

  const allOverlaySeries: OverlaySeries[] = [];
  years.forEach((year) => {
    const yearData = yearGroups.get(year)!;
    const normalized: NormalizedDatum[] = yearData.map((d) => ({
      ...d,
      normalizedDate: normalizeToBaseYear(d.date),
    }));
    allOverlaySeries.push(...buildOverlayYearSeries(normalized, year, yearColorScale));
  });

  const xScale = d3
    .scaleTime()
    .domain([new Date(2000, 7, 1), new Date(2000, 11, 31)])
    .range([0, plotWidth]);

  const yExtent = d3.extent(seasonData, yValue) as [number, number];
  const yScale = d3
    .scaleLinear()
    .domain([0, yExtent[1] * 1.1])
    .range([plotHeight, 0]);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xAxis = d3
    .axisBottom(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat((d) => d3.timeFormat("%-m월")(d as Date));
  g.append("g")
    .attr("transform", `translate(0,${plotHeight})`)
    .call(xAxis)
    .selectAll("text")
    .style("font-size", `${fontSize.axis}px`);

  g.append("g")
    .call(d3.axisLeft(yScale).ticks(5))
    .selectAll("text")
    .style("font-size", `${fontSize.axis}px`);

  g.append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(yScale).ticks(5).tickSize(-plotWidth).tickFormat(() => ""),
    )
    .selectAll("line")
    .attr("stroke", theme.palette.divider)
    .attr("stroke-opacity", 0.3);
  g.select(".grid .domain").remove();

  allOverlaySeries.forEach((series) => {
    const lineGen = d3
      .line<NormalizedDatum>()
      .x((d) => xScale(d.normalizedDate))
      .y((d) => yScale(yValue(d)))
      .defined((d) => yValue(d) != null && !isNaN(yValue(d)));

    g.append("path")
      .datum(series.data)
      .attr("fill", "none")
      .attr("stroke", series.color)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", series.dashPattern)
      .attr("d", lineGen)
      .attr("data-series-key", series.seriesKey)
      .style("pointer-events", "none");
  });

  const overlayRect = g
    .append("rect")
    .attr("width", plotWidth)
    .attr("height", plotHeight)
    .attr("fill", "none")
    .style("pointer-events", "all");

  const crosshairLine = g
    .append("line")
    .attr("stroke", theme.palette.text.secondary)
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3")
    .attr("y1", 0)
    .attr("y2", plotHeight)
    .style("display", "none")
    .style("pointer-events", "none");

  const tooltip = createD3Tooltip(theme);

  overlayRect
    .on("mousemove", (event: MouseEvent) => {
      const [mx] = d3.pointer(event);
      const hoveredDate = xScale.invert(mx);
      crosshairLine.attr("x1", mx).attr("x2", mx).style("display", null);

      const hidden = hiddenSeriesRef.current;
      const visibleSeries = allOverlaySeries.filter(
        (s) => !hidden.has(s.seriesKey),
      );
      const tooltipRows = visibleSeries
        .map((s) => {
          const nearest = s.data.reduce((best, d) =>
            Math.abs(d.normalizedDate.getTime() - hoveredDate.getTime()) <
            Math.abs(best.normalizedDate.getTime() - hoveredDate.getTime())
              ? d
              : best,
          );
          if (!nearest) return null;
          const val = yValue(nearest);
          if (val == null || isNaN(val)) return null;
          const gradeLabel =
            GradeKeyToKorean[s.gradeKey as keyof typeof GradeKeyToKorean] ??
            s.gradeKey;
          const label = `${s.year} ${s.region} ${gradeLabel}`;
          return `<span style="color:${s.color}">●</span> ${label}: ${mode === "price" ? val.toLocaleString() + "원" : val.toLocaleString() + "kg"}`;
        })
        .filter(Boolean);

      if (tooltipRows.length > 0) {
        const dateStr = d3.timeFormat("%-m/%-d")(hoveredDate);
        tooltip
          .html(`<strong>${dateStr}</strong><br/>${tooltipRows.join("<br/>")}`)
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 20}px`)
          .style("display", "block");
      }
    })
    .on("mouseleave", () => {
      crosshairLine.style("display", "none");
      tooltip.style("display", "none");
    });

  const legendItems: LegendItem[] = years.map((year) => ({
    region: String(year),
    gradeKey: "",
    color: yearColorScale(year),
    dashPattern: "",
  }));

  const legendTop = margin.top + plotHeight + margin.bottom + 4;
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

export default drawOverlayMode;
