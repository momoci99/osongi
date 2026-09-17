import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { useContainerWidth } from "../../../../utils/d3/useContainerSize";
import { isMobileWidth } from "../../../../utils/d3/chartMargins";
import { HEATMAP, LINE_CHART } from "../../../../const/AnalysisLayout";
import { hideTooltip, placeTooltip } from "../chartTooltip";
import { renderTooltipHtml } from "../lineTooltip";
import { formatAxisValue, formatMetricText } from "../../../../utils/analysisQuery/format";
import type { HeatmapCell, HeatmapModel } from "../../../../utils/analysisQuery/heatmapModel";
import type { AnalysisAxis, AnalysisQuery } from "../../../../utils/analysisQuery/types";

type UseDrawHeatmapParams = {
  model: HeatmapModel;
  query: AnalysisQuery;
  axis: AnalysisAxis;
  colorScale: (value: number) => string;
  theme: Theme;
  onCellClick: (cell: HeatmapCell) => void;
};

/** 시즌 × 날짜 히트맵 렌더링 */
const useDrawHeatmap = ({ model, query, axis, colorScale, theme, onCellClick }: UseDrawHeatmapParams) => {
  const { containerRef, width } = useContainerWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const clickRef = useRef(onCellClick);

  useEffect(function syncCellClick() {
    clickRef.current = onCellClick;
  });

  useEffect(
    function drawHeatmap() {
      const svgEl = svgRef.current;
      const tooltipEl = tooltipRef.current;
      if (!svgEl || !tooltipEl || width === 0 || model.columnCount === 0) return;

      const margin = HEATMAP.MARGIN;
      const rowHeight = isMobileWidth(width) ? HEATMAP.ROW_HEIGHT.MOBILE : HEATMAP.ROW_HEIGHT.DESKTOP;
      const availableWidth = width - margin.left - margin.right;
      const cellWidth = Math.max(HEATMAP.MIN_CELL_WIDTH, availableWidth / model.columnCount);
      const innerWidth = cellWidth * model.columnCount;
      const innerHeight = rowHeight * model.rows.length;
      const svgWidth = innerWidth + margin.left + margin.right;

      const svg = d3
        .select(svgEl)
        .attr("width", svgWidth)
        .attr("height", innerHeight + margin.top + margin.bottom);
      svg.selectAll("*").remove();
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const rowIndex = new Map(model.rows.map((row, index) => [row.key, index]));
      const [start] = model.mapping.domain;
      const columnX = (position: number) => ((position - start) / (model.columnPosition(1) - start || 1)) * cellWidth;

      g.append("g")
        .selectAll("text")
        .data(model.rows)
        .join("text")
        .attr("x", -10)
        .attr("y", (_, index) => index * rowHeight + rowHeight / 2)
        .attr("dy", "0.32em")
        .attr("text-anchor", "end")
        .attr("font-size", LINE_CHART.AXIS_FONT_SIZE)
        .attr("font-weight", 600)
        .attr("fill", theme.palette.text.secondary)
        .style("font-variant-numeric", "tabular-nums")
        .text((row) => row.label);

      const ticks = model.mapping
        .ticks(innerWidth)
        .filter((tick) => tick.position >= start && tick.position <= model.columnPosition(model.columnCount - 1));
      g.append("g")
        .selectAll("text")
        .data(ticks)
        .join("text")
        .attr("x", (tick) => columnX(tick.position) + cellWidth / 2)
        .attr("y", -8)
        .attr("text-anchor", "middle")
        .attr("font-size", LINE_CHART.AXIS_FONT_SIZE)
        .attr("fill", theme.palette.text.secondary)
        .style("font-variant-numeric", "tabular-nums")
        .text((tick) => tick.label);

      g.append("g")
        .selectAll("rect")
        .data(model.cells)
        .join("rect")
        .attr("x", (cell) => cell.column * cellWidth + HEATMAP.CELL_GAP / 2)
        .attr("y", (cell) => (rowIndex.get(cell.rowKey) ?? 0) * rowHeight + HEATMAP.CELL_GAP / 2)
        .attr("width", Math.max(1, cellWidth - HEATMAP.CELL_GAP))
        .attr("height", rowHeight - HEATMAP.CELL_GAP)
        .attr("rx", Math.min(HEATMAP.CELL_RADIUS, cellWidth / 3))
        .attr("fill", (cell) => colorScale(cell.value))
        .style("cursor", "pointer")
        .on("pointerenter", function showCell(event: PointerEvent, cell) {
          d3.select(this).attr("stroke", theme.palette.text.primary).attr("stroke-width", 1.5);
          tooltipEl.innerHTML = renderTooltipHtml({
            title: `${cell.rowKey} · ${formatAxisValue(axis, cell.x, query.granularity)}`,
            rows: [
              {
                key: cell.rowKey,
                label: "값",
                color: colorScale(cell.value),
                value: formatMetricText(query.metric, cell.value),
                detail: `공판 ${cell.records}건 · 클릭하면 이 시즌 추이`,
                lowSample: cell.lowSample,
              },
            ],
            normal: null,
          });
          const [px, py] = d3.pointer(event, containerRef.current);
          placeTooltip(tooltipEl, px, py + 12, containerRef.current?.clientWidth ?? width);
        })
        .on("pointerleave", function hideCell() {
          d3.select(this).attr("stroke", null);
          hideTooltip(tooltipEl);
        })
        .on("click", (_, cell) => clickRef.current(cell));
    },
    [model, query, axis, colorScale, theme, width, containerRef],
  );

  return { containerRef, svgRef, tooltipRef };
};

export default useDrawHeatmap;
