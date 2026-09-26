import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { LINE_CHART, WEATHER_CHART } from "../../../../const/AnalysisLayout";
import { useContainerWidth } from "../../../../utils/d3/useContainerSize";
import { isMobileWidth, scaleFont, scaleLength, scaleMargin } from "../../../../utils/d3/chartMargins";
import { formatInteger } from "../../../../utils/analysisQuery/format";
import { weatherWindowDates } from "../../../../utils/weather/publicWeather";
import type { WeatherChartModel, WeatherPanel } from "../../../../utils/weather/weatherChartModel";
import { hideTooltip, placeTooltip } from "../chartTooltip";
import { renderTooltipHtml } from "../lineTooltip";
import { useSettingsStore } from "../../../../stores/useSettingsStore";
import {
  drawBars,
  drawRowLabel,
  drawTemperature,
  drawWeatherEnd,
  drawXAxis,
  drawYAxis,
  formatMonthDay,
  tooltipRows,
  type DateTick,
  type DrawContext,
} from "./weatherRenderers";

type UseDrawWeatherChartParams = {
  model: WeatherChartModel | null;
  showShiftedRain: boolean;
  theme: Theme;
};

type RowHeights = { quantity: number; rain: number; temperature: number };

/** 한 패널 높이 — 연도 제목 + 세 줄(각 줄 이름 띠 포함) + x 눈금 */
const panelHeight = (rows: RowHeights, axisHeight: number) =>
  WEATHER_CHART.PANEL_TITLE_HEIGHT +
  WEATHER_CHART.ROW_LABEL_HEIGHT * 3 +
  rows.quantity +
  rows.rain +
  rows.temperature +
  WEATHER_CHART.ROW_GAP * 2 +
  axisHeight;

/** x 범위 안에서 지정한 날(일)에 해당하는 눈금 */
const dateTicks = (days: readonly string[], [start, end]: [number, number]): DateTick[] =>
  weatherWindowDates(2001)
    .map((date, offset) => ({ date, offset }))
    .filter(({ date, offset }) => offset >= start && offset <= end && days.includes(date.slice(8)));

/** 날씨 뷰 렌더링 — 시즌별 공판량·강수·기온 세 줄을 세로로 쌓는다 */
const useDrawWeatherChart = ({ model, showShiftedRain, theme }: UseDrawWeatherChartParams) => {
  /** 큰글씨 모드를 켜고 끄면 글자 크기가 달라져 다시 그려야 한다 */
  const displayMode = useSettingsStore((state) => state.displayMode);
  const { containerRef, width } = useContainerWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    function drawWeatherChart() {
      const svgEl = svgRef.current;
      const tooltipEl = tooltipRef.current;
      if (!svgEl || !tooltipEl || width === 0 || !model || model.panels.length === 0) return;

      const mobile = isMobileWidth(width);
      const margin = scaleMargin(mobile ? WEATHER_CHART.MARGIN.MOBILE : WEATHER_CHART.MARGIN.DESKTOP);
      const baseRows = mobile ? WEATHER_CHART.ROW_HEIGHT.MOBILE : WEATHER_CHART.ROW_HEIGHT.DESKTOP;
      const rows: RowHeights = {
        quantity: scaleLength(baseRows.quantity),
        rain: scaleLength(baseRows.rain),
        temperature: scaleLength(baseRows.temperature),
      };
      const axisHeight = margin.bottom;
      const fontSize = scaleFont(LINE_CHART.AXIS_FONT_SIZE);
      const innerWidth = Math.max(0, width - margin.left - margin.right);
      const onePanel = panelHeight(rows, axisHeight);
      const height = margin.top + model.panels.length * onePanel + (model.panels.length - 1) * WEATHER_CHART.PANEL_GAP;
      const { palette } = theme;

      const [start, end] = model.domain;
      const x = d3.scaleLinear().domain([start - 0.5, end + 0.5]).range([0, innerWidth]);
      const barWidth = Math.max(1, innerWidth / (end - start + 1) - WEATHER_CHART.BAR_GAP);
      const ctx: DrawContext = { x, innerWidth, barWidth, fontSize, palette };
      const tickCount = WEATHER_CHART.Y_TICK_COUNT;
      const yQuantity = d3.scaleLinear().domain([0, model.maxQuantity]).nice(tickCount.quantity).range([rows.quantity, 0]);
      const yRain = d3.scaleLinear().domain([0, model.maxRain]).nice(tickCount.rain).range([rows.rain, 0]);
      /** 기온은 nice() 를 쓰면 범위가 −20~40° 처럼 크게 벌어져 변화가 납작해진다 — 실제 범위 그대로 */
      const yTemperature = d3.scaleLinear().domain(model.temperatureDomain).range([rows.temperature, 0]);

      /** 월 1·15일 라벨 — 좁으면 1일만, 보조 눈금은 라벨 간격이 넉넉할 때만 */
      const allLabelTicks = dateTicks(WEATHER_CHART.LABEL_TICK_DAYS, model.domain);
      const crowded =
        allLabelTicks.length > 1 && x(allLabelTicks[1].offset) - x(allLabelTicks[0].offset) < LINE_CHART.MIN_TICK_GAP;
      const labelTicks = crowded ? allLabelTicks.filter(({ date }) => date.endsWith("-01")) : allLabelTicks;
      const minorTicks = crowded ? [] : dateTicks(WEATHER_CHART.MINOR_TICK_DAYS, model.domain);

      const svg = d3.select(svgEl).attr("width", width).attr("height", height);
      svg.selectAll("*").remove();
      const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
      const titleInset = mobile ? WEATHER_CHART.TITLE_INSET.MOBILE : WEATHER_CHART.TITLE_INSET.DESKTOP;

      const drawPanel = (panel: WeatherPanel, index: number) => {
        const top = index * (onePanel + WEATHER_CHART.PANEL_GAP);
        const g = root.append("g").attr("transform", `translate(0,${top})`);
        /** 연도 제목 — 카드 머리글과 같은 시작선 */
        g.append("text")
          .attr("x", -margin.left + titleInset)
          .attr("y", WEATHER_CHART.PANEL_TITLE_HEIGHT / 2)
          .attr("dy", "0.32em")
          .attr("font-size", scaleFont(13))
          .attr("font-weight", 700)
          .attr("fill", palette.text.primary)
          .style("font-variant-numeric", "tabular-nums")
          .text(`${panel.year} 시즌`);

        const labelBand = WEATHER_CHART.ROW_LABEL_HEIGHT;
        const quantityTop = WEATHER_CHART.PANEL_TITLE_HEIGHT + labelBand;
        const rainTop = quantityTop + rows.quantity + WEATHER_CHART.ROW_GAP + labelBand;
        const temperatureTop = rainTop + rows.rain + WEATHER_CHART.ROW_GAP + labelBand;
        const axisTop = temperatureTop + rows.temperature;

        const quantityRow = g.append("g").attr("transform", `translate(0,${quantityTop})`);
        drawYAxis(quantityRow, ctx, yQuantity, tickCount.quantity, (v) => formatInteger(v), false);
        drawBars(quantityRow, ctx, panel.days, (d) => d.quantity, yQuantity, palette.chart.weight.main);
        drawRowLabel(quantityRow, ctx, "공판량 (kg)");

        const rainRow = g.append("g").attr("transform", `translate(0,${rainTop})`);
        drawYAxis(rainRow, ctx, yRain, tickCount.rain, (v) => formatInteger(v), false);
        if (showShiftedRain) {
          drawBars(rainRow, ctx, panel.days, (d) => d.shiftedRain, yRain, palette.chart.weather.rain, WEATHER_CHART.SHIFTED_RAIN_OPACITY);
        }
        drawBars(rainRow, ctx, panel.days, (d) => d.rain, yRain, palette.chart.weather.rain);
        drawRowLabel(rainRow, ctx, "강수 (mm)");

        const temperatureRow = g.append("g").attr("transform", `translate(0,${temperatureTop})`);
        drawYAxis(temperatureRow, ctx, yTemperature, tickCount.temperature, (v) => `${v}°`);
        drawTemperature(temperatureRow, ctx, panel.days, yTemperature);
        drawRowLabel(temperatureRow, ctx, "기온 범위 · 지면온도 (°C)");

        /** x 눈금 — 패널마다 붙여 스크롤해도 날짜를 잃지 않게 */
        drawXAxis(g, ctx, axisTop, labelTicks, minorTicks);
        if (panel.weatherEnd) drawWeatherEnd(g, ctx, panel.weatherEnd, rainTop, axisTop);

        /** 호버 — 패널 전체 높이에 안내선, 툴팁은 그날 값 */
        const guide = g
          .append("line")
          .attr("y1", quantityTop)
          .attr("y2", axisTop)
          .attr("stroke", palette.surface.borderStrong)
          .attr("stroke-dasharray", "3,3")
          .attr("opacity", 0)
          .attr("pointer-events", "none");
        const dayByOffset = new Map(panel.days.map((d) => [d.offset, d]));
        g.append("rect")
          .attr("x", 0)
          .attr("y", quantityTop)
          .attr("width", innerWidth)
          .attr("height", axisTop - quantityTop)
          .attr("fill", "transparent")
          .on("pointermove", function showDay(event: PointerEvent) {
            const [px] = d3.pointer(event, this);
            const day = dayByOffset.get(Math.round(x.invert(px)));
            if (!day) return;
            guide.attr("x1", x(day.offset)).attr("x2", x(day.offset)).attr("opacity", WEATHER_CHART.GUIDE_OPACITY);
            tooltipEl.innerHTML = renderTooltipHtml({
              title: `${panel.year}년 ${formatMonthDay(day.date)}`,
              rows: tooltipRows(day, theme, showShiftedRain),
              normal: null,
            });
            const [cx, cy] = d3.pointer(event, containerRef.current);
            placeTooltip(tooltipEl, cx, cy, containerRef.current?.clientWidth ?? width);
          })
          .on("pointerleave", function hideDay() {
            guide.attr("opacity", 0);
            hideTooltip(tooltipEl);
          });
      };

      model.panels.forEach(drawPanel);
    },
    [model, showShiftedRain, theme, width, containerRef, displayMode],
  );

  return { containerRef, svgRef, tooltipRef };
};

export default useDrawWeatherChart;
