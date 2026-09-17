import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { useContainerWidth } from "../../../../utils/d3/useContainerSize";
import { isMobileWidth } from "../../../../utils/d3/chartMargins";
import { RANK_CHART } from "../../../../const/AnalysisCharts";
import { formatMetricText } from "../../../../utils/analysisQuery/format";
import type { RankItem } from "../../../../utils/analysisQuery/rankModel";
import type { AnalysisMetric } from "../../../../utils/analysisQuery/types";

type UseDrawRankChartParams = {
  items: RankItem[];
  metric: AnalysisMetric;
  showChange: boolean;
  colorOf: (item: RankItem) => string;
  theme: Theme;
};

/** 변화율 텍스트 */
const formatChange = (change: number | null): string =>
  change === null ? "–" : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change * RANK_CHART.PERCENT).toFixed(1)}%`;

/**
 * 순위 가로 막대.
 * 막대 = 현재 값, 속 빈 원 = 전년 값. 순위는 위치로 이미 읽히므로 번호는 붙이지 않는다.
 */
const useDrawRankChart = ({ items, metric, showChange, colorOf, theme }: UseDrawRankChartParams) => {
  const { containerRef, width } = useContainerWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const height = RANK_CHART.MARGIN_TOP * 2 + items.length * RANK_CHART.ROW_HEIGHT;

  useEffect(
    function drawRankChart() {
      const svgEl = svgRef.current;
      if (!svgEl || width === 0) return;

      const mobile = isMobileWidth(width);
      const labelWidth = mobile ? RANK_CHART.LABEL_WIDTH.MOBILE : RANK_CHART.LABEL_WIDTH.DESKTOP;
      const valueWidth = mobile ? RANK_CHART.VALUE_WIDTH.MOBILE : RANK_CHART.VALUE_WIDTH.DESKTOP;
      const changeWidth = showChange ? RANK_CHART.CHANGE_WIDTH : 0;
      const barWidth = Math.max(0, width - labelWidth - valueWidth - changeWidth);

      const svg = d3.select(svgEl).attr("width", width).attr("height", height);
      svg.selectAll("*").remove();

      const maxValue = d3.max(items, (item) => Math.max(item.value, item.previous ?? 0)) ?? 1;
      const x = d3.scaleLinear().domain([0, maxValue]).range([0, barWidth]);

      const rows = svg
        .selectAll<SVGGElement, RankItem>("g")
        .data(items)
        .join("g")
        .attr("transform", (_, index) => `translate(0, ${RANK_CHART.MARGIN_TOP + index * RANK_CHART.ROW_HEIGHT})`)
        .attr("opacity", (item) => (item.lowSample ? RANK_CHART.LOW_SAMPLE_OPACITY : 1));

      const center = RANK_CHART.ROW_HEIGHT / 2;

      rows
        .filter((item) => item.region !== null)
        .append("circle")
        .attr("cx", RANK_CHART.DOT_RADIUS + 2)
        .attr("cy", center)
        .attr("r", RANK_CHART.DOT_RADIUS)
        .attr("fill", (item) => colorOf(item));

      rows
        .append("text")
        .attr("x", (item) => (item.region !== null ? RANK_CHART.DOT_RADIUS * 2 + 10 : 0))
        .attr("y", center)
        .attr("dy", "0.32em")
        .attr("font-size", RANK_CHART.FONT_SIZE)
        .attr("font-weight", 600)
        .attr("fill", theme.palette.text.primary)
        .text((item) => item.label);

      const bars = rows.append("g").attr("transform", `translate(${labelWidth}, 0)`);

      bars
        .append("rect")
        .attr("x", 0)
        .attr("y", center - RANK_CHART.BAR_THICKNESS / 2)
        .attr("width", barWidth)
        .attr("height", RANK_CHART.BAR_THICKNESS)
        .attr("rx", RANK_CHART.BAR_RADIUS)
        .attr("fill", theme.palette.surface.base);

      bars
        .append("rect")
        .attr("x", 0)
        .attr("y", center - RANK_CHART.BAR_THICKNESS / 2)
        .attr("width", (item) => Math.max(RANK_CHART.BAR_RADIUS * 2, x(item.value)))
        .attr("height", RANK_CHART.BAR_THICKNESS)
        .attr("rx", RANK_CHART.BAR_RADIUS)
        .attr("fill", (item) => colorOf(item))
        .append("title")
        .text((item) => `${item.label} ${formatMetricText(metric, item.value)} · 공판 ${item.tradingDays}일`);

      bars
        .filter((item) => item.previous !== null)
        .append("circle")
        .attr("cx", (item) => x(item.previous ?? 0))
        .attr("cy", center)
        .attr("r", RANK_CHART.PREVIOUS_MARKER_RADIUS)
        .attr("fill", theme.palette.surface.raised)
        .attr("stroke", theme.palette.text.primary)
        .attr("stroke-width", 1.5);

      rows
        .append("text")
        .attr("x", labelWidth + barWidth + valueWidth - 4)
        .attr("y", center)
        .attr("dy", "0.32em")
        .attr("text-anchor", "end")
        .attr("font-size", RANK_CHART.FONT_SIZE)
        .attr("font-weight", 700)
        .attr("fill", theme.palette.text.primary)
        .style("font-variant-numeric", "tabular-nums")
        .text((item) => formatMetricText(metric, item.value));

      if (!showChange) return;

      rows
        .append("text")
        .attr("x", width - 2)
        .attr("y", center)
        .attr("dy", "0.32em")
        .attr("text-anchor", "end")
        .attr("font-size", RANK_CHART.FONT_SIZE - 1)
        .attr("font-weight", 600)
        .attr("fill", (item) =>
          item.change === null
            ? theme.palette.text.disabled
            : item.change >= 0
              ? theme.palette.chart.up
              : theme.palette.chart.down,
        )
        .style("font-variant-numeric", "tabular-nums")
        .text((item) => formatChange(item.change));
    },
    [items, metric, showChange, colorOf, theme, width, height],
  );

  return { containerRef, svgRef, height };
};

export default useDrawRankChart;
