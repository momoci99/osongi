import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { useContainerWidth } from "../../../../utils/d3/useContainerSize";
import { isMobileWidth } from "../../../../utils/d3/chartMargins";
import { LINE_CHART } from "../../../../const/AnalysisLayout";
import { renderAxes, renderBand, renderDirectLabels, renderSeries } from "./renderers";
import { buildTooltipContent, renderTooltipHtml } from "../lineTooltip";
import { hideTooltip, placeTooltip } from "../chartTooltip";
import { nearestPosition, type ChartSeries, type LineChartModel } from "../../../../utils/analysisQuery/lineChartModel";
import type { AnalysisQuery } from "../../../../utils/analysisQuery/types";

type UseDrawLineChartParams = {
  model: LineChartModel;
  query: AnalysisQuery;
  axis: Parameters<typeof buildTooltipContent>[0]["axis"];
  seasonStarts: Record<number, string>;
  colorOf: (series: ChartSeries) => string;
  theme: Theme;
};

/**
 * 연도 겹침·추이 공용 선 차트.
 * 호버는 가장 가까운 x로 스냅하고, 툴팁은 리렌더 없이 DOM을 직접 갱신한다.
 */
const useDrawLineChart = ({ model, query, axis, seasonStarts, colorOf, theme }: UseDrawLineChartParams) => {
  const { containerRef, width } = useContainerWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const colorOfRef = useRef(colorOf);

  useEffect(function syncColorResolver() {
    colorOfRef.current = colorOf;
  });

  const isMobile = isMobileWidth(width);
  const height = isMobile ? LINE_CHART.HEIGHT.MOBILE : LINE_CHART.HEIGHT.DESKTOP;

  useEffect(
    function drawLineChart() {
      const svgEl = svgRef.current;
      const tooltipEl = tooltipRef.current;
      if (!svgEl || !tooltipEl || width === 0) return;

      const margin = isMobile ? LINE_CHART.MARGIN.MOBILE : LINE_CHART.MARGIN.DESKTOP;
      const innerWidth = Math.max(0, width - margin.left - margin.right);
      const innerHeight = Math.max(0, height - margin.top - margin.bottom);

      const svg = d3.select(svgEl).attr("width", width).attr("height", height);
      svg.selectAll("*").remove();
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const [start, end] = model.mapping.domain;
      const x = d3
        .scaleLinear()
        .domain(start === end ? [start - 1, end + 1] : [start, end])
        .range([0, innerWidth]);
      const y = d3.scaleLinear().domain(model.yDomain).nice().range([innerHeight, 0]);
      const scales = { x, y, innerWidth, innerHeight };
      const resolveColor = (series: ChartSeries) => colorOfRef.current(series);

      renderAxes(g, scales, model, query.metric, theme);
      renderBand(g, scales, model, theme);
      renderSeries(g, scales, model, resolveColor, theme);
      renderDirectLabels(g, scales, model, theme);

      const crosshair = g
        .append("line")
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", theme.palette.text.disabled)
        .attr("pointer-events", "none")
        .style("display", "none");
      const hoverDots = g.append("g").attr("pointer-events", "none");
      const hide = () => {
        crosshair.style("display", "none");
        hoverDots.selectAll("*").remove();
        hideTooltip(tooltipEl);
      };

      g.append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("fill", "transparent")
        .style("touch-action", "pan-y")
        .on("pointermove", function handlePointerMove(event: PointerEvent) {
          const [mx] = d3.pointer(event, this);
          const position = nearestPosition(model.positions, x.invert(mx));
          if (position === null) return hide();

          const hits = model.series.flatMap((series) => {
            const point = series.points.find((item) => item.position === position);
            return point ? [{ series, point, color: resolveColor(series) }] : [];
          });
          const band = model.band?.find((point) => point.position === position);
          const content = buildTooltipContent({ axis, query, hits, band, seasonStarts });
          if (!content) return hide();

          const px = x(position);
          crosshair.style("display", null).attr("x1", px).attr("x2", px);
          hoverDots
            .selectAll("circle")
            .data(hits)
            .join("circle")
            .attr("cx", px)
            .attr("cy", (hit) => y(hit.point.value))
            .attr("r", LINE_CHART.HOVER_MARKER_RADIUS)
            .attr("fill", (hit) => hit.color)
            .attr("stroke", theme.palette.surface.raised)
            .attr("stroke-width", 2);

          tooltipEl.innerHTML = renderTooltipHtml(content);
          placeTooltip(tooltipEl, margin.left + px, margin.top, width);
        })
        .on("pointerleave", hide);
    },
    [model, query, axis, seasonStarts, theme, width, height, isMobile],
  );

  return { containerRef, svgRef, tooltipRef, height };
};

export default useDrawLineChart;
