import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { GradeKeyToKorean } from "../../../const/Common";
import { getMargin, ensureGradient } from "./chartHelpers";
import type { ChartDatum } from "./chartHelpers";

type UseDrawGradeBarKgParams = {
  data: ChartDatum[];
  height: number;
  yMaxOverride?: number;
  labelYOffset: number;
  theme: Theme;
};

/**
 * 등급별 무게 막대 차트를 D3로 그리는 훅입니다.
 */
export const useDrawGradeBarKg = ({
  data,
  height,
  yMaxOverride,
  labelYOffset,
  theme,
}: UseDrawGradeBarKgParams) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const draw = useCallback(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const width = container.clientWidth;
    const MARGIN = getMargin(data);
    const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
    const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

    const svg = d3.select(svgEl).attr("width", width).attr("height", height);

    const g = svg
      .selectAll<SVGGElement, unknown>("g.chart-root")
      .data([null])
      .join("g")
      .attr("class", "chart-root")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.gradeKey))
      .range([0, innerWidth])
      .padding(0.25);

    const maxY =
      yMaxOverride ?? d3.max(data, (d: ChartDatum) => d.quantityKg) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxY * 1.05])
      .range([innerHeight, 0])
      .nice();

    const axisColor = theme.palette.text.secondary;
    const fontFamily = theme.typography.fontFamily as string;

    drawGrid(g, y, innerWidth, theme);
    drawXAxis(g, x, innerHeight, labelYOffset, fontFamily, axisColor);
    drawYAxis(g, y, fontFamily, theme, innerHeight);

    const gradientId = ensureGradient(svg, theme);
    const barHover =
      theme.palette.mode === "dark"
        ? theme.palette.chart.weight.main
        : theme.palette.chart.weight.dark;

    drawBars({
      g,
      data,
      x,
      y,
      innerHeight,
      gradientId,
      barHover,
      fontFamily,
      theme,
    });
  }, [data, height, yMaxOverride, labelYOffset, theme]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  return { containerRef, svgRef };
};

/** 수평 그리드 라인 */
const drawGrid = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  y: d3.ScaleLinear<number, number>,
  innerWidth: number,
  theme: Theme,
) => {
  g.selectAll<SVGGElement, unknown>("g.grid")
    .data([null])
    .join("g")
    .attr("class", "grid")
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat(() => ""),
    )
    .call((sel) => {
      sel
        .selectAll("line")
        .attr("stroke", theme.palette.divider)
        .attr("stroke-opacity", 0.6);
      sel.selectAll("path").remove();
    });
};

/** X축 + 라벨 줄바꿈 */
const drawXAxis = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  innerHeight: number,
  labelYOffset: number,
  fontFamily: string,
  axisColor: string,
) => {
  g.selectAll<SVGGElement, unknown>("g.x-axis")
    .data([null])
    .join("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3
        .axisBottom(x)
        .tickFormat(
          (val: string) =>
            (GradeKeyToKorean as Record<string, string>)[val] ?? val,
        ),
    )
    .call((gAxis) => {
      gAxis
        .selectAll<SVGTextElement, unknown>("text")
        .style("font-family", fontFamily)
        .style("font-size", "11px")
        .attr("transform", `translate(0,${labelYOffset})`)
        .each(function () {
          const self = d3.select<SVGTextElement, string>(this);
          const full = self.text();
          const idx = full.indexOf("(");
          if (idx > 0) {
            const first = full.slice(0, idx).trim();
            const second = full.slice(idx).trim();
            const xPos = self.attr("x") || "0";
            self.text(null);
            self.append("tspan").text(first).attr("x", xPos).attr("dy", "0");
            self
              .append("tspan")
              .text(second)
              .attr("x", xPos)
              .attr("dy", "1.25em");
          }
          self.append("title").text(full);
        });
      gAxis.selectAll("path, line").attr("stroke", axisColor);
    });
};

/** Y축 + 라벨 */
const drawYAxis = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  y: d3.ScaleLinear<number, number>,
  fontFamily: string,
  theme: Theme,
  innerHeight: number,
) => {
  g.selectAll<SVGGElement, unknown>("g.y-axis")
    .data([null])
    .join("g")
    .attr("class", "y-axis")
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((v: d3.NumberValue) => `${Number(v)}`),
    )
    .call((gAxis) => {
      gAxis
        .selectAll<SVGTextElement, unknown>("text")
        .style("font-family", fontFamily)
        .style("font-size", "11px")
        .style("fill", theme.palette.text.secondary);
      gAxis
        .selectAll("path, line")
        .attr("stroke", theme.palette.text.secondary);
    });

  g.selectAll<SVGTextElement, unknown>("text.y-label")
    .data([null])
    .join("text")
    .attr("class", "y-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -48)
    .attr("text-anchor", "middle")
    .style("font-family", fontFamily)
    .style("fill", theme.palette.text.primary)
    .style("font-size", "12px")
    .style("font-weight", "600")
    .text("무게 (kg)");
};

type DrawBarsParams = {
  g: d3.Selection<SVGGElement, unknown, null, undefined>;
  data: ChartDatum[];
  x: d3.ScaleBand<string>;
  y: d3.ScaleLinear<number, number>;
  innerHeight: number;
  gradientId: string;
  barHover: string;
  fontFamily: string;
  theme: Theme;
};

/** 막대 + 값 라벨 + 호버 인터랙션 */
const drawBars = ({
  g,
  data,
  x,
  y,
  innerHeight,
  gradientId,
  barHover,
  fontFamily,
  theme,
}: DrawBarsParams) => {
  const plot = g
    .selectAll<SVGGElement, unknown>("g.plot")
    .data([null])
    .join("g")
    .attr("class", "plot");

  const bars = plot
    .selectAll<SVGRectElement, ChartDatum>("rect")
    .data(data, (d: ChartDatum) => d.gradeKey);

  const mergedBars = bars
    .join(
      (enter) =>
        enter
          .append("rect")
          .attr("x", (d: ChartDatum) => x(d.gradeKey) ?? 0)
          .attr("y", innerHeight)
          .attr("width", x.bandwidth())
          .attr("rx", Math.min(6, x.bandwidth() / 4))
          .attr("ry", Math.min(6, x.bandwidth() / 4))
          .attr("height", 0)
          .attr("fill", `url(#${gradientId})`),
      (update) => update.attr("fill", `url(#${gradientId})`),
      (exit) =>
        exit
          .transition()
          .duration(400)
          .attr("y", innerHeight)
          .attr("height", 0)
          .remove(),
    )
    .on("mouseenter", function (this: SVGRectElement) {
      d3.select<SVGRectElement, unknown>(this)
        .interrupt()
        .transition()
        .duration(120)
        .attr("fill", barHover)
        .attr("opacity", 0.85);
    })
    .on("mouseleave", function (this: SVGRectElement) {
      d3.select<SVGRectElement, unknown>(this)
        .interrupt()
        .transition()
        .duration(120)
        .attr("fill", `url(#${gradientId})`)
        .attr("opacity", 1);
    });

  mergedBars.select("title").remove();
  mergedBars.append("title").text((d: ChartDatum) => {
    const label =
      (GradeKeyToKorean as Record<string, string>)[d.gradeKey] ?? d.gradeKey;
    return `${label}`;
  });

  mergedBars
    .transition()
    .duration(650)
    .ease(d3.easeCubicOut)
    .attr("x", (d: ChartDatum) => x(d.gradeKey) ?? 0)
    .attr("y", (d) => y(d.quantityKg))
    .attr("width", x.bandwidth())
    .attr("height", (d) => innerHeight - y(d.quantityKg));

  plot
    .selectAll<SVGTextElement, ChartDatum>("text.bar-value")
    .data(data, (d: ChartDatum) => d.gradeKey)
    .join(
      (enter) =>
        enter
          .append("text")
          .attr("class", "bar-value")
          .attr("x", (d) => (x(d.gradeKey) ?? 0) + x.bandwidth() / 2)
          .attr("y", (d) => y(d.quantityKg) - 6)
          .attr("text-anchor", "middle")
          .style("font-family", fontFamily)
          .style("font-size", "10px")
          .style("fill", theme.palette.text.secondary)
          .style("opacity", "0")
          .text((d) => d.quantityKg.toLocaleString())
          .call((sel) =>
            sel.transition().delay(400).duration(400).style("opacity", "1"),
          ),
      (update) =>
        update
          .attr("x", (d) => (x(d.gradeKey) ?? 0) + x.bandwidth() / 2)
          .attr("y", (d) => y(d.quantityKg) - 6)
          .text((d) => d.quantityKg.toLocaleString()),
      (exit) => exit.remove(),
    );
};

export default useDrawGradeBarKg;
