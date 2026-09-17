import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { COVERAGE_MATRIX } from "../../../../const/AnalysisLayout";
import { regionColor } from "../../../../const/Regions";
import { useContainerWidth } from "../../../../utils/d3/useContainerSize";
import { isMobileWidth } from "../../../../utils/d3/chartMargins";
import { formatInteger } from "../../../../utils/analysisQuery/format";
import type { Coverage, CoverageCell } from "../../../../utils/analysisQuery/seasonTables";
import { hideTooltip, placeTooltip } from "../chartTooltip";
import { renderTooltipHtml } from "../lineTooltip";

type UseDrawCoverageParams = {
  coverage: Coverage;
  colorScale: (value: number) => string;
  theme: Theme;
};

type MatrixCell = CoverageCell & { empty: boolean };

/** 조합 × 시즌 커버리지 행렬 렌더링 */
const useDrawCoverage = ({ coverage, colorScale, theme }: UseDrawCoverageParams) => {
  const { containerRef, width } = useContainerWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    function drawCoverage() {
      const svgEl = svgRef.current;
      const tooltipEl = tooltipRef.current;
      if (!svgEl || !tooltipEl || width === 0 || coverage.years.length === 0) return;

      const margin = COVERAGE_MATRIX.MARGIN;
      const rowHeight = isMobileWidth(width) ? COVERAGE_MATRIX.ROW_HEIGHT.MOBILE : COVERAGE_MATRIX.ROW_HEIGHT.DESKTOP;
      const availableWidth = width - margin.left - margin.right;
      const cellWidth = Math.max(COVERAGE_MATRIX.MIN_CELL_WIDTH, availableWidth / coverage.years.length);
      const innerWidth = cellWidth * coverage.years.length;
      const innerHeight = rowHeight * coverage.unions.length;
      const svgWidth = innerWidth + margin.left + margin.right;
      const cellByKey = new Map(coverage.cells.map((cell) => [`${cell.union}|${cell.year}`, cell]));
      const matrixCells: MatrixCell[] = coverage.unions.flatMap(({ region, union }) =>
        coverage.years.map((year) => cellByKey.get(`${union}|${year}`) ?? { region, union, year, tradingDays: 0, empty: true }),
      ).map((cell) => ({ ...cell, empty: "empty" in cell ? cell.empty : false }));
      const maxValue = Math.max(...coverage.cells.map((cell) => cell.tradingDays), 0);

      const svg = d3.select(svgEl).attr("width", svgWidth).attr("height", innerHeight + margin.top + margin.bottom);
      svg.selectAll("*").remove();
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      g.append("g")
        .selectAll("text")
        .data(coverage.years)
        .join("text")
        .attr("x", (_, index) => index * cellWidth + cellWidth / 2)
        .attr("y", -8)
        .attr("text-anchor", "middle")
        .attr("font-size", COVERAGE_MATRIX.AXIS_FONT_SIZE)
        .attr("fill", theme.palette.text.secondary)
        .style("font-variant-numeric", "tabular-nums")
        .text((year) => year);

      const rows = g.append("g").selectAll("g").data(coverage.unions).join("g");
      rows
        .append("circle")
        .attr("cx", COVERAGE_MATRIX.REGION_DOT_X)
        .attr("cy", (_, index) => index * rowHeight + rowHeight / 2)
        .attr("r", COVERAGE_MATRIX.REGION_DOT_RADIUS)
        .attr("fill", (row) => regionColor(row.region));
      rows
        .append("text")
        .attr("x", COVERAGE_MATRIX.LABEL_X)
        .attr("y", (_, index) => index * rowHeight + rowHeight / 2)
        .attr("dy", "0.32em")
        .attr("font-size", COVERAGE_MATRIX.AXIS_FONT_SIZE)
        .attr("fill", theme.palette.text.secondary)
        .text((row) => row.union);

      const cells = g.append("g").selectAll("g").data(matrixCells).join("g");
      cells
        .append("rect")
        .attr("x", (cell) => coverage.years.indexOf(cell.year) * cellWidth + COVERAGE_MATRIX.CELL_GAP / 2)
        .attr("y", (cell) => coverage.unions.findIndex((row) => row.union === cell.union) * rowHeight + COVERAGE_MATRIX.CELL_GAP / 2)
        .attr("width", Math.max(1, cellWidth - COVERAGE_MATRIX.CELL_GAP))
        .attr("height", rowHeight - COVERAGE_MATRIX.CELL_GAP)
        .attr("rx", COVERAGE_MATRIX.CELL_RADIUS)
        .attr("fill", (cell) => (cell.empty ? "none" : colorScale(cell.tradingDays)))
        .attr("stroke", (cell) => (cell.empty ? theme.palette.surface.border : "none"))
        .attr("stroke-width", COVERAGE_MATRIX.EMPTY_STROKE_WIDTH)
        .on("pointerenter", function showCell(event: PointerEvent, cell) {
          d3.select(this).attr("stroke", theme.palette.surface.borderStrong);
          tooltipEl.innerHTML = renderTooltipHtml({
            title: `${cell.union} · ${cell.year}`,
            rows: [{ key: "days", label: "공판일", color: cell.empty ? theme.palette.surface.border : colorScale(cell.tradingDays), value: `${formatInteger(cell.tradingDays)}일`, detail: "", lowSample: false }],
            normal: null,
          });
          const [px, py] = d3.pointer(event, containerRef.current);
          placeTooltip(tooltipEl, px, py + COVERAGE_MATRIX.TOOLTIP_Y_OFFSET, containerRef.current?.clientWidth ?? width);
        })
        .on("pointerleave", function hideCell(_, cell) {
          d3.select(this).attr("stroke", cell.empty ? theme.palette.surface.border : "none");
          hideTooltip(tooltipEl);
        });

      if (cellWidth >= COVERAGE_MATRIX.CELL_TEXT_MIN_WIDTH) {
        cells
          .filter((cell) => !cell.empty)
          .append("text")
          .attr("x", (cell) => coverage.years.indexOf(cell.year) * cellWidth + cellWidth / 2)
          .attr("y", (cell) => coverage.unions.findIndex((row) => row.union === cell.union) * rowHeight + rowHeight / 2)
          .attr("dy", "0.32em")
          .attr("text-anchor", "middle")
          .attr("font-size", COVERAGE_MATRIX.AXIS_FONT_SIZE)
          .attr("fill", (cell) => cell.tradingDays > maxValue * COVERAGE_MATRIX.DARK_FILL_RATIO ? theme.palette.text.primary : theme.palette.text.secondary)
          .attr("pointer-events", "none")
          .style("font-variant-numeric", "tabular-nums")
          .text((cell) => formatInteger(cell.tradingDays));
      }
    },
    [coverage, colorScale, theme, width, containerRef],
  );

  return { containerRef, svgRef, tooltipRef };
};

export default useDrawCoverage;
