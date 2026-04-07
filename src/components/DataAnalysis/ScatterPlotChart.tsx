import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  useTheme,
} from "@mui/material";
import type { ScatterDatum } from "../../utils/analysisUtils";
import { GradeKeyToKorean } from "../../const/Common";

interface ScatterPlotChartProps {
  data: ScatterDatum[];
  height?: number;
}

export default function ScatterPlotChart({
  data,
  height = 320,
}: ScatterPlotChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [showTrend, setShowTrend] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const chart = theme.palette.chart;
    const gradeColors: Record<string, string> = {
      grade1: chart.grade1,
      grade2: chart.grade2,
      grade3Stopped: chart.grade3Stopped,
      grade3Estimated: chart.grade3Estimated,
      gradeBelow: chart.gradeBelow,
      mixedGrade: chart.mixedGrade,
    };

    const isMobile = containerWidth < 500;
    const margin = isMobile
      ? { top: 16, right: 16, bottom: 40, left: 55 }
      : { top: 16, right: 20, bottom: 44, left: 70 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xMax = d3.max(data, (d) => d.quantityKg) || 1;
    const yMax = d3.max(data, (d) => d.unitPriceWon) || 1;

    const xScale = d3
      .scaleLinear()
      .domain([0, xMax * 1.1])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
      .nice()
      .range([innerHeight, 0]);

    // Grid
    g.append("g")
      .selectAll("line")
      .data(yScale.ticks(5))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", theme.palette.divider)
      .attr("stroke-width", 0.5);

    // Trend line (linear regression)
    if (showTrend && data.length > 2) {
      const n = data.length;
      const sumX = d3.sum(data, (d) => d.quantityKg);
      const sumY = d3.sum(data, (d) => d.unitPriceWon);
      const sumXY = d3.sum(data, (d) => d.quantityKg * d.unitPriceWon);
      const sumX2 = d3.sum(data, (d) => d.quantityKg * d.quantityKg);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const x1 = 0;
      const x2 = xMax * 1.1;
      const y1 = intercept;
      const y2 = slope * x2 + intercept;

      g.append("line")
        .attr("x1", xScale(x1))
        .attr("y1", yScale(Math.max(0, y1)))
        .attr("x2", xScale(x2))
        .attr("y2", yScale(Math.max(0, y2)))
        .attr("stroke", theme.palette.text.secondary)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "6,4")
        .attr("opacity", 0.6);
    }

    // Points
    const dots = g
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.quantityKg))
      .attr("cy", (d) => yScale(d.unitPriceWon))
      .attr("r", 0)
      .attr("fill", (d) => gradeColors[d.gradeKey] || theme.palette.grey[500])
      .attr("opacity", 0.7)
      .attr("stroke", theme.palette.background.paper)
      .attr("stroke-width", 1)
      .style("cursor", "pointer");

    dots
      .transition()
      .duration(400)
      .delay((_, i) => Math.min(i * 3, 300))
      .attr("r", isMobile ? 4 : 5);

    // Tooltip
    dots
      .on("mouseenter", function (event, d: any) {
        d3.selectAll("#scatter-tooltip").remove();
        d3.select(this as SVGCircleElement)
          .transition()
          .duration(150)
          .attr("r", isMobile ? 6 : 8)
          .attr("opacity", 1);

        const gradeName =
          GradeKeyToKorean[d.gradeKey as keyof typeof GradeKeyToKorean] ||
          d.gradeKey;
        const color = gradeColors[d.gradeKey] || "#888";

        const tooltip = d3
          .select("body")
          .append("div")
          .attr("id", "scatter-tooltip")
          .style("position", "absolute")
          .style("background", theme.palette.background.paper)
          .style("border", `1px solid ${theme.palette.divider}`)
          .style("border-radius", "8px")
          .style("padding", "10px 12px")
          .style("font-size", "12px")
          .style("box-shadow", theme.shadows[4])
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .style("color", theme.palette.text.primary);

        tooltip.html(`
          <div style="font-weight:600;color:${color};margin-bottom:3px;">${gradeName}</div>
          <div>${d.date} | ${d.region} ${d.union}</div>
          <div>물량: ${d.quantityKg.toLocaleString()}kg</div>
          <div>단가: ${d.unitPriceWon.toLocaleString()}원/kg</div>
        `);

        const [mx, my] = d3.pointer(event, document.body);
        tooltip.style("left", mx + 12 + "px").style("top", my - 10 + "px");
      })
      .on("mouseleave", function () {
        d3.selectAll("#scatter-tooltip").remove();
        d3.select(this as SVGCircleElement)
          .transition()
          .duration(150)
          .attr("r", isMobile ? 4 : 5)
          .attr("opacity", 0.7);
      });

    // Axes
    const axisFontSize = isMobile ? "9px" : "11px";

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(isMobile ? 4 : 6)
          .tickFormat((d) => `${d.valueOf().toLocaleString()}`)
      )
      .selectAll("text")
      .style("fill", theme.palette.text.secondary)
      .style("font-size", axisFontSize);

    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${Math.round(d.valueOf()).toLocaleString()}`)
      )
      .selectAll("text")
      .style("fill", theme.palette.text.secondary)
      .style("font-size", axisFontSize);

    // Axis labels
    const labelSize = isMobile ? "10px" : "12px";

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + (isMobile ? 32 : 38))
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.secondary)
      .style("font-size", labelSize)
      .text("물량 (kg)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", isMobile ? -40 : -52)
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.secondary)
      .style("font-size", labelSize)
      .text("단가 (원/kg)");

    // Style axis lines
    g.selectAll(".domain").style("stroke", theme.palette.divider);
    g.selectAll(".tick line").style("stroke", theme.palette.divider);
  }, [data, height, theme, containerWidth, showTrend]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "0.75rem",
        backgroundColor: theme.palette.background.paper,
        height: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          가격-물량 상관
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showTrend}
              onChange={() => setShowTrend(!showTrend)}
              size="small"
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              추세선
            </Typography>
          }
        />
      </Box>
      <div ref={containerRef} style={{ width: "100%" }}>
        {data.length > 0 ? (
          <svg
            ref={svgRef}
            width="100%"
            height={height}
            style={{ display: "block" }}
          />
        ) : (
          <Box
            sx={{
              height,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              데이터 없음
            </Typography>
          </Box>
        )}
      </div>
    </Paper>
  );
}
