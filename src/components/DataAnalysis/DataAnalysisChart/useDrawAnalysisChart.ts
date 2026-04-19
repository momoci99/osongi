import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { GradeKeyToKorean } from "../../../const/Common";
import type { WeeklyPriceDatum } from "../../../types/data";
import type { MovingAverageDatum } from "../../../utils/analysis/statistics";
import {
  CHART_LAYOUT,
  CHART_MARGINS,
  FONT_SIZES,
} from "../../../const/Numbers";
import { createD3Tooltip, removeD3Tooltip } from "../../../utils/d3Tooltip";
import {
  filterMushroomSeason,
  groupByYear,
  buildColorScale,
  getYAccessor,
  buildYearSeries,
  collectLegendItems,
} from "./seriesBuilder";
import type { ChartMode, AnalysisSeries, LegendItem } from "./seriesBuilder";

/**
 * 송이버섯 공판 데이터 시각화 차트
 *
 * ⚠️ 중요: 이 차트는 반드시 연도별 서브플롯(Year-based Subplots) 구조를 유지해야 함
 *
 * 핵심 아키텍처:
 * 1. 각 연도마다 독립적인 서브플롯 생성 (별도의 X축 스케일)
 * 2. 모든 서브플롯이 동일한 Y축 스케일 공유
 * 3. 송이버섯 시즌(8-12월) 데이터만 표시
 * 4. 등급별 색상 + 지역별 시리즈 구분
 */

type UseDrawAnalysisChartParams = {
  data: WeeklyPriceDatum[];
  height: number;
  theme: Theme;
  containerWidth: number;
  containerHeight: number;
  mode: ChartMode;
  maData: MovingAverageDatum[];
  showMA: boolean;
};

export const useDrawAnalysisChart = ({
  data,
  height,
  theme,
  containerWidth,
  containerHeight,
  mode,
  maData,
  showMA,
}: UseDrawAnalysisChartParams) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return;

    const chartHeight = Math.max(
      containerHeight || height,
      CHART_LAYOUT.MIN_HEIGHT,
    );

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", containerWidth).attr("height", chartHeight);

    const isMobile = containerWidth < CHART_LAYOUT.MOBILE_BREAKPOINT;
    const margin = {
      top: CHART_MARGINS.TOP,
      right: isMobile
        ? CHART_MARGINS.MOBILE.RIGHT
        : CHART_MARGINS.DESKTOP.RIGHT,
      bottom: CHART_MARGINS.BOTTOM,
      left: isMobile ? CHART_MARGINS.MOBILE.LEFT : CHART_MARGINS.DESKTOP.LEFT,
    };
    const fontSize = {
      title: isMobile ? FONT_SIZES.MOBILE.TITLE : FONT_SIZES.DESKTOP.TITLE,
      axis: isMobile ? FONT_SIZES.MOBILE.AXIS : FONT_SIZES.DESKTOP.AXIS,
      legend: isMobile ? FONT_SIZES.MOBILE.LEGEND : FONT_SIZES.DESKTOP.LEGEND,
      message: isMobile
        ? FONT_SIZES.MOBILE.MESSAGE
        : FONT_SIZES.DESKTOP.MESSAGE,
    };

    const seasonData = filterMushroomSeason(data);
    if (seasonData.length === 0) {
      drawEmptyMessage(
        svg,
        containerWidth,
        chartHeight,
        fontSize.message,
        theme,
      );
      return;
    }

    const yValue = getYAccessor(mode);
    const yearGroups = groupByYear(seasonData);
    const years = Array.from(yearGroups.keys()).sort();
    const yearCount = years.length;

    const subplotGap = isMobile ? 20 : 40;
    const subplotWidth =
      (containerWidth -
        margin.left -
        margin.right -
        (yearCount - 1) * subplotGap) /
      yearCount;
    const subplotHeight = chartHeight - margin.top - margin.bottom;

    const yExtent = d3.extent(seasonData, yValue) as [number, number];
    const globalYScale = d3
      .scaleLinear()
      .domain([0, yExtent[1] * 1.1])
      .range([subplotHeight, 0]);

    const colorScale = buildColorScale(seasonData, theme);

    const filteredMAData = maData.filter((d) => {
      const month = new Date(d.date).getMonth() + 1;
      return month >= 8 && month <= 12;
    });

    years.forEach((year, yearIndex) => {
      const yearData = yearGroups.get(year)!;
      const xOffset = margin.left + yearIndex * (subplotWidth + subplotGap);
      const yearMAData = filteredMAData.filter(
        (d) => new Date(d.date).getFullYear() === year
      );
      drawSubplot({
        svg,
        yearData,
        year,
        yearIndex,
        xOffset,
        subplotWidth,
        subplotHeight,
        globalYScale,
        colorScale,
        yValue,
        mode,
        isMobile,
        fontSize,
        theme,
        yearMAData,
        showMA,
      });
    });

    const legendItems = collectLegendItems(yearGroups, colorScale);
    const legendTop = margin.top + subplotHeight + margin.bottom + 4;
    const availableWidth = containerWidth - margin.left - margin.right;
    const totalHeight = drawLegend({
      svg,
      items: legendItems,
      legendTop,
      marginLeft: margin.left,
      availableWidth,
      isMobile,
      fontSize,
      theme,
    });

    svg.attr("height", totalHeight);

    return () => removeD3Tooltip();
  }, [data, height, mode, theme, containerWidth, containerHeight, maData, showMA]);

  return { svgRef };
};

/** 데이터 없을 때 메시지 표시 */
const drawEmptyMessage = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number,
  messageFontSize: string,
  theme: Theme,
) => {
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .style("fill", theme.palette.text.secondary)
    .style("font-size", messageFontSize)
    .text("송이버섯 시즌(8월~12월) 데이터가 없습니다");
};

type DrawSubplotParams = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  yearData: WeeklyPriceDatum[];
  year: number;
  yearIndex: number;
  xOffset: number;
  subplotWidth: number;
  subplotHeight: number;
  globalYScale: d3.ScaleLinear<number, number>;
  colorScale: d3.ScaleOrdinal<string, string>;
  yValue: (d: WeeklyPriceDatum) => number;
  mode: ChartMode;
  isMobile: boolean;
  fontSize: { title: string; axis: string; legend: string; message: string };
  theme: Theme;
  yearMAData: MovingAverageDatum[];
  showMA: boolean;
};

/** 연도별 서브플롯을 그립니다. */
const drawSubplot = ({
  svg,
  yearData,
  year,
  yearIndex,
  xOffset,
  subplotWidth,
  subplotHeight,
  globalYScale,
  colorScale,
  yValue,
  mode,
  isMobile,
  fontSize,
  theme,
  yearMAData,
  showMA,
}: DrawSubplotParams) => {
  const yearDates = yearData
    .map((d) => new Date(d.date))
    .sort((a, b) => a.getTime() - b.getTime());
  const dateExtent = d3.extent(yearDates) as [Date, Date];
  const xScale = d3.scaleTime().domain(dateExtent).range([0, subplotWidth]);

  const subplotGroup = svg
    .append("g")
    .attr("transform", `translate(${xOffset}, ${CHART_MARGINS.TOP})`);

  subplotGroup
    .append("text")
    .attr("x", subplotWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", fontSize.title)
    .style("font-weight", "bold")
    .style("fill", theme.palette.text.primary)
    .text(`${year}년`);

  const uniqueDates = [...new Set(yearData.map((d) => d.date))]
    .sort()
    .map((s) => new Date(s));

  const dataSpanDays = uniqueDates.length;
  let tickInterval = 1;
  if (dataSpanDays > 15) {
    tickInterval = Math.ceil(dataSpanDays / (isMobile ? 3 : 5));
  } else if (dataSpanDays > 7) {
    tickInterval = isMobile ? 3 : 2;
  } else {
    tickInterval = isMobile ? 2 : 1;
  }
  const selectedTicks = uniqueDates.filter((_, i) => i % tickInterval === 0);

  const xAxis = d3
    .axisBottom(xScale)
    .tickValues(selectedTicks)
    .tickFormat((d) => d3.timeFormat("%m/%d")(d as Date));

  subplotGroup
    .append("g")
    .attr("transform", `translate(0, ${subplotHeight})`)
    .call(xAxis)
    .selectAll("text")
    .style("fill", theme.palette.text.primary)
    .style("font-size", fontSize.axis);

  if (yearIndex === 0) {
    const yAxis = d3
      .axisLeft(globalYScale)
      .ticks(isMobile ? 5 : 8)
      .tickFormat((d) => `${d}${mode === "price" ? "원" : "kg"}`);

    subplotGroup
      .append("g")
      .call(yAxis)
      .selectAll("text")
      .style("fill", theme.palette.text.primary)
      .style("font-size", fontSize.axis);
  }

  const seriesList = buildYearSeries(yearData, colorScale);
  seriesList.forEach((series) => {
    drawSeriesLineAndPoints({
      subplotGroup,
      series,
      xScale,
      globalYScale,
      yValue,
      isMobile,
      theme,
    });
  });

  if (showMA && yearMAData.length > 0) {
    seriesList.forEach((series) => {
      drawMAOverlay({
        subplotGroup,
        series,
        xScale,
        globalYScale,
        yearMAData,
        isMobile,
      });
    });
  }
};

type DrawMAOverlayParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  series: AnalysisSeries;
  xScale: d3.ScaleTime<number, number>;
  globalYScale: d3.ScaleLinear<number, number>;
  yearMAData: MovingAverageDatum[];
  isMobile: boolean;
};

/** 시리즈에 해당하는 이동평균선을 오버레이합니다. */
const drawMAOverlay = ({
  subplotGroup,
  series,
  xScale,
  globalYScale,
  yearMAData,
  isMobile,
}: DrawMAOverlayParams) => {
  const groupMAData = yearMAData
    .filter((d) => d.gradeKey === series.gradeKey && d.region === series.region)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (groupMAData.length === 0) return;

  const drawMALine = (
    getValue: (d: MovingAverageDatum) => number | null,
    dashArray: string,
  ) => {
    const line = d3
      .line<MovingAverageDatum>()
      .defined((d) => getValue(d) !== null)
      .x((d) => xScale(new Date(d.date)))
      .y((d) => globalYScale(getValue(d)!))
      .curve(d3.curveMonotoneX);

    subplotGroup
      .append("path")
      .datum(groupMAData)
      .attr("fill", "none")
      .attr("stroke", series.color)
      .attr("stroke-width", isMobile ? 1 : 1.5)
      .attr("stroke-opacity", 0.55)
      .attr("stroke-dasharray", dashArray)
      .attr("d", line);
  };

  drawMALine((d) => d.ma7, "4,3");
  drawMALine((d) => d.ma14, "8,4");
};

type DrawSeriesParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  series: AnalysisSeries;
  xScale: d3.ScaleTime<number, number>;
  globalYScale: d3.ScaleLinear<number, number>;
  yValue: (d: WeeklyPriceDatum) => number;
  isMobile: boolean;
  theme: Theme;
};

/** 시리즈별 라인 + 포인트 + 툴팁 */
const drawSeriesLineAndPoints = ({
  subplotGroup,
  series,
  xScale,
  globalYScale,
  yValue,
  isMobile,
  theme,
}: DrawSeriesParams) => {
  if (series.data.length > 1) {
    const line = d3
      .line<WeeklyPriceDatum>()
      .x((d) => xScale(new Date(d.date)))
      .y((d) => globalYScale(yValue(d)))
      .curve(d3.curveMonotoneX);

    subplotGroup
      .append("path")
      .datum(series.data)
      .attr("fill", "none")
      .attr("stroke", series.color)
      .attr("stroke-width", isMobile ? 1.5 : 2)
      .attr("stroke-opacity", 0.8)
      .attr("stroke-dasharray", series.dashPattern)
      .attr("d", line);
  }

  series.data.forEach((d) => {
    subplotGroup
      .append("circle")
      .attr("cx", xScale(new Date(d.date)))
      .attr("cy", globalYScale(yValue(d)))
      .attr("r", isMobile ? 2 : 3)
      .attr("fill", series.color)
      .attr("stroke", theme.palette.background.paper)
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseenter", function (event) {
        const tooltip = createD3Tooltip(theme);
        const date = new Date(d.date);
        const dateStr = `${date.getFullYear()}년 ${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}월 ${date.getDate().toString().padStart(2, "0")}일`;

        tooltip.html(`
          <div><strong>${series.region} ${
            (GradeKeyToKorean as Record<string, string>)[series.gradeKey] ||
            series.gradeKey
          }</strong></div>
          <div>${dateStr}</div>
          <div>가격: ${d.unitPriceWon?.toLocaleString() || "N/A"}원/kg</div>
          <div>수량: ${d.quantityKg?.toLocaleString() || "N/A"}kg</div>
        `);

        const [mouseX, mouseY] = d3.pointer(event, document.body);
        tooltip
          .style("left", mouseX + 10 + "px")
          .style("top", mouseY - 10 + "px");
      })
      .on("mouseleave", () => removeD3Tooltip());
  });
};

type DrawLegendParams = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  items: LegendItem[];
  legendTop: number;
  marginLeft: number;
  availableWidth: number;
  isMobile: boolean;
  fontSize: { legend: string };
  theme: Theme;
};

/** 범례를 차트 하단에 가로 배치합니다. 총 SVG 높이를 반환합니다. */
const drawLegend = ({
  svg,
  items,
  legendTop,
  marginLeft,
  availableWidth,
  isMobile,
  fontSize,
  theme,
}: DrawLegendParams): number => {
  const legend = svg
    .append("g")
    .attr("transform", `translate(${marginLeft}, ${legendTop})`);

  const itemSpacing = isMobile ? 10 : 14;
  const lineWidth = isMobile ? 15 : 20;
  const textOffset = lineWidth + 5;
  const rowHeight = isMobile ? 18 : 22;
  let cursorX = 0;
  let cursorY = 0;

  items.forEach((item) => {
    const label = `${item.region} ${
      (GradeKeyToKorean as Record<string, string>)[item.gradeKey] ||
      item.gradeKey
    }`;
    const estimatedWidth =
      textOffset + label.length * (isMobile ? 8 : 9) + itemSpacing;

    if (cursorX + estimatedWidth > availableWidth && cursorX > 0) {
      cursorX = 0;
      cursorY += rowHeight;
    }

    const legendItem = legend
      .append("g")
      .attr("transform", `translate(${cursorX}, ${cursorY})`);

    legendItem
      .append("line")
      .attr("x1", 0)
      .attr("x2", lineWidth)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", item.color)
      .attr("stroke-width", isMobile ? 1.5 : 2)
      .attr("stroke-dasharray", item.dashPattern);

    legendItem
      .append("text")
      .attr("x", textOffset)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .style("font-size", fontSize.legend)
      .style("fill", theme.palette.text.secondary)
      .text(label);

    cursorX += estimatedWidth;
  });

  const legendRows = Math.floor(cursorY / rowHeight) + 1;
  return legendTop + legendRows * rowHeight + 8;
};

export default useDrawAnalysisChart;
