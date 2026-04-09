import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from "@mui/material";
import type { GradeBreakdown } from "../../utils/analysisUtils";
import { GradeKeyToKorean } from "../../const/Common";
import { useContainerSize } from "../../hooks/useContainerSize";
import { createD3Tooltip, removeD3Tooltip } from "../../utils/d3Tooltip";
import { getGradeColorMap } from "../../utils/chartUtils";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";

interface GradeBreakdownChartProps {
  data: GradeBreakdown[];
}

export default function GradeBreakdownChart({
  data,
}: GradeBreakdownChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width: containerWidth }] = useContainerSize();
  const theme = useTheme();
  const [basis, setBasis] = useState<"quantity" | "amount">("quantity");

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const gradeColors = getGradeColorMap(theme);

    const size = Math.min(containerWidth * 0.85, 360);
    const outerRadius = size / 2 - 8;
    const innerRadius = outerRadius * 0.52;
    const height = size + 20;

    svg.attr("width", containerWidth).attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${containerWidth / 2},${size / 2 + 10})`);

    const pieData = data.map((d) => ({
      ...d,
      value: basis === "quantity" ? d.quantityRatio : d.amountRatio,
    }));

    const pie = d3
      .pie<(typeof pieData)[0]>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.02);

    const arc = d3
      .arc<d3.PieArcDatum<(typeof pieData)[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(3);

    const arcHover = d3
      .arc<d3.PieArcDatum<(typeof pieData)[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius + 6)
      .cornerRadius(3);

    g
      .selectAll("path")
      .data(pie(pieData))
      .enter()
      .append("path")
      .attr("d", arc as any)
      .attr(
        "fill",
        (d) => gradeColors[d.data.gradeKey] || theme.palette.grey[500]
      )
      .attr("stroke", theme.palette.background.paper)
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .attr("opacity", 0)
      .transition()
      .duration(500)
      .delay((_, i) => i * 80)
      .attr("opacity", 0.9)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t) => arc(interpolate(t) as any) || "";
      });

    // Hover
    g.selectAll("path")
      .on("mouseenter", function (event, d: any) {
        d3.select(this as SVGPathElement)
          .transition()
          .duration(150)
          .attr("d", arcHover(d) || "")
          .attr("opacity", 1);

        const gradeName =
          GradeKeyToKorean[d.data.gradeKey as keyof typeof GradeKeyToKorean] ||
          d.data.gradeKey;
        const color = gradeColors[d.data.gradeKey] || "#888";
        const pct = (d.data.value * 100).toFixed(1);
        const val =
          basis === "quantity"
            ? `${d.data.quantity.toLocaleString()}kg`
            : `${Math.round(d.data.amount).toLocaleString()}원`;

        const tooltip = createD3Tooltip(theme);

        tooltip.html(
          `<div style="font-weight:600;color:${color};margin-bottom:2px;">${gradeName}</div>` +
            `<div>${pct}% | ${val}</div>`
        );

        const [mx, my] = d3.pointer(event, document.body);
        tooltip.style("left", mx + 12 + "px").style("top", my - 10 + "px");
      })
      .on("mouseleave", function (_, d: any) {
        d3.select(this as SVGPathElement)
          .transition()
          .duration(150)
          .attr("d", arc(d) || "")
          .attr("opacity", 0.9);
        removeD3Tooltip();
      });

    // Center total label
    const totalValue =
      basis === "quantity"
        ? `${data.reduce((s, d) => s + d.quantity, 0).toLocaleString()}kg`
        : `${Math.round(data.reduce((s, d) => s + d.amount, 0)).toLocaleString()}원`;

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.3em")
      .style("fill", theme.palette.text.secondary)
      .style("font-size", "0.8rem")
      .text("합계");

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.1em")
      .style("fill", theme.palette.text.primary)
      .style("font-size", "1rem")
      .style("font-weight", "700")
      .style("font-variant-numeric", "tabular-nums")
      .text(totalValue);

    // Legend (below donut, 2-column)
    const legendY = size / 2 + 24;
    const legendG = g
      .append("g")
      .attr("transform", `translate(${-containerWidth / 2 + 16},${legendY})`);

    const cols = 2;
    const colWidth = (containerWidth - 32) / cols;
    const rowHeight = 28;

    pieData.forEach((d, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const lx = col * colWidth;
      const ly = row * rowHeight;

      const item = legendG
        .append("g")
        .attr("transform", `translate(${lx},${ly})`);

      item
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 3)
        .attr("fill", gradeColors[d.gradeKey] || theme.palette.grey[500])
        .attr("opacity", 0.9);

      const gradeName =
        GradeKeyToKorean[d.gradeKey as keyof typeof GradeKeyToKorean] || d.gradeKey;
      const pct = `${(d.value * 100).toFixed(1)}%`;

      item
        .append("text")
        .attr("x", 18)
        .attr("y", 11)
        .style("fill", theme.palette.text.primary)
        .style("font-size", "0.8rem")
        .style("font-weight", "500")
        .text(gradeName);

      item
        .append("text")
        .attr("x", colWidth - 8)
        .attr("y", 11)
        .attr("text-anchor", "end")
        .style("fill", theme.palette.text.secondary)
        .style("font-size", "0.8rem")
        .style("font-weight", "600")
        .style("font-variant-numeric", "tabular-nums")
        .text(pct);
    });

    // Adjust SVG height to include legend
    const legendRows = Math.ceil(pieData.length / cols);
    const totalHeight = size + 20 + legendRows * rowHeight + 16;
    svg.attr("height", totalHeight);

    return () => removeD3Tooltip();
  }, [data, basis, theme, containerWidth]);

  return (
    <SectionCard sx={{ height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          등급별 비중
        </Typography>
        <ToggleButtonGroup
          value={basis}
          exclusive
          onChange={(_, v) => v && setBasis(v)}
          size="small"
        >
          <ToggleButton value="quantity" sx={{ fontSize: "0.7rem", px: 1 }}>
            수량
          </ToggleButton>
          <ToggleButton value="amount" sx={{ fontSize: "0.7rem", px: 1 }}>
            금액
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <div ref={containerRef} style={{ width: "100%" }}>
        {data.length > 0 ? (
          <svg ref={svgRef} style={{ display: "block" }} />
        ) : (
          <EmptyState />
        )}
      </div>
    </SectionCard>
  );
}
