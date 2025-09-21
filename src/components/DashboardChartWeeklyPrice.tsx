import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useTheme } from "@mui/material/styles";
import type { WeeklyPriceDatum } from "../types/data";
import { GradeKeyToKorean } from "../const/Common";

type DashboardChartWeeklyPriceProps = {
  data: WeeklyPriceDatum[];
  height?: number;
  yMaxOverride?: number;
};

export default function DashboardChartWeeklyPrice({
  data,
  height = 400,
  yMaxOverride,
}: DashboardChartWeeklyPriceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;

    let currentWidth;
    if (containerWidth > 0) {
      currentWidth = containerWidth;
    } else {
      currentWidth = container.getBoundingClientRect().width;
    }

    // Clear previous content
    svg.selectAll("*").remove();

    // Responsive margins based on container width
    const isMobile = currentWidth < 600;

    let margin;
    if (isMobile) {
      margin = { top: 20, right: 20, bottom: 100, left: 60 }; // Mobile: 범례를 아래로
    } else {
      margin = { top: 20, right: 120, bottom: 60, left: 80 }; // Desktop: 범례를 오른쪽
    }

    const innerWidth = currentWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    // Process data: group by date and grade
    const dateFormat = d3.timeParse("%Y-%m-%d");
    const processedData = data.map((d) => ({
      ...d,
      parsedDate: dateFormat(d.date)!,
    }));

    // Get unique dates and grades
    const dates = Array.from(new Set(processedData.map((d) => d.date))).sort();
    const grades = Array.from(
      new Set(processedData.map((d) => d.gradeKey))
    ).sort();

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(processedData, (d) => d.parsedDate) as [Date, Date])
      .range([0, innerWidth]);

    const yMax =
      yMaxOverride || d3.max(processedData, (d) => d.unitPriceWon) || 0;
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([innerHeight, 0]);

    // Color scale for grades - distinct multi-line palette
    const colorScale = d3.scaleOrdinal<string>().domain(grades).range([
      "#e53e3e", // grade1 - 빨강 (최고등급)
      "#3182ce", // grade2 - 파랑
      "#38a169", // grade3Stopped - 초록
      "#805ad5", // grade3Estimated - 보라
      "#d69e2e", // gradeBelow - 주황
      "#718096", // mixedGrade - 회색
    ]);

    // Create main group
    const mainGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Add defs for later use
    const defs = svg.append("defs");

    // Add drop shadow filter
    const filter = defs
      .append("filter")
      .attr("id", "drop-shadow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");

    const floodColor = theme.palette.mode === "dark" ? "#000" : "#666";

    filter
      .append("feDropShadow")
      .attr("dx", 1)
      .attr("dy", 1)
      .attr("stdDeviation", 1)
      .attr("flood-color", floodColor)
      .attr("flood-opacity", 0.3);

    // Add grid lines
    mainGroup
      .append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks(5))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", theme.palette.divider)
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.7);

    // Create line generator
    const line = d3
      .line<{ date: Date; price: number }>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.price))
      .curve(d3.curveMonotoneX);

    // Group data by grade
    const gradeData = grades
      .map((gradeKey) => {
        const gradePoints = dates
          .map((date) => {
            const point = processedData.find(
              (d) => d.date === date && d.gradeKey === gradeKey
            );
            return point
              ? {
                  date: point.parsedDate,
                  price: point.unitPriceWon,
                  quantity: point.quantityKg,
                  originalDate: date,
                  gradeKey,
                }
              : null;
          })
          .filter(Boolean) as Array<{
          date: Date;
          price: number;
          quantity: number;
          originalDate: string;
          gradeKey: string;
        }>;

        return {
          gradeKey,
          points: gradePoints,
          color: colorScale(gradeKey),
        };
      })
      .filter((d) => d.points.length > 0);

    // Draw lines with enhanced styling
    gradeData.forEach((grade, index) => {
      const path = mainGroup
        .append("path")
        .datum(grade.points)
        .attr("fill", "none")
        .attr("stroke", grade.color)
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("filter", "url(#drop-shadow)")
        .attr(
          "d",
          line.x((d) => xScale(d.date)).y((d) => yScale(d.price))
        );

      // Animate line drawing
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .delay(index * 200)
        .ease(d3.easeCircleOut)
        .attr("stroke-dashoffset", 0);

      // Add points with enhanced styling
      const points = mainGroup
        .selectAll(`.point-${grade.gradeKey}`)
        .data(grade.points)
        .join("circle")
        .attr("class", `point-${grade.gradeKey}`)
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.price))
        .attr("r", 0)
        .attr("fill", grade.color)
        .attr("stroke", theme.palette.background.paper)
        .attr("stroke-width", 3)
        .attr("filter", "url(#drop-shadow)")
        .style("cursor", "pointer");

      // Animate points appearance
      points
        .transition()
        .duration(800)
        .delay((_, i) => index * 200 + i * 50)
        .attr("r", 5);

      // Add event listeners
      points
        .on("mouseenter", function (event, d: any) {
          // Remove any existing tooltips first
          d3.selectAll("#chart-tooltip").remove();

          // Tooltip
          const tooltip = d3
            .select("body")
            .append("div")
            .attr("id", "chart-tooltip")
            .style("position", "absolute")
            .style("background", theme.palette.background.paper)
            .style("border", `1px solid ${theme.palette.divider}`)
            .style("border-radius", "8px")
            .style("padding", "12px")
            .style("font-size", "13px")
            .style("box-shadow", theme.shadows[4])
            .style("pointer-events", "none")
            .style("z-index", "1000")
            .style("opacity", 0);

          tooltip.html(`
            <div style="font-weight: bold; color: ${
              grade.color
            }; margin-bottom: 4px;">
              ${
                GradeKeyToKorean[d.gradeKey as keyof typeof GradeKeyToKorean] ||
                d.gradeKey
              }
            </div>
            <div>📅 날짜: ${d.originalDate}</div>
            <div>💰 가격: ${d.price.toLocaleString()}원/kg</div>
            <div>📦 수량: ${d.quantity.toLocaleString()}kg</div>
          `);

          const [mouseX, mouseY] = d3.pointer(event, document.body);
          tooltip
            .style("left", mouseX + 15 + "px")
            .style("top", mouseY - 10 + "px")
            .transition()
            .duration(200)
            .style("opacity", 1);

          // Highlight point with pulse effect
          d3.select(this as SVGCircleElement)
            .transition()
            .duration(200)
            .attr("r", 8)
            .attr("stroke-width", 4);

          // Remove any existing pulse rings first
          mainGroup.selectAll(".pulse-ring").remove();

          // Add pulse ring
          mainGroup
            .append("circle")
            .attr("class", "pulse-ring")
            .attr("cx", d3.select(this as SVGCircleElement).attr("cx"))
            .attr("cy", d3.select(this as SVGCircleElement).attr("cy"))
            .attr("r", 5)
            .attr("fill", "none")
            .attr("stroke", grade.color)
            .attr("stroke-width", 2)
            .attr("opacity", 0.7)
            .transition()
            .duration(1000)
            .attr("r", 15)
            .attr("opacity", 0)
            .remove();
        })
        .on("mouseleave", function () {
          // Clean up tooltips and pulse rings
          d3.selectAll("#chart-tooltip").remove();
          mainGroup.selectAll(".pulse-ring").remove();

          d3.select(this as SVGCircleElement)
            .transition()
            .duration(200)
            .attr("r", 5)
            .attr("stroke-width", 3);
        });
    });

    // Add axes with responsive ticks
    const xTickCount = isMobile ? 4 : 7; // 모바일에서 틱 수 줄임
    const yTickCount = isMobile ? 4 : 5; // 모바일에서 틱 수 줄임

    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => d3.timeFormat("%m/%d")(d as Date))
      .ticks(xTickCount);

    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => `${Math.round(d as number).toLocaleString()}원`)
      .ticks(yTickCount);

    const axisFontSize = isMobile ? "10px" : "12px"; // 모바일에서 폰트 크기 줄임

    mainGroup
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis as any)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", axisFontSize);

    mainGroup
      .append("g")
      .call(yAxis as any)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", axisFontSize);

    // Style axis lines
    mainGroup
      .selectAll(".domain")
      .style("stroke", theme.palette.text.secondary);
    mainGroup
      .selectAll(".tick line")
      .style("stroke", theme.palette.text.secondary);

    // Add Y axis label with responsive positioning
    const yLabelPosition = isMobile ? -45 : -60; // 모바일에서 Y축 라벨 위치 조정
    const yLabelFontSize = isMobile ? "12px" : "14px"; // 모바일에서 폰트 크기 줄임

    mainGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", yLabelPosition)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.primary)
      .style("font-size", yLabelFontSize)
      .style("font-weight", "500")
      .text("단가 (원/kg)");

    // Add legend with responsive positioning
    let legendTransform;
    if (isMobile) {
      legendTransform = `translate(0, ${innerHeight + 40})`; // Mobile: 차트 아래
    } else {
      legendTransform = `translate(${innerWidth + 20}, 20)`; // Desktop: 차트 오른쪽
    }

    const legend = mainGroup.append("g").attr("transform", legendTransform);

    gradeData.forEach((grade, i) => {
      let legendItemTransform;
      if (isMobile) {
        legendItemTransform = `translate(${(i % 3) * (innerWidth / 3)}, ${
          Math.floor(i / 3) * 25
        })`; // Mobile: 3열 그리드
      } else {
        legendItemTransform = `translate(0, ${i * 25})`; // Desktop: 세로 나열
      }

      const legendItem = legend
        .append("g")
        .attr("transform", legendItemTransform);

      const lineX2 = isMobile ? 15 : 20; // 모바일에서 범례 선 짧게
      const circleCx = isMobile ? 7.5 : 10; // 모바일에서 중심점 조정
      const textX = isMobile ? 20 : 25; // 모바일에서 텍스트 위치 조정
      const legendFontSize = isMobile ? "10px" : "12px"; // 모바일에서 폰트 크기 줄임

      legendItem
        .append("line")
        .attr("x1", 0)
        .attr("x2", lineX2)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", grade.color)
        .attr("stroke-width", 2.5);

      legendItem
        .append("circle")
        .attr("cx", circleCx)
        .attr("cy", 0)
        .attr("r", 3)
        .attr("fill", grade.color);

      legendItem
        .append("text")
        .attr("x", textX)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .style("fill", theme.palette.text.primary)
        .style("font-size", legendFontSize)
        .text(
          GradeKeyToKorean[grade.gradeKey as keyof typeof GradeKeyToKorean] ||
            grade.gradeKey
        );
    });
  }, [data, height, yMaxOverride, theme, containerWidth]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.getBoundingClientRect().width;
        setContainerWidth(newWidth);
      }
    };

    // Set initial size
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ display: "block" }}
      />
    </div>
  );
}
