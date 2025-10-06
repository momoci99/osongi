import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useTheme } from "@mui/material/styles";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { WeeklyPriceDatum } from "../../types/data";
import { GradeKeyToKorean } from "../../const/Common";

type ChartMode = "price" | "quantity";

type DashboardChartWeeklyToggleProps = {
  data: WeeklyPriceDatum[];
  height?: number;
};

export default function DashboardChartWeeklyToggle({
  data,
  height = 400,
}: DashboardChartWeeklyToggleProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [chartMode, setChartMode] = useState<ChartMode>("price");

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ChartMode | null
  ) => {
    if (newMode !== null) {
      setChartMode(newMode);
    }
  };

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

    // Responsive margins
    const isMobile = currentWidth < 600;

    let margin;
    if (isMobile) {
      margin = { top: 20, right: 20, bottom: 100, left: 60 };
    } else {
      margin = { top: 20, right: 120, bottom: 60, left: 80 };
    }

    const innerWidth = currentWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    // Process data
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

    // Y scale based on current mode
    let yMax: number;
    let yScale: d3.ScaleLinear<number, number>;

    if (chartMode === "price") {
      yMax = d3.max(processedData, (d) => d.unitPriceWon) || 0;
    } else {
      yMax = d3.max(processedData, (d) => d.quantityKg) || 0;
    }

    yScale = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);

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

    // Group data by grade
    const gradeData = [];

    for (const gradeKey of grades) {
      // 각 등급별로 날짜에 해당하는 데이터 포인트들을 찾기
      const gradePoints = [];

      for (const date of dates) {
        const point = processedData.find(
          (d) => d.date === date && d.gradeKey === gradeKey
        );

        if (point) {
          gradePoints.push({
            date: point.parsedDate,
            price: point.unitPriceWon,
            quantity: point.quantityKg,
            originalDate: date,
            gradeKey,
          });
        }
      }

      // 해당 등급에 데이터가 있는 경우만 추가
      if (gradePoints.length > 0) {
        gradeData.push({
          gradeKey,
          points: gradePoints,
          color: colorScale(gradeKey),
        });
      }
    }

    // Create line generator
    const line = d3
      .line<{ date: Date; value: number }>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw lines
    gradeData.forEach((grade, index) => {
      const lineData = grade.points.map((p) => ({
        date: p.date,
        value: chartMode === "price" ? p.price : p.quantity,
      }));

      const path = mainGroup
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", grade.color)
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("filter", "url(#drop-shadow)")
        .attr("d", line);

      // Animate line drawing
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1000)
        .delay(index * 100)
        .ease(d3.easeCircleOut)
        .attr("stroke-dashoffset", 0);

      // Add points
      const points = mainGroup
        .selectAll(`.point-${grade.gradeKey}`)
        .data(lineData)
        .join("circle")
        .attr("class", `point-${grade.gradeKey}`)
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 0)
        .attr("fill", grade.color)
        .attr("stroke", theme.palette.background.paper)
        .attr("stroke-width", 3)
        .attr("filter", "url(#drop-shadow)")
        .style("cursor", "pointer");

      points
        .transition()
        .duration(600)
        .delay((_, i) => index * 100 + i * 30)
        .attr("r", 5);

      // Add hover effects
      points
        .on("mouseenter", function (event, d: any) {
          // Remove existing tooltips
          d3.selectAll("#chart-tooltip").remove();

          const originalPoint = grade.points.find(
            (p) => p.date.getTime() === d.date.getTime()
          );
          if (!originalPoint) return;

          // Create tooltip
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

          const gradeText =
            GradeKeyToKorean[
              originalPoint.gradeKey as keyof typeof GradeKeyToKorean
            ] || originalPoint.gradeKey;
          const valueText =
            chartMode === "price"
              ? `💰 단가: ${originalPoint.price.toLocaleString()}원/kg`
              : `📦 수량: ${originalPoint.quantity.toLocaleString()}kg`;

          tooltip.html(`
            <div style="font-weight: bold; color: ${grade.color}; margin-bottom: 4px;">
              ${gradeText}
            </div>
            <div>📅 날짜: ${originalPoint.originalDate}</div>
            <div>${valueText}</div>
          `);

          const [mouseX, mouseY] = d3.pointer(event, document.body);
          tooltip
            .style("left", mouseX + 15 + "px")
            .style("top", mouseY - 10 + "px")
            .transition()
            .duration(200)
            .style("opacity", 1);

          // Highlight point
          d3.select(this as SVGCircleElement)
            .transition()
            .duration(200)
            .attr("r", 8)
            .attr("stroke-width", 4);
        })
        .on("mouseleave", function () {
          d3.selectAll("#chart-tooltip").remove();
          d3.select(this as SVGCircleElement)
            .transition()
            .duration(200)
            .attr("r", 5)
            .attr("stroke-width", 3);
        });
    });

    // Add axes
    const yTickCount = isMobile ? 4 : 5;

    // Get unique dates from actual data
    const uniqueDates = Array.from(
      new Set(processedData.map((d) => d.parsedDate.getTime()))
    )
      .map((time) => new Date(time))
      .sort((a, b) => a.getTime() - b.getTime());

    // Smart tick selection based on date range
    const dateRange = uniqueDates.length;
    let xAxis;

    if (dateRange <= 7) {
      // 1주일 이하: 모든 날짜 표시
      xAxis = d3
        .axisBottom(xScale)
        .tickFormat((d) => d3.timeFormat("%m/%d")(d as Date))
        .tickValues(uniqueDates);
    } else if (dateRange <= 31) {
      // 1개월 이하: 3-4일 간격으로 표시
      const tickInterval = Math.max(1, Math.ceil(dateRange / 8)); // 최대 8개 정도 틱
      const selectedTicks = uniqueDates.filter(
        (_, i) => i % tickInterval === 0
      );
      // 마지막 날짜가 포함되지 않았다면 추가
      if (
        selectedTicks[selectedTicks.length - 1] !==
        uniqueDates[uniqueDates.length - 1]
      ) {
        selectedTicks.push(uniqueDates[uniqueDates.length - 1]);
      }
      xAxis = d3
        .axisBottom(xScale)
        .tickFormat((d) => d3.timeFormat("%m/%d")(d as Date))
        .tickValues(selectedTicks);
    } else if (dateRange <= 92) {
      // 3개월 이하: 주 단위 표시
      xAxis = d3
        .axisBottom(xScale)
        .tickFormat((d) => d3.timeFormat("%m/%d")(d as Date))
        .ticks(d3.timeWeek.every(1));
    } else {
      // 3개월 초과: 월 단위 표시 (1년 단위에서는 2개월 간격)
      const monthInterval = dateRange > 200 ? 2 : 1; // 200일 이상이면 2개월 간격
      xAxis = d3
        .axisBottom(xScale)
        .tickFormat((d) => d3.timeFormat("%Y/%m")(d as Date))
        .ticks(d3.timeMonth.every(monthInterval));
    }

    let yAxis;
    if (chartMode === "price") {
      yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => `${Math.round(d as number).toLocaleString()}원`)
        .ticks(yTickCount);
    } else {
      yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => `${Math.round(d as number).toLocaleString()}kg`)
        .ticks(yTickCount);
    }

    const axisFontSize = isMobile ? "10px" : "12px";

    // X axis
    mainGroup
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis as any)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", axisFontSize);

    // Y axis
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

    // Add Y axis label
    const yLabelPosition = isMobile ? -45 : -60;
    const yLabelFontSize = isMobile ? "12px" : "14px";
    const yLabelText = chartMode === "price" ? "단가 (원/kg)" : "수량 (kg)";

    mainGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", yLabelPosition)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.primary)
      .style("font-size", yLabelFontSize)
      .style("font-weight", "500")
      .text(yLabelText);

    // Add legend
    let legendTransform;
    if (isMobile) {
      legendTransform = `translate(0, ${innerHeight + 40})`;
    } else {
      legendTransform = `translate(${innerWidth + 20}, 20)`;
    }

    const legend = mainGroup.append("g").attr("transform", legendTransform);

    gradeData.forEach((grade, i) => {
      let legendItemTransform;
      if (isMobile) {
        legendItemTransform = `translate(${(i % 3) * (innerWidth / 3)}, ${
          Math.floor(i / 3) * 25
        })`;
      } else {
        legendItemTransform = `translate(0, ${i * 25})`;
      }

      const legendItem = legend
        .append("g")
        .attr("transform", legendItemTransform);

      const lineX2 = isMobile ? 15 : 20;
      const circleCx = isMobile ? 7.5 : 10;
      const textX = isMobile ? 20 : 25;
      const legendFontSize = isMobile ? "10px" : "12px";

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
  }, [data, height, theme, containerWidth, chartMode]);

  // Handle resize
  useEffect(function resize() {
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
    <Box>
      {/* Toggle Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <ToggleButtonGroup
          value={chartMode}
          exclusive
          onChange={handleModeChange}
          size="small"
        >
          <ToggleButton value="price">💰 가격 보기</ToggleButton>
          <ToggleButton value="quantity">📦 수량 보기</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart Container */}
      <div ref={containerRef} style={{ width: "100%" }}>
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          style={{ display: "block" }}
        />
      </div>
    </Box>
  );
}
