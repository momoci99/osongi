// 최신 날짜 등급별 평균 단가 막대 차트
// d3 활용 (x: gradeKey, y: unitPriceWon[₩])
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useTheme } from "@mui/material/styles";
import { GradeKeyToKorean } from "../const/Common";

export type PriceDatum = { gradeKey: string; unitPriceWon: number };

type DashboardChartGradePerPriceProps = {
  data: PriceDatum[];
  height?: number;
  yMaxOverride?: number;
  labelYOffset?: number;
};

const BASE_MARGIN = { top: 16, right: 16, left: 48 } as const;

const DashboardChartGradePerPrice = ({
  data,
  height = 350,
  yMaxOverride,
  labelYOffset = 4,
}: DashboardChartGradePerPriceProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, height, yMaxOverride, theme.palette.mode]);

  const draw = () => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const width = container.clientWidth;
    const labels = data.map(
      (d) =>
        (GradeKeyToKorean as Record<string, string>)[d.gradeKey] ?? d.gradeKey
    );
    const longest = labels.reduce((a, b) => (b.length > a.length ? b : a), "");
    const estimatedHeight = Math.min(
      70,
      28 + Math.floor(longest.length / 4) * 10
    );
    const MARGIN = { ...BASE_MARGIN, bottom: estimatedHeight } as const;

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
      yMaxOverride ?? d3.max(data, (d: PriceDatum) => d.unitPriceWon) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxY * 1.05])
      .range([innerHeight, 0])
      .nice();

    const axisColor = theme.palette.text.secondary;
    const fontFamily = theme.typography.fontFamily as string;

    // grid
    g.selectAll<SVGGElement, unknown>("g.grid")
      .data([null])
      .join("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      )
      .call((sel) => {
        sel
          .selectAll("line")
          .attr("stroke", theme.palette.divider)
          .attr("stroke-opacity", 0.6);
        sel.selectAll("path").remove();
      });

    // x-axis
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
              (GradeKeyToKorean as Record<string, string>)[val] ?? val
          )
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

    // y-axis
    g.selectAll<SVGGElement, unknown>("g.y-axis")
      .data([null])
      .join("g")
      .attr("class", "y-axis")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((v: d3.NumberValue) => `${Number(v).toLocaleString()}`)
      )
      .call((gAxis) => {
        gAxis
          .selectAll<SVGTextElement, unknown>("text")
          .style("font-family", fontFamily)
          .style("font-size", "11px")
          .style("fill", theme.palette.text.secondary);
        gAxis.selectAll("path, line").attr("stroke", axisColor);
      });

    // y label
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
      .style("font-weight", 600);
    // .text("평균 단가 (원/kg)");

    const colorMain = theme.palette.chart.price.main;
    const colorLight = theme.palette.chart.price.light;
    const colorDark = theme.palette.chart.price.dark;
    const barColor = theme.palette.mode === "dark" ? colorLight : colorMain;
    const barHover = theme.palette.mode === "dark" ? colorMain : colorDark;

    // gradient
    const defsSel = svg.select("defs").empty()
      ? svg.append("defs")
      : svg.select("defs");
    const gradientId = `bar-gradient-price-${theme.palette.mode}`;
    defsSel.select(`#${gradientId}`).remove();
    const gradient = defsSel
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", barColor)
      .attr("stop-opacity", 0.9);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", colorLight)
      .attr("stop-opacity", 0.7);

    // plot layer
    const plot = g
      .selectAll<SVGGElement, unknown>("g.plot")
      .data([null])
      .join("g")
      .attr("class", "plot");

    const bars = plot
      .selectAll<SVGRectElement, PriceDatum>("rect")
      .data(data, (d: PriceDatum) => d.gradeKey);

    const mergedBars = bars
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d: PriceDatum) => x(d.gradeKey) ?? 0)
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
            .remove()
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
    mergedBars.append("title").text((d: PriceDatum) => {
      const label =
        (GradeKeyToKorean as Record<string, string>)[d.gradeKey] ?? d.gradeKey;
      return `${label}`;
    });

    mergedBars
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr("x", (d: PriceDatum) => x(d.gradeKey) ?? 0)
      .attr("y", (d) => y(d.unitPriceWon))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerHeight - y(d.unitPriceWon));

    // value labels
    plot
      .selectAll<SVGTextElement, PriceDatum>("text.bar-value")
      .data(data, (d: any) => d.gradeKey)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "bar-value")
            .attr("x", (d) => (x(d.gradeKey) ?? 0) + x.bandwidth() / 2)
            .attr("y", (d) => y(d.unitPriceWon) - 6)
            .attr("text-anchor", "middle")
            .style("font-family", fontFamily)
            .style("font-size", "10px")
            .style("fill", theme.palette.text.secondary)
            .style("opacity", 0)
            .text((d) => Math.round(d.unitPriceWon).toLocaleString())
            .call((sel) =>
              sel.transition().delay(400).duration(400).style("opacity", 1)
            ),
        (update) =>
          update
            .attr("x", (d) => (x(d.gradeKey) ?? 0) + x.bandwidth() / 2)
            .attr("y", (d) => y(d.unitPriceWon) - 6)
            .text((d) => Math.round(d.unitPriceWon).toLocaleString()),
        (exit) => exit.remove()
      );
  };

  useEffect(() => {
    draw();
  }, [data]);

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <svg ref={svgRef} role="img" aria-label="등급별 평균 단가 막대 차트" />
    </div>
  );
};

export default DashboardChartGradePerPrice;
