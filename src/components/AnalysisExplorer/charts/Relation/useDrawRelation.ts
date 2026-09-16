import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { RELATION_CHART } from "../../../../const/AnalysisLayout";
import { regionColor } from "../../../../const/Regions";
import { useContainerWidth } from "../../../../utils/d3/useContainerSize";
import { isMobileWidth } from "../../../../utils/d3/chartMargins";
import { formatAxisTick, formatInteger, formatMetricText } from "../../../../utils/analysisQuery/format";
import type { RelationModel, RelationPoint } from "../../../../utils/analysisQuery/relationModel";
import type { AnalysisQuery } from "../../../../utils/analysisQuery/types";
import { hideTooltip, placeTooltip } from "../chartTooltip";
import { renderTooltipHtml } from "../lineTooltip";

type UseDrawRelationParams = {
  model: RelationModel;
  query: AnalysisQuery;
  theme: Theme;
};

/** 산점도의 점 색과 불투명도를 정한다 */
export const relationPointStyle = (
  point: RelationPoint,
  query: AnalysisQuery,
  latestYear: number,
  theme: Theme,
): { color: string; opacity: number } => {
  if (query.groupBy === "year" && point.year !== latestYear) {
    return { color: theme.palette.text.secondary, opacity: RELATION_CHART.CONTEXT_OPACITY };
  }
  if (query.groupBy === "region") {
    return { color: regionColor(point.region), opacity: RELATION_CHART.POINT_OPACITY };
  }
  return { color: theme.palette.primary.main, opacity: RELATION_CHART.POINT_OPACITY };
};

/** 공판량과 단가 관계 산점도 렌더링 */
const useDrawRelation = ({ model, query, theme }: UseDrawRelationParams) => {
  const { containerRef, width } = useContainerWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const isMobile = isMobileWidth(width);
  const height = isMobile ? RELATION_CHART.HEIGHT.MOBILE : RELATION_CHART.HEIGHT.DESKTOP;

  useEffect(
    function drawRelation() {
      const svgEl = svgRef.current;
      const tooltipEl = tooltipRef.current;
      if (!svgEl || !tooltipEl || width === 0 || !model.enoughPoints) return;

      const margin = isMobile ? RELATION_CHART.MARGIN.MOBILE : RELATION_CHART.MARGIN.DESKTOP;
      const innerWidth = Math.max(0, width - margin.left - margin.right);
      const innerHeight = Math.max(0, height - margin.top - margin.bottom);
      const latestYear = Math.max(...model.points.map((point) => point.year));
      const ySpan = model.yDomain[1] - model.yDomain[0];
      const yPadding = ySpan * RELATION_CHART.Y_PADDING_RATIO;
      const x = d3.scaleLog().domain(model.xDomain).range([0, innerWidth]).clamp(true);
      const y = d3
        .scaleLinear()
        .domain([Math.max(0, model.yDomain[0] - yPadding), model.yDomain[1] + yPadding])
        .nice()
        .range([innerHeight, 0]);

      const svg = d3.select(svgEl).attr("width", width).attr("height", height);
      svg.selectAll("*").remove();
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
      /** 로그 축 기본 눈금은 한 자릿수마다 9개라 라벨이 겹친다. 10의 거듭제곱(부족하면 1·2·5 배수)만 남긴다 */
      const decadeTicks = x.ticks().filter((value) => Number.isInteger(Math.log10(value)));
      const xTickValues =
        decadeTicks.length >= RELATION_CHART.MIN_DECADE_TICKS
          ? decadeTicks
          : x.ticks().filter((value) => [1, 2, 5].includes(Math.round(value / 10 ** Math.floor(Math.log10(value)))));
      const xAxis = d3
        .axisBottom(x)
        .tickValues(xTickValues)
        .tickFormat((value) => formatAxisTick("quantity", Number(value)));
      const yAxis = d3.axisLeft(y).ticks(RELATION_CHART.AXIS_TICK_COUNT).tickFormat((value) => formatAxisTick("unitPrice", Number(value)));

      const styleAxis = (axis: d3.Selection<SVGGElement, unknown, null, undefined>) => {
        axis.selectAll(".domain, .tick line").attr("stroke", theme.palette.surface.border);
        axis.selectAll("text").attr("fill", theme.palette.text.secondary).attr("font-size", RELATION_CHART.AXIS_FONT_SIZE).style("font-variant-numeric", "tabular-nums");
      };
      const xGroup = g.append("g").attr("transform", `translate(0,${innerHeight})`).call(xAxis);
      const yGroup = g.append("g").call(yAxis.tickSize(-innerWidth));
      styleAxis(xGroup);
      styleAxis(yGroup);

      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + RELATION_CHART.AXIS_TITLE_OFFSET)
        .attr("text-anchor", "middle")
        .attr("fill", theme.palette.text.secondary)
        .attr("font-size", RELATION_CHART.AXIS_FONT_SIZE)
        .text("공판량 (로그)");
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -RELATION_CHART.AXIS_TITLE_OFFSET)
        .attr("text-anchor", "middle")
        .attr("fill", theme.palette.text.secondary)
        .attr("font-size", RELATION_CHART.AXIS_FONT_SIZE)
        .text("단가");

      g.append("g")
        .selectAll("circle")
        .data(model.points)
        .join("circle")
        .attr("cx", (point) => x(Math.max(model.xDomain[0], point.quantity)))
        .attr("cy", (point) => y(point.unitPrice))
        .attr("r", RELATION_CHART.POINT_RADIUS)
        .attr("fill", (point) => relationPointStyle(point, query, latestYear, theme).color)
        .attr("fill-opacity", (point) => relationPointStyle(point, query, latestYear, theme).opacity)
        .attr("stroke", theme.palette.surface.raised)
        .attr("stroke-width", RELATION_CHART.POINT_STROKE_WIDTH)
        .on("pointerenter", function showPoint(event: PointerEvent, point) {
          const style = relationPointStyle(point, query, latestYear, theme);
          d3.select(this).attr("r", RELATION_CHART.HOVER_POINT_RADIUS).attr("fill-opacity", 1);
          tooltipEl.innerHTML = renderTooltipHtml({
            title: point.label,
            rows: [
              { key: "price", label: "단가", color: style.color, value: formatMetricText("unitPrice", point.unitPrice), detail: "", lowSample: false },
              { key: "quantity", label: "공판량", color: style.color, value: formatMetricText("quantity", point.quantity), detail: `공판 ${formatInteger(point.records)}건`, lowSample: false },
            ],
            normal: null,
          });
          const [px, py] = d3.pointer(event, containerRef.current);
          placeTooltip(tooltipEl, px, py + RELATION_CHART.TOOLTIP_Y_OFFSET, containerRef.current?.clientWidth ?? width);
        })
        .on("pointerleave", function hidePoint(_, point) {
          d3.select(this)
            .attr("r", RELATION_CHART.POINT_RADIUS)
            .attr("fill-opacity", relationPointStyle(point, query, latestYear, theme).opacity);
          hideTooltip(tooltipEl);
        });
    },
    [model, query, theme, width, height, isMobile, containerRef],
  );

  return { containerRef, svgRef, tooltipRef, height };
};

export default useDrawRelation;
