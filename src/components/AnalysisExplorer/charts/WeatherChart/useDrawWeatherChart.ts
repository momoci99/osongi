import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { LINE_CHART, WEATHER_CHART } from "../../../../const/AnalysisLayout";
import { RAIN_LAG_HINT } from "../../../../const/Weather";
import { useContainerWidth } from "../../../../utils/d3/useContainerSize";
import { isMobileWidth, scaleFont, scaleLength, scaleMargin } from "../../../../utils/d3/chartMargins";
import { formatInteger } from "../../../../utils/analysisQuery/format";
import { weatherWindowDates } from "../../../../utils/weather/publicWeather";
import type { WeatherChartDay, WeatherChartModel, WeatherPanel } from "../../../../utils/weather/weatherChartModel";
import { hideTooltip, placeTooltip } from "../chartTooltip";
import { renderTooltipHtml, type TooltipRow } from "../lineTooltip";
import { useSettingsStore } from "../../../../stores/useSettingsStore";

type UseDrawWeatherChartParams = {
  model: WeatherChartModel | null;
  showShiftedRain: boolean;
  theme: Theme;
};

type RowHeights = { quantity: number; rain: number; temperature: number };

/** 눈금으로 쓸 날짜 (매월 1·15일) */
const TICK_DAYS = ["01", "15"];

/** 한 패널 높이 — 연도 제목 + 세 줄 + x 눈금 */
const panelHeight = (rows: RowHeights, axisHeight: number) =>
  WEATHER_CHART.PANEL_TITLE_HEIGHT + rows.quantity + rows.rain + rows.temperature + WEATHER_CHART.ROW_GAP * 2 + axisHeight;

const formatDecimal = (value: number | null, unit: string) => (value === null ? "—" : `${value.toFixed(1)}${unit}`);

/** 툴팁 제목용 M월 D일 */
const formatMonthDay = (date: string) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;

/** 호버한 하루의 툴팁 행 */
const tooltipRows = (day: WeatherChartDay, theme: Theme, showShiftedRain: boolean): TooltipRow[] => {
  const { weather, weight } = theme.palette.chart;
  const row = (key: string, label: string, color: string, value: string, opacity = 1): TooltipRow => ({
    key,
    label,
    color,
    value,
    detail: "",
    lowSample: false,
    opacity,
  });
  const temperature =
    day.minTa === null || day.maxTa === null ? "—" : `${day.minTa.toFixed(1)} ~ ${day.maxTa.toFixed(1)}°C`;
  return [
    row("quantity", "공판량", weight.main, day.quantity === null ? "공판 없음" : `${formatInteger(day.quantity)}kg`),
    row("rain", "강수", weather.rain, formatDecimal(day.rain, "mm")),
    ...(showShiftedRain
      ? [
          row(
            "lagRain",
            `${RAIN_LAG_HINT.LAG_DAYS}~${RAIN_LAG_HINT.LAG_DAYS + RAIN_LAG_HINT.WINDOW_DAYS - 1}일 전 강수 합`,
            weather.rain,
            formatDecimal(day.lagRain, "mm"),
            WEATHER_CHART.SHIFTED_RAIN_OPACITY,
          ),
        ]
      : []),
    row("temperature", "기온 (최저~최고)", weather.temperature, temperature),
    row("ground", "지면온도", weather.ground, formatDecimal(day.groundTemp, "°C")),
    row("humidity", "습도", theme.palette.text.secondary, day.humidity === null ? "—" : `${Math.round(day.humidity)}%`),
  ];
};

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
      const yQuantity = d3.scaleLinear().domain([0, model.maxQuantity]).nice(WEATHER_CHART.Y_TICK_COUNT).range([rows.quantity, 0]);
      const yRain = d3.scaleLinear().domain([0, model.maxRain]).nice(WEATHER_CHART.Y_TICK_COUNT).range([rows.rain, 0]);
      /** 기온은 nice() 를 쓰면 범위가 −20~40° 처럼 크게 벌어져 변화가 납작해진다 — 실제 범위 그대로 */
      const yTemperature = d3.scaleLinear().domain(model.temperatureDomain).range([rows.temperature, 0]);

      /** 월 1·15일 눈금 — 좁으면 1일만 */
      const windowDates = weatherWindowDates(2001);
      const allTicks = windowDates
        .map((date, offset) => ({ date, offset }))
        .filter(({ date, offset }) => offset >= start && offset <= end && TICK_DAYS.includes(date.slice(8)));
      const ticks =
        allTicks.length > 1 && x(allTicks[1].offset) - x(allTicks[0].offset) < LINE_CHART.MIN_TICK_GAP
          ? allTicks.filter(({ date }) => date.endsWith("-01"))
          : allTicks;

      const svg = d3.select(svgEl).attr("width", width).attr("height", height);
      svg.selectAll("*").remove();
      const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      /** 줄 이름 — 플롯 왼쪽 위, 표면색 후광으로 막대 위에서도 읽히게 */
      const rowLabel = (g: d3.Selection<SVGGElement, unknown, null, undefined>, text: string) =>
        g
          .append("text")
          .attr("x", 4)
          .attr("y", 2)
          .attr("dy", "0.8em")
          .attr("font-size", fontSize)
          .attr("font-weight", 600)
          .attr("fill", palette.text.secondary)
          .attr("stroke", palette.surface.raised)
          .attr("stroke-width", LINE_CHART.LABEL_HALO_WIDTH)
          .attr("paint-order", "stroke")
          .text(text);

      /**
       * 왼쪽 y 눈금 + 옅은 격자.
       * 막대 줄은 0 라벨을 뺀다 — 기준선으로 충분하고, 위 줄의 0 과 아래 줄 최대값 라벨이 부딪힌다.
       */
      const yAxis = (
        g: d3.Selection<SVGGElement, unknown, null, undefined>,
        y: d3.ScaleLinear<number, number>,
        format: (v: number) => string,
        labelZero = true,
      ) => {
        const tickValues = y.ticks(WEATHER_CHART.Y_TICK_COUNT);
        g.append("g")
          .selectAll("line")
          .data(tickValues)
          .join("line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", (v) => y(v))
          .attr("y2", (v) => y(v))
          .attr("stroke", palette.surface.border)
          .attr("stroke-dasharray", (v) => (v === y.domain()[0] ? null : "2,4"));
        g.append("g")
          .selectAll("text")
          .data(labelZero ? tickValues : tickValues.filter((v) => v !== 0))
          .join("text")
          .attr("x", -LINE_CHART.Y_LABEL_OFFSET)
          .attr("y", (v) => y(v))
          .attr("dy", "0.32em")
          .attr("text-anchor", "end")
          .attr("font-size", fontSize)
          .attr("fill", palette.text.secondary)
          .style("font-variant-numeric", "tabular-nums")
          .text(format);
      };

      const bars = (
        g: d3.Selection<SVGGElement, unknown, null, undefined>,
        days: WeatherChartDay[],
        value: (d: WeatherChartDay) => number | null,
        y: d3.ScaleLinear<number, number>,
        color: string,
        opacity = 1,
      ) =>
        g
          .append("g")
          .selectAll("rect")
          .data(days.filter((d) => (value(d) ?? 0) > 0))
          .join("rect")
          .attr("x", (d) => x(d.offset) - barWidth / 2)
          .attr("width", barWidth)
          .attr("y", (d) => y(value(d) ?? 0))
          .attr("height", (d) => Math.max(0, y.range()[0] - y(value(d) ?? 0)))
          .attr("fill", color)
          .attr("opacity", opacity);

      const drawPanel = (panel: WeatherPanel, index: number) => {
        const top = index * (onePanel + WEATHER_CHART.PANEL_GAP);
        const g = root.append("g").attr("transform", `translate(0,${top})`);
        g.append("text")
          .attr("x", -margin.left + 4)
          .attr("y", WEATHER_CHART.PANEL_TITLE_HEIGHT / 2)
          .attr("dy", "0.32em")
          .attr("font-size", scaleFont(13))
          .attr("font-weight", 700)
          .attr("fill", palette.text.primary)
          .style("font-variant-numeric", "tabular-nums")
          .text(`${panel.year} 시즌`);

        const quantityTop = WEATHER_CHART.PANEL_TITLE_HEIGHT;
        const rainTop = quantityTop + rows.quantity + WEATHER_CHART.ROW_GAP;
        const temperatureTop = rainTop + rows.rain + WEATHER_CHART.ROW_GAP;

        const quantityRow = g.append("g").attr("transform", `translate(0,${quantityTop})`);
        yAxis(quantityRow, yQuantity, (v) => formatInteger(v), false);
        bars(quantityRow, panel.days, (d) => d.quantity, yQuantity, palette.chart.weight.main);
        rowLabel(quantityRow, "공판량 (kg)");

        const rainRow = g.append("g").attr("transform", `translate(0,${rainTop})`);
        yAxis(rainRow, yRain, (v) => formatInteger(v), false);
        if (showShiftedRain) {
          bars(rainRow, panel.days, (d) => d.shiftedRain, yRain, palette.chart.weather.rain, WEATHER_CHART.SHIFTED_RAIN_OPACITY);
        }
        bars(rainRow, panel.days, (d) => d.rain, yRain, palette.chart.weather.rain);
        rowLabel(rainRow, "강수 (mm)");

        const temperatureRow = g.append("g").attr("transform", `translate(0,${temperatureTop})`);
        yAxis(temperatureRow, yTemperature, (v) => `${v}°`);
        const band = d3
          .area<WeatherChartDay>()
          .defined((d) => d.minTa !== null && d.maxTa !== null)
          .x((d) => x(d.offset))
          .y0((d) => yTemperature(d.minTa ?? 0))
          .y1((d) => yTemperature(d.maxTa ?? 0))
          .curve(d3.curveMonotoneX);
        temperatureRow
          .append("path")
          .datum(panel.days)
          .attr("d", band)
          .attr("fill", palette.chart.weather.temperature)
          .attr("opacity", WEATHER_CHART.TEMPERATURE_BAND_OPACITY[palette.mode]);
        const groundLine = d3
          .line<WeatherChartDay>()
          .defined((d) => d.groundTemp !== null)
          .x((d) => x(d.offset))
          .y((d) => yTemperature(d.groundTemp ?? 0))
          .curve(d3.curveMonotoneX);
        temperatureRow
          .append("path")
          .datum(panel.days)
          .attr("d", groundLine)
          .attr("fill", "none")
          .attr("stroke", palette.chart.weather.ground)
          .attr("stroke-width", WEATHER_CHART.GROUND_STROKE)
          .attr("stroke-linejoin", "round");
        rowLabel(temperatureRow, "기온 범위 · 지면온도 (°C)");

        /** x 눈금 — 패널마다 붙여 스크롤해도 날짜를 잃지 않게 */
        const axisTop = temperatureTop + rows.temperature;
        g.append("g")
          .selectAll("text")
          .data(ticks)
          .join("text")
          .attr("x", (t) => x(t.offset))
          .attr("y", axisTop + LINE_CHART.X_LABEL_OFFSET)
          .attr("text-anchor", "middle")
          .attr("font-size", fontSize)
          .attr("fill", palette.text.secondary)
          .style("font-variant-numeric", "tabular-nums")
          .text((t) => `${Number(t.date.slice(5, 7))}/${Number(t.date.slice(8))}`);

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
