import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { GradeKeyToKorean } from "../../../const/Common";
import type { WeeklyPriceDatum } from "../../../types/data";
import { getGradeColorArray } from "../../../utils/chartUtils";
import { addDropShadowFilter } from "../../../utils/d3/dropShadowFilter";
import { isMobileWidth, selectMargin } from "../../../utils/d3/chartMargins";
import {
  buildPriceQuantitySeries,
  getSortedDates,
  getSortedGradeKeys,
  parsePriceQuantityData,
} from "./seriesBuilder";
import type { PriceQuantityPoint, PriceQuantitySeries } from "./seriesBuilder";

type UseDrawPriceQuantityParams = {
  data: WeeklyPriceDatum[];
  height: number;
  theme: Theme;
  containerWidth: number;
  showQuantity: boolean;
};

/**
 * 가격/수량 이중축 차트를 SVG에 그리는 D3 훅입니다.
 */
export const useDrawPriceQuantity = ({
  data,
  height,
  theme,
  containerWidth,
  showQuantity,
}: UseDrawPriceQuantityParams) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || containerWidth <= 0 || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const processedData = parsePriceQuantityData(data);
    if (processedData.length === 0) return;

    const isMobile = isMobileWidth(containerWidth);
    const margin = selectMargin(
      containerWidth,
      { top: 20, right: 60, bottom: 120, left: 60 },
      { top: 20, right: 80, bottom: 100, left: 80 },
    );
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    if (innerWidth <= 0 || innerHeight <= 0) return;

    const dates = getSortedDates(processedData);
    const gradeKeys = getSortedGradeKeys(processedData);
    const series = buildPriceQuantitySeries(
      processedData,
      dates,
      gradeKeys,
      getGradeColorArray(theme),
    );

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(processedData, (d) => d.parsedDate) as [Date, Date])
      .range([0, innerWidth]);

    const priceMax = d3.max(processedData, (d) => d.unitPriceWon) || 0;
    const priceScale = d3
      .scaleLinear()
      .domain([0, priceMax])
      .nice()
      .range([innerHeight, 0]);

    const quantityMax = d3.max(processedData, (d) => d.quantityKg) || 0;
    const quantityScale = d3
      .scaleLinear()
      .domain([0, quantityMax])
      .nice()
      .range([innerHeight, 0]);

    const mainGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const dropShadowId = addDropShadowFilter(
      svg,
      theme.palette.mode === "dark",
    );

    drawGrid(mainGroup, priceScale, innerWidth, theme);
    drawPriceLines(mainGroup, series, xScale, priceScale, theme, dropShadowId);

    if (showQuantity) {
      drawQuantityLines(mainGroup, series, xScale, quantityScale, theme);
    }

    drawAxes({
      mainGroup,
      xScale,
      priceScale,
      quantityScale,
      innerWidth,
      innerHeight,
      isMobile,
      showQuantity,
      theme,
    });

    drawLegend({
      mainGroup,
      series,
      innerWidth,
      innerHeight,
      isMobile,
      showQuantity,
      theme,
    });
  }, [data, height, showQuantity, theme, containerWidth]);

  return { svgRef };
};

/** 가격 기준 수평 그리드 라인 */
const drawGrid = (
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  priceScale: d3.ScaleLinear<number, number>,
  innerWidth: number,
  theme: Theme,
) => {
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
};

/** 등급별 가격 라인 + 포인트 (실선) */
const drawPriceLines = (
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  series: PriceQuantitySeries[],
  xScale: d3.ScaleTime<number, number>,
  priceScale: d3.ScaleLinear<number, number>,
  theme: Theme,
  filterId: string,
) => {
  const priceLine = d3
    .line<PriceQuantityPoint>()
    .x((d) => xScale(d.date))
    .y((d) => priceScale(d.price))
    .curve(d3.curveMonotoneX);

  series.forEach((grade, index) => {
    const path = mainGroup
      .append("path")
      .datum(grade.points)
      .attr("fill", "none")
      .attr("stroke", grade.color)
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("filter", `url(#${filterId})`)
      .attr("d", priceLine);

    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .delay(index * 200)
      .ease(d3.easeCircleOut)
      .attr("stroke-dashoffset", 0);

    mainGroup
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
      .style("cursor", "pointer")
      .transition()
      .duration(800)
      .delay((_, i) => index * 200 + i * 50)
      .attr("r", 4);
  });
};

/** 등급별 수량 라인 + 포인트 (점선, 사각형) */
const drawQuantityLines = (
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  series: PriceQuantitySeries[],
  xScale: d3.ScaleTime<number, number>,
  quantityScale: d3.ScaleLinear<number, number>,
  theme: Theme,
) => {
  const quantityLine = d3
    .line<PriceQuantityPoint>()
    .x((d) => xScale(d.date))
    .y((d) => quantityScale(d.quantity))
    .curve(d3.curveMonotoneX);

  series.forEach((grade, index) => {
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
      .attr("d", quantityLine);

    mainGroup
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
      .style("cursor", "pointer")
      .transition()
      .duration(800)
      .delay((_, i) => index * 200 + i * 50)
      .attr("width", 4)
      .attr("height", 4);
  });
};

type DrawAxesParams = {
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  xScale: d3.ScaleTime<number, number>;
  priceScale: d3.ScaleLinear<number, number>;
  quantityScale: d3.ScaleLinear<number, number>;
  innerWidth: number;
  innerHeight: number;
  isMobile: boolean;
  showQuantity: boolean;
  theme: Theme;
};

/** X축, 가격 Y축(좌), 수량 Y축(우) 및 라벨 */
const drawAxes = ({
  mainGroup,
  xScale,
  priceScale,
  quantityScale,
  innerWidth,
  innerHeight,
  isMobile,
  showQuantity,
  theme,
}: DrawAxesParams) => {
  const xTickCount = isMobile ? 4 : 7;
  const yTickCount = isMobile ? 4 : 5;
  const axisFontSize = isMobile ? "10px" : "12px";

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

  mainGroup
    .append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(xAxis as never)
    .selectAll("text")
    .style("fill", theme.palette.text.primary)
    .style("font-size", axisFontSize);

  mainGroup
    .append("g")
    .call(priceAxis as never)
    .selectAll("text")
    .style("fill", theme.palette.text.primary)
    .style("font-size", axisFontSize);

  if (showQuantity) {
    mainGroup
      .append("g")
      .attr("transform", `translate(${innerWidth}, 0)`)
      .call(quantityAxis as never)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", axisFontSize);
  }

  mainGroup.selectAll(".domain").style("stroke", theme.palette.text.secondary);
  mainGroup
    .selectAll(".tick line")
    .style("stroke", theme.palette.text.secondary);

  const yLabelY = isMobile ? -45 : -60;
  const yLabelFontSize = isMobile ? "12px" : "14px";

  mainGroup
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", yLabelY)
    .attr("x", -innerHeight / 2)
    .attr("text-anchor", "middle")
    .style("fill", theme.palette.text.primary)
    .style("font-size", yLabelFontSize)
    .style("font-weight", "500")
    .text("단가 (원/kg)");

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
};

type DrawLegendParams = {
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  series: PriceQuantitySeries[];
  innerWidth: number;
  innerHeight: number;
  isMobile: boolean;
  showQuantity: boolean;
  theme: Theme;
};

/** 범례 (등급 + 가격/수량 선 스타일 라벨) */
const drawLegend = ({
  mainGroup,
  series,
  innerWidth,
  innerHeight,
  isMobile,
  showQuantity,
  theme,
}: DrawLegendParams) => {
  const legendY = isMobile ? innerHeight + 40 : innerHeight + 50;
  const legend = mainGroup
    .append("g")
    .attr("transform", `translate(0, ${legendY})`);

  const cols = isMobile ? 3 : 6;
  const lineX2 = isMobile ? 15 : 20;
  const textX = isMobile ? 20 : 25;
  const legendFontSize = isMobile ? "10px" : "12px";

  series.forEach((grade, i) => {
    const legendItem = legend
      .append("g")
      .attr(
        "transform",
        `translate(${(i % cols) * (innerWidth / cols)}, ${Math.floor(i / cols) * 25})`,
      );

    legendItem
      .append("line")
      .attr("x1", 0)
      .attr("x2", lineX2)
      .attr("y1", -5)
      .attr("y2", -5)
      .attr("stroke", grade.color)
      .attr("stroke-width", 2);

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
          grade.gradeKey,
      );
  });

  if (showQuantity) {
    const labelY = Math.ceil(series.length / cols) * 25 + 10;
    const legendLabels = legend
      .append("g")
      .attr("transform", `translate(0, ${labelY})`);

    const labelFontSize = isMobile ? "9px" : "10px";

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
      .style("font-size", labelFontSize)
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
      .style("font-size", labelFontSize)
      .text("수량");
  }
};

export default useDrawPriceQuantity;
