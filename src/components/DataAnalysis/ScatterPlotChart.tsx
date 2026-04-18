import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import type { ScatterDatum } from "../../utils/analysisUtils";
import { GradeKeyToKorean } from "../../const/Common";
import { useContainerSize } from "../../hooks/useContainerSize";
import { isLargeDisplay } from "../../utils/d3/chartMargins";
import { FONT_SIZES } from "../../const/Numbers";
import { createD3Tooltip, removeD3Tooltip } from "../../utils/d3Tooltip";
import { getGradeColorMap } from "../../utils/chartUtils";
import { useChartExport } from "../../hooks/useChartExport";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";

interface ScatterPlotChartProps {
  data: ScatterDatum[];
  height?: number;
}

export default function ScatterPlotChart({
  data,
  height = 320,
}: ScatterPlotChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width: containerWidth }] = useContainerSize();
  const theme = useTheme();
  const [showTrend, setShowTrend] = useState(false);
  const { exportToPng } = useChartExport(svgRef, theme.palette.background.paper);

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const gradeColors = getGradeColorMap(theme);

    const isMobile = containerWidth < 500;
    const fontSize = isLargeDisplay()
      ? isMobile
        ? FONT_SIZES.LARGE.MOBILE
        : FONT_SIZES.LARGE.DESKTOP
      : isMobile
        ? FONT_SIZES.MOBILE
        : FONT_SIZES.DESKTOP;
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
        d3.select(this as SVGCircleElement)
          .transition()
          .duration(150)
          .attr("r", isMobile ? 6 : 8)
          .attr("opacity", 1);

        const gradeName =
          GradeKeyToKorean[d.gradeKey as keyof typeof GradeKeyToKorean] ||
          d.gradeKey;
        const color = gradeColors[d.gradeKey] || "#888";

        const tooltip = createD3Tooltip(theme);

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
        removeD3Tooltip();
        d3.select(this as SVGCircleElement)
          .transition()
          .duration(150)
          .attr("r", isMobile ? 4 : 5)
          .attr("opacity", 0.7);
      });

    // Axes

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
      .style("font-size", fontSize.AXIS);

    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${Math.round(d.valueOf()).toLocaleString()}`)
      )
      .selectAll("text")
      .style("fill", theme.palette.text.secondary)
      .style("font-size", fontSize.AXIS);

    // Axis labels

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + (isMobile ? 32 : 38))
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.secondary)
      .style("font-size", fontSize.TITLE)
      .text("물량 (kg)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", isMobile ? -40 : -52)
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.secondary)
      .style("font-size", fontSize.TITLE)
      .text("단가 (원/kg)");

    // Style axis lines
    g.selectAll(".domain").style("stroke", theme.palette.divider);
    g.selectAll(".tick line").style("stroke", theme.palette.divider);

    return () => removeD3Tooltip();
  }, [data, height, theme, containerWidth, showTrend]);

  return (
    <SectionCard sx={{ height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            가격-물량 상관
          </Typography>
          {data.length > 0 && (
            <Tooltip title="PNG 다운로드">
              <IconButton size="small" onClick={() => exportToPng("가격물량상관")}>
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
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
          <EmptyState height={height} />
        )}
      </div>
    </SectionCard>
  );
}
