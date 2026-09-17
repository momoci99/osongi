import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { useContainerWidth } from "../../../../utils/d3/useContainerSize";
import { isMobileWidth } from "../../../../utils/d3/chartMargins";
import { COMPOSITION_CHART, RANK_CHART } from "../../../../const/AnalysisCharts";
import { GradeKeyToKorean } from "../../../../const/Common";
import { hideTooltip, placeTooltip } from "../chartTooltip";
import { renderTooltipHtml } from "../lineTooltip";
import { formatAxisValue, formatQuantity, formatShare } from "../../../../utils/analysisQuery/format";
import type { CompositionColumn } from "../../../../utils/analysisQuery/compositionModel";
import type { AnalysisAxis, AnalysisGranularity } from "../../../../utils/analysisQuery/types";

type UseDrawCompositionChartParams = {
  columns: CompositionColumn[];
  axis: AnalysisAxis;
  granularity: AnalysisGranularity;
  theme: Theme;
};

/** 구간 라벨 — 연도 축이 아니면 시즌을 앞에 붙인다 */
const columnLabel = (column: CompositionColumn, axis: AnalysisAxis, granularity: AnalysisGranularity) =>
  axis === "year" ? String(column.year) : formatAxisValue(axis, column.x, granularity);

/**
 * 등급 구성 100% 누적 막대.
 * 조각 사이에 표면색 간격을 둬 인접 등급 색이 맞닿아 뭉개지지 않게 한다.
 */
const useDrawCompositionChart = ({ columns, axis, granularity, theme }: UseDrawCompositionChartParams) => {
  const { containerRef, width } = useContainerWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const height = isMobileWidth(width) ? COMPOSITION_CHART.HEIGHT.MOBILE : COMPOSITION_CHART.HEIGHT.DESKTOP;

  useEffect(
    function drawCompositionChart() {
      const svgEl = svgRef.current;
      const tooltipEl = tooltipRef.current;
      if (!svgEl || !tooltipEl || width === 0 || columns.length === 0) return;

      const margin = COMPOSITION_CHART.MARGIN;
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const svg = d3.select(svgEl).attr("width", width).attr("height", height);
      svg.selectAll("*").remove();
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleBand<string>()
        .domain(columns.map((column) => column.key))
        .range([0, innerWidth])
        .paddingInner(COMPOSITION_CHART.BAND_PADDING);
      const y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

      g.append("g")
        .selectAll("text")
        .data(COMPOSITION_CHART.Y_TICKS)
        .join("text")
        .attr("x", -8)
        .attr("y", (tick) => y(tick))
        .attr("dy", "0.32em")
        .attr("text-anchor", "end")
        .attr("font-size", COMPOSITION_CHART.FONT_SIZE)
        .attr("fill", theme.palette.text.secondary)
        .text((tick) => `${tick * RANK_CHART.PERCENT}%`);

      const labelEvery = Math.ceil((COMPOSITION_CHART.MIN_LABEL_WIDTH * 1.2) / x.step());
      g.append("g")
        .selectAll("text")
        .data(columns.filter((_, index) => index % labelEvery === 0))
        .join("text")
        .attr("x", (column) => (x(column.key) ?? 0) + x.bandwidth() / 2)
        .attr("y", innerHeight + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", COMPOSITION_CHART.FONT_SIZE)
        .attr("fill", theme.palette.text.secondary)
        .style("font-variant-numeric", "tabular-nums")
        .text((column) => columnLabel(column, axis, granularity));

      const bars = g
        .append("g")
        .selectAll<SVGGElement, CompositionColumn>("g")
        .data(columns)
        .join("g")
        .attr("transform", (column) => `translate(${x(column.key) ?? 0},0)`);

      const segments = bars
        .selectAll("g")
        .data((column) => column.segments)
        .join("g");

      segments
        .append("rect")
        .attr("x", 0)
        .attr("width", x.bandwidth())
        .attr("y", (segment) => y(segment.offset + segment.share) + COMPOSITION_CHART.SEGMENT_GAP / 2)
        .attr("height", (segment) => Math.max(0, y(segment.offset) - y(segment.offset + segment.share) - COMPOSITION_CHART.SEGMENT_GAP))
        .attr("rx", COMPOSITION_CHART.BAR_RADIUS)
        .attr("fill", (segment) => theme.palette.chart[segment.grade]);

      segments
        .filter(
          (segment) =>
            x.bandwidth() >= COMPOSITION_CHART.MIN_LABEL_WIDTH &&
            y(segment.offset) - y(segment.offset + segment.share) >= COMPOSITION_CHART.MIN_LABEL_HEIGHT,
        )
        .append("text")
        .attr("x", x.bandwidth() / 2)
        .attr("y", (segment) => y(segment.offset + segment.share / 2))
        .attr("dy", "0.32em")
        .attr("text-anchor", "middle")
        .attr("font-size", COMPOSITION_CHART.FONT_SIZE - 1)
        .attr("font-weight", 700)
        .attr("fill", theme.palette.surface.base)
        .attr("pointer-events", "none")
        .style("font-variant-numeric", "tabular-nums")
        .text((segment) => `${Math.round(segment.share * RANK_CHART.PERCENT)}`);

      bars
        .append("rect")
        .attr("width", x.bandwidth())
        .attr("height", innerHeight)
        .attr("fill", "transparent")
        .on("pointerenter", function showColumn(event: PointerEvent, column) {
          const total = formatQuantity(column.total);
          tooltipEl.innerHTML = renderTooltipHtml({
            title: `${columnLabel(column, axis, granularity)} · 총 ${total.value}${total.unit}`,
            rows: [...column.segments].reverse().map((segment) => {
              const share = formatShare(segment.share);
              const quantity = formatQuantity(segment.quantity);
              return {
                key: segment.grade,
                label: GradeKeyToKorean[segment.grade],
                color: theme.palette.chart[segment.grade],
                value: `${share.value}${share.unit}`,
                detail: `${quantity.value}${quantity.unit}`,
                lowSample: false,
              };
            }),
            normal: null,
          });
          const [px] = d3.pointer(event, containerRef.current);
          placeTooltip(tooltipEl, px, margin.top, width);
        })
        .on("pointerleave", () => hideTooltip(tooltipEl));
    },
    [columns, axis, granularity, theme, width, height, containerRef],
  );

  return { containerRef, svgRef, tooltipRef, height };
};

export default useDrawCompositionChart;
