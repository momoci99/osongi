import { useEffect, useRef, useState } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import * as d3 from "d3";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
      setContainerHeight(entries[0].contentRect.height);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "0.75rem",
        backgroundColor: theme.palette.background.paper,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        지역별 평균 가격
      </Typography>
      <div ref={containerRef} style={{ width: "100%", flex: 1 }}>
        {data.length > 0 ? (
          <svg ref={svgRef} style={{ display: "block" }} />
        ) : (
          <Box
            sx={{
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              표시할 데이터가 없습니다
            </Typography>
            <Typography variant="caption" color="text.secondary">
              필터 조건을 조정해보세요
            </Typography>
          </Box>
        )}
      </div>
    </Paper>
  );
}
