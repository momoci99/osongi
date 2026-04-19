import { useEffect, useRef, type RefObject } from "react";
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
  normalizeToBaseYear,
  buildOverlayYearSeries,
  YEAR_COLORS,
} from "./seriesBuilder";
import type {
  ChartMode,
  ChartLayout,
  AnalysisSeries,
  LegendItem,
  OverlaySeries,
  NormalizedDatum,
} from "./seriesBuilder";

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
  showMarkers: boolean;
  layout: ChartLayout;
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
  showMarkers,
  layout,
}: UseDrawAnalysisChartParams) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const hiddenSeriesRef = useRef<Set<string>>(new Set());

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

    const toggleSeries = (seriesKey: string) => {
      const svgEl = d3.select(svgRef.current);
      const hidden = hiddenSeriesRef.current;
      if (hidden.has(seriesKey)) {
        hidden.delete(seriesKey);
        svgEl
          .selectAll(`[data-series-key="${seriesKey}"]`)
          .attr("opacity", null);
        svgEl
          .selectAll(`[data-legend-key="${seriesKey}"]`)
          .attr("opacity", null);
      } else {
        hidden.add(seriesKey);
        svgEl
          .selectAll(`[data-series-key="${seriesKey}"]`)
          .attr("opacity", 0.08);
        svgEl
          .selectAll(`[data-legend-key="${seriesKey}"]`)
          .attr("opacity", 0.3);
      }
    };

    let totalHeight: number;

    if (layout === "overlay") {
      // --- Overlay mode: single chart, year-colored series ---
      const plotWidth = containerWidth - margin.left - margin.right;
      const plotHeight = chartHeight - margin.top - margin.bottom;

      // Build year color scale
      const yearColorScale = d3
        .scaleOrdinal<number, string>()
        .domain(years)
        .range(YEAR_COLORS);

      // Build overlay series from all years
      const allOverlaySeries: OverlaySeries[] = [];
      years.forEach((year) => {
        const yearData = yearGroups.get(year)!;
        const normalized: NormalizedDatum[] = yearData.map((d) => ({
          ...d,
          normalizedDate: normalizeToBaseYear(d.date),
        }));
        const series = buildOverlayYearSeries(normalized, year, yearColorScale);
        allOverlaySeries.push(...series);
      });

      // X scale: fixed 8/1~12/31 (base year 2000)
      const xScale = d3
        .scaleTime()
        .domain([new Date(2000, 7, 1), new Date(2000, 11, 31)])
        .range([0, plotWidth]);

      // Y scale: global across all data
      const yExtent = d3.extent(seasonData, yValue) as [number, number];
      const yScale = d3
        .scaleLinear()
        .domain([0, yExtent[1] * 1.1])
        .range([plotHeight, 0]);

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Draw axes
      const xAxis = d3
        .axisBottom(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat((d) => d3.timeFormat("%-m월")(d as Date));
      g.append("g")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("font-size", `${fontSize.axis}px`);

      const yAxis = d3.axisLeft(yScale).ticks(5);
      g.append("g")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", `${fontSize.axis}px`);

      // Draw Y grid lines
      g.append("g")
        .attr("class", "grid")
        .call(
          d3
            .axisLeft(yScale)
            .ticks(5)
            .tickSize(-plotWidth)
            .tickFormat(() => ""),
        )
        .selectAll("line")
        .attr("stroke", theme.palette.divider)
        .attr("stroke-opacity", 0.3);
      g.select(".grid .domain").remove();

      // Draw series lines
      allOverlaySeries.forEach((series) => {
        const lineGen = d3
          .line<NormalizedDatum>()
          .x((d) => xScale(d.normalizedDate))
          .y((d) => yScale(yValue(d)))
          .defined((d) => yValue(d) != null && !isNaN(yValue(d)));

        g.append("path")
          .datum(series.data)
          .attr("fill", "none")
          .attr("stroke", series.color)
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", series.dashPattern)
          .attr("d", lineGen)
          .attr("data-series-key", series.seriesKey)
          .style("pointer-events", "none");
      });

      // Draw crosshair overlay for overlay mode
      const overlayRect = g
        .append("rect")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .attr("fill", "none")
        .style("pointer-events", "all");

      const crosshairLine = g
        .append("line")
        .attr("stroke", theme.palette.text.secondary)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3")
        .attr("y1", 0)
        .attr("y2", plotHeight)
        .style("display", "none")
        .style("pointer-events", "none");

      const tooltip = createD3Tooltip(theme);

      overlayRect
        .on("mousemove", (event: MouseEvent) => {
          const [mx] = d3.pointer(event);
          const hoveredDate = xScale.invert(mx);
          crosshairLine.attr("x1", mx).attr("x2", mx).style("display", null);

          // Find nearest data from visible series
          const hidden = hiddenSeriesRef.current;
          const visibleSeries = allOverlaySeries.filter(
            (s) => !hidden.has(s.seriesKey),
          );
          const tooltipRows = visibleSeries
            .map((s) => {
              const nearest = s.data.reduce((best, d) =>
                Math.abs(d.normalizedDate.getTime() - hoveredDate.getTime()) <
                Math.abs(best.normalizedDate.getTime() - hoveredDate.getTime())
                  ? d
                  : best,
              );
              if (!nearest) return null;
              const val = yValue(nearest);
              if (val == null || isNaN(val)) return null;
              const gradeLabel =
                GradeKeyToKorean[s.gradeKey as keyof typeof GradeKeyToKorean] ??
                s.gradeKey;
              const label = `${s.year} ${s.region} ${gradeLabel}`;
              return `<span style="color:${s.color}">●</span> ${label}: ${mode === "price" ? val.toLocaleString() + "원" : val.toLocaleString() + "kg"}`;
            })
            .filter(Boolean);

          if (tooltipRows.length > 0) {
            const dateStr = d3.timeFormat("%-m/%-d")(hoveredDate);
            tooltip
              .html(
                `<strong>${dateStr}</strong><br/>${tooltipRows.join("<br/>")}`,
              )
              .style("left", `${event.pageX + 12}px`)
              .style("top", `${event.pageY - 20}px`)
              .style("display", "block");
          }
        })
        .on("mouseleave", () => {
          crosshairLine.style("display", "none");
          tooltip.style("display", "none");
        });

      // Build legend: year colors + grade dashes
      const legendItems: LegendItem[] = [];
      // Year color entries
      years.forEach((year) => {
        legendItems.push({
          region: String(year),
          gradeKey: "",
          color: yearColorScale(year),
          dashPattern: "",
        });
      });

      const legendTop = margin.top + plotHeight + margin.bottom + 4;
      const availableWidth = containerWidth - margin.left - margin.right;

      totalHeight = drawLegend({
        svg,
        items: legendItems,
        legendTop,
        marginLeft: margin.left,
        availableWidth,
        isMobile,
        fontSize,
        theme,
        onLegendClick: toggleSeries,
      });
    } else {
      // --- Subplot mode: existing year-based subplots ---
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
          (d) => new Date(d.date).getFullYear() === year,
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
          showMarkers,
          hiddenSeriesRef,
        });
      });

      const legendItems = collectLegendItems(yearGroups, colorScale);
      const legendTop = margin.top + subplotHeight + margin.bottom + 4;
      const availableWidth = containerWidth - margin.left - margin.right;

      totalHeight = drawLegend({
        svg,
        items: legendItems,
        legendTop,
        marginLeft: margin.left,
        availableWidth,
        isMobile,
        fontSize,
        theme,
        onLegendClick: toggleSeries,
      });
    }

    /** 다크모드 전환 등 재그리기 후 숨김 상태 복원 */
    hiddenSeriesRef.current.forEach((seriesKey) => {
      svg.selectAll(`[data-series-key="${seriesKey}"]`).attr("opacity", 0.08);
      svg.selectAll(`[data-legend-key="${seriesKey}"]`).attr("opacity", 0.3);
    });

    svg.attr("height", totalHeight);

    return () => removeD3Tooltip();
  }, [
    data,
    height,
    mode,
    theme,
    containerWidth,
    containerHeight,
    maData,
    showMA,
    showMarkers,
    layout,
  ]);

  return { svgRef, hiddenSeriesRef };
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
  showMarkers: boolean;
  hiddenSeriesRef: RefObject<Set<string>>;
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
  showMarkers,
  hiddenSeriesRef,
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

  if (showMarkers) {
    drawExtremeMarkers({
      subplotGroup,
      seriesList,
      xScale,
      globalYScale,
      yValue,
      mode,
      isMobile,
      theme,
    });
  }

  addCrosshair({
    subplotGroup,
    yearData,
    seriesList,
    xScale,
    yValue,
    subplotWidth,
    subplotHeight,
    isMobile,
    theme,
    hiddenSeriesRef,
  });
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
  const seriesKey = `${series.region}-${series.gradeKey}`;
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
      .attr("data-series-key", seriesKey)
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
  const seriesKey = `${series.region}-${series.gradeKey}`;

  if (series.data.length > 1) {
    const line = d3
      .line<WeeklyPriceDatum>()
      .x((d) => xScale(new Date(d.date)))
      .y((d) => globalYScale(yValue(d)))
      .curve(d3.curveMonotoneX);

    subplotGroup
      .append("path")
      .datum(series.data)
      .attr("data-series-key", seriesKey)
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
      .attr("data-series-key", seriesKey)
      .attr("cx", xScale(new Date(d.date)))
      .attr("cy", globalYScale(yValue(d)))
      .attr("r", isMobile ? 2 : 3)
      .attr("fill", series.color)
      .attr("stroke", theme.palette.background.paper)
      .attr("stroke-width", 1)
      .style("pointer-events", "none");
  });
};

type DrawExtremeMarkersParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  seriesList: AnalysisSeries[];
  xScale: d3.ScaleTime<number, number>;
  globalYScale: d3.ScaleLinear<number, number>;
  yValue: (d: WeeklyPriceDatum) => number;
  mode: ChartMode;
  isMobile: boolean;
  theme: Theme;
};

/** 각 시리즈의 최고/최저 포인트에 마커를 표시합니다. */
const drawExtremeMarkers = ({
  subplotGroup,
  seriesList,
  xScale,
  globalYScale,
  yValue,
  mode,
  isMobile,
  theme,
}: DrawExtremeMarkersParams) => {
  const markerFontSize = isMobile ? "8px" : "10px";
  const markerOffset = isMobile ? 10 : 14;

  seriesList.forEach((series) => {
    if (series.data.length < 2) return;
    const seriesKey = `${series.region}-${series.gradeKey}`;

    let maxPoint = series.data[0];
    let minPoint = series.data[0];
    series.data.forEach((d) => {
      if (yValue(d) > yValue(maxPoint)) maxPoint = d;
      if (yValue(d) < yValue(minPoint)) minPoint = d;
    });

    if (yValue(maxPoint) === yValue(minPoint)) return;

    const drawMarker = (point: WeeklyPriceDatum, type: "max" | "min") => {
      const cx = xScale(new Date(point.date));
      const cy = globalYScale(yValue(point));
      const isMax = type === "max";
      const symbol = isMax ? "▲" : "▼";
      const yOffset = isMax ? -markerOffset : markerOffset;

      const markerGroup = subplotGroup
        .append("g")
        .attr("data-series-key", seriesKey)
        .attr("class", "extreme-marker");

      markerGroup
        .append("text")
        .attr("x", cx)
        .attr("y", cy + yOffset)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", isMax ? "auto" : "hanging")
        .style("font-size", markerFontSize)
        .style("fill", series.color)
        .style("pointer-events", "none")
        .text(symbol);

      const value = yValue(point);
      const unit = mode === "price" ? "원" : "kg";
      const label =
        value >= 10000
          ? `${(value / 10000).toFixed(1)}만${unit}`
          : `${value.toLocaleString()}${unit}`;

      markerGroup
        .append("text")
        .attr("x", cx)
        .attr("y", cy + yOffset + (isMax ? -10 : 10))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", isMax ? "auto" : "hanging")
        .style("font-size", markerFontSize)
        .style("fill", theme.palette.text.primary)
        .style("font-weight", "600")
        .style("pointer-events", "none")
        .text(label);
    };

    drawMarker(maxPoint, "max");
    drawMarker(minPoint, "min");
  });
};

type AddCrosshairParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  yearData: WeeklyPriceDatum[];
  seriesList: AnalysisSeries[];
  xScale: d3.ScaleTime<number, number>;
  yValue: (d: WeeklyPriceDatum) => number;
  subplotWidth: number;
  subplotHeight: number;
  isMobile: boolean;
  theme: Theme;
  hiddenSeriesRef: RefObject<Set<string>>;
};

/** bisect 결과에서 가장 가까운 날짜를 반환합니다. */
const getNearestDate = (
  dates: Date[],
  index: number,
  target: Date,
): Date | null => {
  if (dates.length === 0) return null;
  const d0 = dates[index - 1];
  const d1 = dates[index];
  if (!d0) return d1;
  if (!d1) return d0;
  return target.getTime() - d0.getTime() > d1.getTime() - target.getTime()
    ? d1
    : d0;
};

/** 한국어 날짜 포맷 */
const formatDateKorean = (date: Date): string =>
  `${date.getFullYear()}년 ${(date.getMonth() + 1).toString().padStart(2, "0")}월 ${date.getDate().toString().padStart(2, "0")}일`;

/** 서브플롯에 crosshair 인터랙션을 추가합니다. */
const addCrosshair = ({
  subplotGroup,
  yearData,
  seriesList,
  xScale,
  yValue,
  subplotWidth,
  subplotHeight,
  isMobile,
  theme,
  hiddenSeriesRef,
}: AddCrosshairParams) => {
  const crosshairLine = subplotGroup
    .append("line")
    .attr("class", "crosshair-line")
    .attr("y1", 0)
    .attr("y2", subplotHeight)
    .attr("stroke", theme.palette.text.secondary)
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3")
    .attr("opacity", 0)
    .style("pointer-events", "none");

  const uniqueDates = [...new Set(yearData.map((d) => d.date))]
    .sort()
    .map((s) => new Date(s));

  const bisect = d3.bisector<Date, Date>((d) => d).left;

  /** 날짜별 lookup Map (O(1) 조회용) */
  const dateMap = new Map<string, Map<string, WeeklyPriceDatum>>();
  seriesList.forEach((series) => {
    const key = `${series.region}-${series.gradeKey}`;
    series.data.forEach((d) => {
      const dateKey = new Date(d.date).toDateString();
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
      dateMap.get(dateKey)!.set(key, d);
    });
  });

  const handleMove = (event: MouseEvent | TouchEvent) => {
    const [mouseX] = d3.pointer(event, subplotGroup.node()!);
    const hoveredDate = xScale.invert(mouseX);
    const index = bisect(uniqueDates, hoveredDate);
    const nearestDate = getNearestDate(uniqueDates, index, hoveredDate);
    if (!nearestDate) return;

    const xPos = xScale(nearestDate);
    crosshairLine.attr("x1", xPos).attr("x2", xPos).attr("opacity", 0.6);

    const dateKey = nearestDate.toDateString();
    const datumMap = dateMap.get(dateKey);
    if (!datumMap) return;

    const hidden = hiddenSeriesRef.current;
    const entries: Array<{
      region: string;
      gradeKey: string;
      color: string;
      value: number;
    }> = [];

    seriesList.forEach((series) => {
      const seriesKey = `${series.region}-${series.gradeKey}`;
      if (hidden.has(seriesKey)) return;
      const point = datumMap.get(seriesKey);
      if (!point) return;
      entries.push({
        region: series.region,
        gradeKey: series.gradeKey,
        color: series.color,
        value: yValue(point),
      });
    });

    if (entries.length === 0) {
      removeD3Tooltip();
      return;
    }

    const tooltip = createD3Tooltip(theme);
    const header = `<div style="font-weight:bold;margin-bottom:4px">${formatDateKorean(nearestDate)}</div>`;
    const maxRows = isMobile ? 8 : 15;
    const displayEntries = entries.slice(0, maxRows);
    const rows = displayEntries
      .map((e) => {
        const grade =
          (GradeKeyToKorean as Record<string, string>)[e.gradeKey] ||
          e.gradeKey;
        return `<div style="display:flex;align-items:center;gap:6px">
          <span style="width:8px;height:8px;border-radius:50%;background:${e.color};display:inline-block"></span>
          <span>${e.region} ${grade}</span>
          <span style="margin-left:auto;font-weight:600">${e.value.toLocaleString()}</span>
        </div>`;
      })
      .join("");
    const truncation =
      entries.length > maxRows
        ? `<div style="color:gray">... 외 ${entries.length - maxRows}개</div>`
        : "";

    tooltip.html(header + rows + truncation);

    const [bodyX, bodyY] = d3.pointer(event, document.body);
    const tooltipWidth = 220;
    const flipX = bodyX + tooltipWidth > window.innerWidth - 20;
    tooltip
      .style("left", (flipX ? bodyX - tooltipWidth - 10 : bodyX + 15) + "px")
      .style("top", Math.max(10, bodyY - 10) + "px")
      .style("max-height", isMobile ? "200px" : "400px")
      .style("overflow-y", "auto")
      .style("min-width", "180px");
  };

  const overlay = subplotGroup
    .append("rect")
    .attr("class", "crosshair-overlay")
    .attr("width", subplotWidth)
    .attr("height", subplotHeight)
    .attr("fill", "transparent")
    .style("cursor", "crosshair");

  overlay
    .on("mousemove", handleMove)
    .on("touchmove", (event: TouchEvent) => {
      event.preventDefault();
      handleMove(event);
    })
    .on("mouseleave", () => {
      crosshairLine.attr("opacity", 0);
      removeD3Tooltip();
    })
    .on("touchend", () => {
      crosshairLine.attr("opacity", 0);
      removeD3Tooltip();
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
  onLegendClick?: (seriesKey: string) => void;
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
  onLegendClick,
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

  if (items.length > 20) {
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -8)
      .style("font-size", isMobile ? "9px" : "11px")
      .style("fill", theme.palette.text.secondary)
      .style("font-style", "italic")
      .text("💡 범례를 클릭하면 시리즈를 숨길 수 있습니다");
  }

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

    const seriesKey = `${item.region}-${item.gradeKey}`;

    const legendItem = legend
      .append("g")
      .attr("transform", `translate(${cursorX}, ${cursorY})`)
      .attr("data-legend-key", seriesKey)
      .style("cursor", "pointer");

    const hitAreaHeight = Math.max(rowHeight, 44);
    legendItem
      .append("rect")
      .attr("x", -4)
      .attr("y", -hitAreaHeight / 2)
      .attr("width", estimatedWidth)
      .attr("height", hitAreaHeight)
      .attr("fill", "transparent");

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

    if (onLegendClick) {
      legendItem.on("click", () => onLegendClick(seriesKey));
    }

    cursorX += estimatedWidth;
  });

  const legendRows = Math.floor(cursorY / rowHeight) + 1;
  return legendTop + legendRows * rowHeight + 8;
};

export default useDrawAnalysisChart;
