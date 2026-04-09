import { useEffect, useRef } from "react";
import { Typography, useTheme } from "@mui/material";
import * as d3 from "d3";
import { useContainerSize } from "../../hooks/useContainerSize";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";

interface RegionData {
  region: string;
  avgPrice: number;
  totalQuantity: number;
}

interface RegionComparisonSectionProps {
  data: RegionData[];
}

export default function RegionComparisonSection({
  data,
}: RegionComparisonSectionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width: containerWidth, height: containerHeight }] = useContainerSize();
  const theme = useTheme();

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0 || containerHeight === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 12, right: 20, bottom: 36, left: 52 };
    const height = containerHeight;
    const availableHeight = height - margin.top - margin.bottom;
    const rowHeight = Math.max(availableHeight / data.length, 56);
    const width = containerWidth - margin.left - margin.right;

    if (width <= 0) return;

    svg.attr("width", containerWidth).attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const dotColors = [
      theme.palette.chart.grade1,
      theme.palette.chart.grade2,
      theme.palette.chart.grade3Stopped,
      theme.palette.secondary.main,
      theme.palette.chart.grade3Estimated,
    ];

    const maxPrice = d3.max(data, (d) => d.avgPrice) || 1;
    const xScale = d3
      .scaleLinear()
      .domain([0, maxPrice * 1.15])
      .range([0, width]);

    // Grid lines
    const ticks = xScale.ticks(4);
    g.selectAll(".grid-line")
      .data(ticks)
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", -4)
      .attr("y2", data.length * rowHeight - rowHeight / 2 + 8)
      .attr("stroke", theme.palette.divider)
      .attr("stroke-width", 0.5);

    // X axis labels
    g.selectAll(".grid-label")
      .data(ticks)
      .enter()
      .append("text")
      .attr("x", (d) => xScale(d))
      .attr("y", data.length * rowHeight - rowHeight / 2 + 24)
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.secondary)
      .style("font-size", "0.7rem")
      .style("font-variant-numeric", "tabular-nums")
      .text((d) => `${d.valueOf().toLocaleString()}`);

    data.forEach((d, i) => {
      const cy = i * rowHeight + rowHeight / 2;
      const cx = xScale(d.avgPrice);
      const color = dotColors[i % dotColors.length];

      // Stem line
      g.append("line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", cy)
        .attr("y2", cy)
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("opacity", 0.6)
        .transition()
        .duration(500)
        .delay(i * 100)
        .attr("x2", cx);

      // Dot
      g.append("circle")
        .attr("cx", 0)
        .attr("cy", cy)
        .attr("r", 0)
        .attr("fill", color)
        .attr("stroke", theme.palette.background.paper)
        .attr("stroke-width", 2)
        .transition()
        .duration(500)
        .delay(i * 100)
        .attr("cx", cx)
        .attr("r", 8);

      // Region label (left)
      g.append("text")
        .attr("x", -10)
        .attr("y", cy)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", theme.palette.text.primary)
        .style("font-size", "0.875rem")
        .style("font-weight", "600")
        .text(d.region);

      // Price label (above dot)
      g.append("text")
        .attr("x", cx)
        .attr("y", cy - 14)
        .attr("text-anchor", "middle")
        .attr("fill", theme.palette.text.primary)
        .style("font-size", "0.8rem")
        .style("font-weight", "700")
        .style("font-variant-numeric", "tabular-nums")
        .text(`${d.avgPrice.toLocaleString()}원`);

      // Quantity label (below dot)
      g.append("text")
        .attr("x", cx)
        .attr("y", cy + 18)
        .attr("text-anchor", "middle")
        .attr("fill", theme.palette.text.secondary)
        .style("font-size", "0.7rem")
        .style("font-variant-numeric", "tabular-nums")
        .text(`${d.totalQuantity.toLocaleString()}kg`);
    });
  }, [data, theme, containerWidth, containerHeight]);

  return (
    <SectionCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        지역별 평균 가격
      </Typography>
      <div ref={containerRef} style={{ width: "100%", flex: 1 }}>
        {data.length > 0 ? (
          <svg ref={svgRef} style={{ display: "block" }} />
        ) : (
          <EmptyState height={120} />
        )}
      </div>
    </SectionCard>
  );
}
