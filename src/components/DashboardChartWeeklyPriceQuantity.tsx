import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useTheme } from "@mui/material/styles";
import type { WeeklyPriceDatum } from "../types/data";
import { GradeKeyToKorean } from "../const/Common";

type DashboardChartWeeklyPriceQuantityProps = {
  data: WeeklyPriceDatum[];
  height?: number;
  showQuantity?: boolean; // 수량 표시 여부
};

export default function DashboardChartWeeklyPriceQuantity({
  data,
  height = 400,
  showQuantity = true,
}: DashboardChartWeeklyPriceQuantityProps) {
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
      margin = { top: 20, right: 60, bottom: 120, left: 60 }; // Mobile: 양쪽 Y축, 범례 공간 확보
    } else {
      margin = { top: 20, right: 80, bottom: 100, left: 80 }; // Desktop: 양쪽 Y축, 범례 공간 확보
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

    // Y scale for price (left axis)
    const priceMax = d3.max(processedData, (d) => d.unitPriceWon) || 0;
    const priceScale = d3
      .scaleLinear()
      .domain([0, priceMax])
      .nice()
      .range([innerHeight, 0]);

    // Y scale for quantity (right axis)
    const quantityMax = d3.max(processedData, (d) => d.quantityKg) || 0;
    const quantityScale = d3
      .scaleLinear()
      .domain([0, quantityMax])
      .nice()
      .range([innerHeight, 0]);

    // Color scale for grades
    const colorScale = d3.scaleOrdinal<string>().domain(grades).range([
      "#e53e3e", // grade1 - 빨강
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

    // Add defs for filters
    const defs = svg.append("defs");
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

    // Add grid lines for price
    mainGroup
      .append("g")
      .attr("class", "price-grid")
      .selectAll("line")
      .data(priceScale.ticks(5))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => priceScale(d))
      .attr("y2", (d) => priceScale(d))
      .attr("stroke", theme.palette.divider)
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.7);

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

    // Create line generators
    const priceLine = d3
      .line<{ date: Date; price: number }>()
      .x((d) => xScale(d.date))
      .y((d) => priceScale(d.price))
      .curve(d3.curveMonotoneX);

    const quantityLine = d3
      .line<{ date: Date; quantity: number }>()
      .x((d) => xScale(d.date))
      .y((d) => quantityScale(d.quantity))
      .curve(d3.curveMonotoneX);

    // Draw price lines (solid)
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
          priceLine.x((d) => xScale(d.date)).y((d) => priceScale(d.price))
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

      // Add price points
      const pricePoints = mainGroup
        .selectAll(`.price-point-${grade.gradeKey}`)
        .data(grade.points)
        .join("circle")
        .attr("class", `price-point-${grade.gradeKey}`)
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => priceScale(d.price))
        .attr("r", 0)
        .attr("fill", grade.color)
        .attr("stroke", theme.palette.background.paper)
        .attr("stroke-width", 2)
        .style("cursor", "pointer");

      pricePoints
        .transition()
        .duration(800)
        .delay((_, i) => index * 200 + i * 50)
        .attr("r", 4);
    });

    // Draw quantity lines (dashed) if enabled
    if (showQuantity) {
      gradeData.forEach((grade, index) => {
        mainGroup
          .append("path")
          .datum(grade.points)
          .attr("fill", "none")
          .attr("stroke", grade.color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("opacity", 0.7)
          .attr(
            "d",
            quantityLine
              .x((d) => xScale(d.date))
              .y((d) => quantityScale(d.quantity))
          );

        // Add quantity points (square)
        const quantityPoints = mainGroup
          .selectAll(`.quantity-point-${grade.gradeKey}`)
          .data(grade.points)
          .join("rect")
          .attr("class", `quantity-point-${grade.gradeKey}`)
          .attr("x", (d) => xScale(d.date) - 2)
          .attr("y", (d) => quantityScale(d.quantity) - 2)
          .attr("width", 0)
          .attr("height", 0)
          .attr("fill", grade.color)
          .attr("stroke", theme.palette.background.paper)
          .attr("stroke-width", 1)
          .style("cursor", "pointer");

        quantityPoints
          .transition()
          .duration(800)
          .delay((_, i) => index * 200 + i * 50)
          .attr("width", 4)
          .attr("height", 4);
      });
    }

    // Add axes
    const xTickCount = isMobile ? 4 : 7;
    const yTickCount = isMobile ? 4 : 5;

    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => d3.timeFormat("%m/%d")(d as Date))
      .ticks(xTickCount);

    const priceAxis = d3
      .axisLeft(priceScale)
      .tickFormat((d) => `${Math.round(d as number).toLocaleString()}원`)
      .ticks(yTickCount);

    const quantityAxis = d3
      .axisRight(quantityScale)
      .tickFormat((d) => `${Math.round(d as number).toLocaleString()}kg`)
      .ticks(yTickCount);

    const axisFontSize = isMobile ? "10px" : "12px";

    // X axis
    mainGroup
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis as any)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", axisFontSize);

    // Price axis (left)
    mainGroup
      .append("g")
      .call(priceAxis as any)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", axisFontSize);

    // Quantity axis (right)
    if (showQuantity) {
      mainGroup
        .append("g")
        .attr("transform", `translate(${innerWidth}, 0)`)
        .call(quantityAxis as any)
        .selectAll("text")
        .style("fill", theme.palette.text.primary)
        .style("font-size", axisFontSize);
    }

    // Style axis lines
    mainGroup
      .selectAll(".domain")
      .style("stroke", theme.palette.text.secondary);
    mainGroup
      .selectAll(".tick line")
      .style("stroke", theme.palette.text.secondary);

    // Add Y axis labels
    const yLabelPosition = isMobile ? -45 : -60;
    const yLabelFontSize = isMobile ? "12px" : "14px";

    // Price label (left)
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

    // Quantity label (right)
    if (showQuantity) {
      mainGroup
        .append("text")
        .attr("transform", "rotate(90)")
        .attr("y", -innerWidth - (isMobile ? 45 : 60))
        .attr("x", innerHeight / 2)
        .attr("text-anchor", "middle")
        .style("fill", theme.palette.text.primary)
        .style("font-size", yLabelFontSize)
        .style("font-weight", "500")
        .text("수량 (kg)");
    }

    // Add legend
    let legendTransform;
    if (isMobile) {
      legendTransform = `translate(0, ${innerHeight + 40})`;
    } else {
      legendTransform = `translate(0, ${innerHeight + 50})`;
    }

    const legend = mainGroup.append("g").attr("transform", legendTransform);

    gradeData.forEach((grade, i) => {
      let legendItemTransform;
      if (isMobile) {
        legendItemTransform = `translate(${(i % 3) * (innerWidth / 3)}, ${
          Math.floor(i / 3) * 25
        })`;
      } else {
        legendItemTransform = `translate(${(i % 6) * (innerWidth / 6)}, ${
          Math.floor(i / 6) * 25
        })`;
      }

      const legendItem = legend
        .append("g")
        .attr("transform", legendItemTransform);

      const lineX2 = isMobile ? 15 : 20;
      const textX = isMobile ? 20 : 25;
      const legendFontSize = isMobile ? "10px" : "12px";

      // Price line (solid)
      legendItem
        .append("line")
        .attr("x1", 0)
        .attr("x2", lineX2)
        .attr("y1", -5)
        .attr("y2", -5)
        .attr("stroke", grade.color)
        .attr("stroke-width", 2);

      // Quantity line (dashed)
      if (showQuantity) {
        legendItem
          .append("line")
          .attr("x1", 0)
          .attr("x2", lineX2)
          .attr("y1", 5)
          .attr("y2", 5)
          .attr("stroke", grade.color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "3,3")
          .attr("opacity", 0.7);
      }

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

    // Add legend labels for line types
    if (showQuantity) {
      const legendLabels = legend
        .append("g")
        .attr(
          "transform",
          isMobile
            ? `translate(0, ${Math.ceil(gradeData.length / 3) * 25 + 10})`
            : `translate(0, ${Math.ceil(gradeData.length / 6) * 25 + 10})`
        );

      legendLabels
        .append("line")
        .attr("x1", 0)
        .attr("x2", 15)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", theme.palette.text.secondary)
        .attr("stroke-width", 2);

      legendLabels
        .append("text")
        .attr("x", 20)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .style("fill", theme.palette.text.secondary)
        .style("font-size", isMobile ? "9px" : "10px")
        .text("가격");

      legendLabels
        .append("line")
        .attr("x1", 0)
        .attr("x2", 15)
        .attr("y1", 15)
        .attr("y2", 15)
        .attr("stroke", theme.palette.text.secondary)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0.7);

      legendLabels
        .append("text")
        .attr("x", 20)
        .attr("y", 15)
        .attr("dy", "0.35em")
        .style("fill", theme.palette.text.secondary)
        .style("font-size", isMobile ? "9px" : "10px")
        .text("수량");
    }
  }, [data, height, showQuantity, theme, containerWidth]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.getBoundingClientRect().width;
        setContainerWidth(newWidth);
      }
    };

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
