import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { GradeKeyToKorean } from "../../../const/Common";
import type { WeeklyPriceDatum } from "../../../types/data";
import { getGradeColorArray } from "../../../utils/chartUtils";
import { createD3Tooltip, removeD3Tooltip } from "../../../utils/d3Tooltip";
import { addDropShadowFilter } from "../../../utils/d3/dropShadowFilter";
import {
  selectMargin,
  isMobileWidth,
  isLargeDisplay,
} from "../../../utils/d3/chartMargins";
import { FONT_SIZES } from "../../../const/Numbers";
import { buildTimeAxis } from "../../../utils/d3/timeAxisTicks";
import {
  buildWeeklySeries,
  getSortedGradeKeys,
  getSortedUniqueDates,
  getYMaxByMode,
  parseWeeklyData,
} from "./seriesBuilder";
import type { ChartMode, WeeklyToggleSeries } from "./seriesBuilder";

type UseDrawWeeklyToggleParams = {
  data: WeeklyPriceDatum[];
  height: number;
  theme: Theme;
  containerWidth: number;
  chartMode: ChartMode;
};

/**
 * 주간 토글 차트를 SVG에 그리는 D3 훅입니다.
 */
export const useDrawWeeklyToggle = ({
  data,
  height,
  theme,
  containerWidth,
  chartMode,
}: UseDrawWeeklyToggleParams) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || containerWidth <= 0 || data.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    const processedData = parseWeeklyData(data);

    svg.selectAll("*").remove();

    if (processedData.length === 0) {
      return;
    }

    const isMobile = isMobileWidth(containerWidth);
    const fontSize = isLargeDisplay()
      ? isMobile
        ? FONT_SIZES.LARGE.MOBILE
        : FONT_SIZES.LARGE.DESKTOP
      : isMobile
        ? FONT_SIZES.MOBILE
        : FONT_SIZES.DESKTOP;
    const margin = selectMargin(
      containerWidth,
      { top: 20, right: 20, bottom: 100, left: 60 },
      { top: 20, right: 170, bottom: 60, left: 80 },
    );
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) {
      return;
    }

    const gradeKeys = getSortedGradeKeys(processedData);
    const uniqueDates = getSortedUniqueDates(processedData);
    const yMax = getYMaxByMode(processedData, chartMode);
    const series = buildWeeklySeries(
      processedData,
      gradeKeys,
      getGradeColorArray(theme),
    );

    const xScale = d3
      .scaleTime()
      .domain(
        d3.extent(processedData, (datum) => datum.parsedDate) as [Date, Date],
      )
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([innerHeight, 0]);

    const mainGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const dropShadowId = addDropShadowFilter(
      svg,
      theme.palette.mode === "dark",
    );

    mainGroup
      .append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks(5))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (value) => yScale(value))
      .attr("y2", (value) => yScale(value))
      .attr("stroke", theme.palette.divider)
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.7);

    const line = d3
      .line<{ date: Date; value: number }>()
      .x((datum) => xScale(datum.date))
      .y((datum) => yScale(datum.value))
      .curve(d3.curveMonotoneX);

    series.forEach((gradeSeries, index) => {
      drawSeries({
        gradeSeries,
        index,
        mainGroup,
        line,
        xScale,
        yScale,
        chartMode,
        theme,
        filterId: dropShadowId,
      });
    });

    const yTickCount = isMobile ? 4 : 5;
    const xAxis = buildTimeAxis(xScale, uniqueDates);
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((value) =>
        chartMode === "price"
          ? `${Math.round(value as number).toLocaleString()}원`
          : `${Math.round(value as number).toLocaleString()}kg`,
      )
      .ticks(yTickCount);
    mainGroup
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", fontSize.AXIS);

    mainGroup
      .append("g")
      .call(yAxis)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", fontSize.AXIS);

    mainGroup
      .selectAll(".domain")
      .style("stroke", theme.palette.text.secondary);
    mainGroup
      .selectAll(".tick line")
      .style("stroke", theme.palette.text.secondary);

    mainGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", isMobile ? -45 : -60)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.primary)
      .style("font-size", fontSize.TITLE)
      .style("font-weight", "500")
      .text(chartMode === "price" ? "단가 (원/kg)" : "수량 (kg)");

    const legendRows = drawLegend({
      mainGroup,
      series,
      innerWidth,
      innerHeight,
      isMobile,
      theme,
      legendFontSize: fontSize.LEGEND,
    });
    /** 좁은 화면에서 범례가 하단 여백을 넘치면 넘친 줄만큼 SVG 를 늘려 잘리지 않게 한다 */
    const overflowRows = isMobile
      ? Math.max(0, legendRows - MOBILE_LEGEND_ROWS_IN_MARGIN)
      : 0;
    svg.attr("height", height + overflowRows * LEGEND_ROW_HEIGHT);

    return () => {
      removeD3Tooltip();
    };
  }, [chartMode, containerWidth, data, height, theme]);

  return { svgRef };
};

type DrawSeriesParams = {
  gradeSeries: WeeklyToggleSeries;
  index: number;
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  line: d3.Line<{ date: Date; value: number }>;
  xScale: d3.ScaleTime<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  chartMode: ChartMode;
  theme: Theme;
  filterId: string;
};

/**
 * 등급별 라인과 포인트, 툴팁 상호작용을 그립니다.
 */
const drawSeries = ({
  gradeSeries,
  index,
  mainGroup,
  line,
  xScale,
  yScale,
  chartMode,
  theme,
  filterId,
}: DrawSeriesParams) => {
  const lineData = gradeSeries.points.map((point) => ({
    date: point.date,
    value: chartMode === "price" ? point.price : point.quantity,
  }));

  const path = mainGroup
    .append("path")
    .datum(lineData)
    .attr("fill", "none")
    .attr("stroke", gradeSeries.color)
    .attr("stroke-width", 3)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("filter", `url(#${filterId})`)
    .attr("d", line);

  const totalLength = path.node()?.getTotalLength() || 0;

  path
    .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(1000)
    .delay(index * 100)
    .ease(d3.easeCircleOut)
    .attr("stroke-dashoffset", 0);

  const points = mainGroup
    .selectAll(`.point-${gradeSeries.gradeKey}`)
    .data(lineData)
    .join("circle")
    .attr("class", `point-${gradeSeries.gradeKey}`)
    .attr("cx", (datum) => xScale(datum.date))
    .attr("cy", (datum) => yScale(datum.value))
    .attr("r", 0)
    .attr("fill", gradeSeries.color)
    .attr("stroke", theme.palette.background.paper)
    .attr("stroke-width", 3)
    .attr("filter", `url(#${filterId})`)
    .style("cursor", "pointer");

  points
    .transition()
    .duration(600)
    .delay((_, pointIndex) => index * 100 + pointIndex * 30)
    .attr("r", 5);

  points
    .on("mouseenter", function onMouseEnter(event, datum) {
      const originalPoint = gradeSeries.points.find(
        (point) => point.date.getTime() === datum.date.getTime(),
      );

      if (!originalPoint) {
        return;
      }

      const tooltip = createD3Tooltip(theme).style("opacity", "0");
      const gradeText =
        GradeKeyToKorean[
          originalPoint.gradeKey as keyof typeof GradeKeyToKorean
        ] || originalPoint.gradeKey;
      const valueText =
        chartMode === "price"
          ? `단가: ${originalPoint.price.toLocaleString()}원/kg`
          : `수량: ${originalPoint.quantity.toLocaleString()}kg`;
      const [mouseX, mouseY] = d3.pointer(event, document.body);

      tooltip.html(`
            <div style="font-weight: bold; color: ${gradeSeries.color}; margin-bottom: 4px;">
              ${gradeText}
            </div>
            <div>📅 날짜: ${originalPoint.originalDate}</div>
            <div>${valueText}</div>
          `);

      tooltip
        .style("left", `${mouseX + 15}px`)
        .style("top", `${mouseY - 10}px`)
        .transition()
        .duration(200)
        .style("opacity", 1);

      d3.select(this as SVGCircleElement)
        .transition()
        .duration(200)
        .attr("r", 8)
        .attr("stroke-width", 4);
    })
    .on("mouseleave", function onMouseLeave() {
      removeD3Tooltip();
      d3.select(this as SVGCircleElement)
        .transition()
        .duration(200)
        .attr("r", 5)
        .attr("stroke-width", 3);
    });
};

/** 모바일 범례 항목 사이 가로 간격 (px) */
const MOBILE_LEGEND_ITEM_GAP = 14;
/** 범례 줄 간격 (px) */
const LEGEND_ROW_HEIGHT = 25;
/** 모바일 하단 여백 안에 들어가는 범례 줄 수 */
const MOBILE_LEGEND_ROWS_IN_MARGIN = 3;

type DrawLegendParams = {
  mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  series: WeeklyToggleSeries[];
  innerWidth: number;
  innerHeight: number;
  isMobile: boolean;
  theme: Theme;
  legendFontSize: string;
};

/**
 * 등급 범례를 반응형 위치에 렌더링합니다.
 * 모바일은 항목 글자 폭을 재서 한 줄에 들어가는 만큼 놓고 넘치면 다음 줄로 보낸다.
 * 고정 3열이면 "3등품(생장정지품)"처럼 긴 라벨이 옆 항목을 덮는다.
 * @returns 그린 범례 줄 수
 */
const drawLegend = ({
  mainGroup,
  series,
  innerWidth,
  innerHeight,
  isMobile,
  theme,
  legendFontSize,
}: DrawLegendParams): number => {
  const legend = mainGroup
    .append("g")
    .attr(
      "transform",
      isMobile
        ? `translate(0, ${innerHeight + 40})`
        : `translate(${innerWidth + 20}, 20)`,
    );

  let cursorX = 0;
  let row = 0;

  series.forEach((gradeSeries, index) => {
    const legendItem = legend.append("g");

    legendItem
      .append("line")
      .attr("x1", 0)
      .attr("x2", isMobile ? 15 : 20)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", gradeSeries.color)
      .attr("stroke-width", 2.5);

    legendItem
      .append("circle")
      .attr("cx", isMobile ? 7.5 : 10)
      .attr("cy", 0)
      .attr("r", 3)
      .attr("fill", gradeSeries.color);

    const textX = isMobile ? 20 : 25;
    const label = legendItem
      .append("text")
      .attr("x", textX)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .style("fill", theme.palette.text.primary)
      .style("font-size", legendFontSize)
      .text(
        GradeKeyToKorean[
          gradeSeries.gradeKey as keyof typeof GradeKeyToKorean
        ] || gradeSeries.gradeKey,
      );

    if (!isMobile) {
      legendItem.attr("transform", `translate(0, ${index * LEGEND_ROW_HEIGHT})`);
      return;
    }

    /** jsdom 처럼 글자 폭을 잴 수 없는 환경에서는 0으로 둔다 */
    const textWidth = label.node()?.getComputedTextLength?.() ?? 0;
    const itemWidth = textX + textWidth;
    if (cursorX > 0 && cursorX + itemWidth > innerWidth) {
      cursorX = 0;
      row += 1;
    }
    legendItem.attr(
      "transform",
      `translate(${cursorX}, ${row * LEGEND_ROW_HEIGHT})`,
    );
    cursorX += itemWidth + MOBILE_LEGEND_ITEM_GAP;
  });

  return isMobile ? row + 1 : series.length;
};

export default useDrawWeeklyToggle;
