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

    const margin = { top: 8, right: 100, bottom: 8, left: 60 };
    const barHeight = 32;
    const barGap = 10;
    const height =
      data.length * (barHeight + barGap) + margin.top + margin.bottom;
    const width = containerWidth - margin.left - margin.right;

    if (width <= 0) return;

    svg.attr("width", containerWidth).attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.avgPrice) || 1])
      .range([0, width]);

    // Bars
    g.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (_, i) => i * (barHeight + barGap))
      .attr("width", 0)
      .attr("height", barHeight)
      .attr("rx", 4)
      .attr("fill", (_, i) =>
        i === 0 ? theme.palette.primary.main : theme.palette.secondary.main
      )
      .attr("opacity", 0.85)
      .transition()
      .duration(500)
      .delay((_, i) => i * 80)
      .attr("width", (d) => xScale(d.avgPrice));

    // Region labels (left)
    g.selectAll(".region-label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", -8)
      .attr("y", (_, i) => i * (barHeight + barGap) + barHeight / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("fill", theme.palette.text.primary)
      .style("font-size", "0.8125rem")
      .style("font-weight", "500")
      .text((d) => d.region);

    // Value labels (right)
    g.selectAll(".value-label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", (d) => xScale(d.avgPrice) + 8)
      .attr("y", (_, i) => i * (barHeight + barGap) + barHeight / 2)
      .attr("dy", "0.35em")
      .attr("fill", theme.palette.text.primary)
      .style("font-size", "0.75rem")
      .style("font-weight", "600")
      .style("font-variant-numeric", "tabular-nums")
      .text((d) => `${d.avgPrice.toLocaleString()}원/kg`);
  }, [data, theme, containerWidth]);

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
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        지역별 평균 가격
      </Typography>
      <div ref={containerRef} style={{ width: "100%" }}>
        {data.length > 0 ? (
          <svg ref={svgRef} style={{ display: "block" }} />
        ) : (
          <Box
            sx={{
              height: 120,
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
