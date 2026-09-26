import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { LINE_CHART, WEATHER_CHART } from "../../../../const/AnalysisLayout";
import { RAIN_LAG_HINT } from "../../../../const/Weather";
import { formatInteger } from "../../../../utils/analysisQuery/format";
import type { WeatherChartDay, WeatherPanel } from "../../../../utils/weather/weatherChartModel";
import type { TooltipRow } from "../lineTooltip";

export type Group = d3.Selection<SVGGElement, unknown, null, undefined>;

/** 그리기 공통 문맥 */
export type DrawContext = {
  x: d3.ScaleLinear<number, number>;
  innerWidth: number;
  barWidth: number;
  fontSize: number;
  palette: Theme["palette"];
};

/** 눈금 날짜 */
export type DateTick = { date: string; offset: number };

const formatDecimal = (value: number | null, unit: string) => (value === null ? "—" : `${value.toFixed(1)}${unit}`);

/** M/D */
export const formatShortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

/** 툴팁 제목용 M월 D일 */
export const formatMonthDay = (date: string) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;

/** 호버한 하루의 툴팁 행 */
export const tooltipRows = (day: WeatherChartDay, theme: Theme, showShiftedRain: boolean): TooltipRow[] => {
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

/** 줄 이름 — 플롯 위 띠에 두어 막대·선과 겹치지 않는다 */
export const drawRowLabel = (g: Group, { fontSize, palette }: DrawContext, text: string) =>
  g
    .append("text")
    .attr("x", 0)
    .attr("y", -WEATHER_CHART.ROW_LABEL_HEIGHT / 2)
    .attr("dy", "0.32em")
    .attr("font-size", fontSize)
    .attr("font-weight", 600)
    .attr("fill", palette.text.secondary)
    .text(text);

/**
 * 왼쪽 y 눈금 + 옅은 격자.
 * 막대 줄은 0 라벨을 뺀다 — 실선 기준선으로 충분하다.
 */
export const drawYAxis = (
  g: Group,
  { innerWidth, fontSize, palette }: DrawContext,
  y: d3.ScaleLinear<number, number>,
  tickCount: number,
  format: (v: number) => string,
  labelZero = true,
) => {
  const tickValues = y.ticks(tickCount);
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

/** 일별 막대 */
export const drawBars = (
  g: Group,
  { x, barWidth }: DrawContext,
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

/** 기온 줄 — 최저~최고 옅은 면 + 윤곽선, 그 위에 후광 두른 지면온도 선 */
export const drawTemperature = (
  g: Group,
  { x, palette }: DrawContext,
  days: WeatherChartDay[],
  y: d3.ScaleLinear<number, number>,
) => {
  const { temperature, ground } = palette.chart.weather;
  const hasRange = (d: WeatherChartDay) => d.minTa !== null && d.maxTa !== null;
  const band = d3
    .area<WeatherChartDay>()
    .defined(hasRange)
    .x((d) => x(d.offset))
    .y0((d) => y(d.minTa ?? 0))
    .y1((d) => y(d.maxTa ?? 0))
    .curve(d3.curveMonotoneX);
  g.append("path")
    .datum(days)
    .attr("d", band)
    .attr("fill", temperature)
    .attr("opacity", WEATHER_CHART.TEMPERATURE_BAND_OPACITY[palette.mode]);

  const edge = (value: (d: WeatherChartDay) => number | null) =>
    d3
      .line<WeatherChartDay>()
      .defined(hasRange)
      .x((d) => x(d.offset))
      .y((d) => y(value(d) ?? 0))
      .curve(d3.curveMonotoneX);
  for (const value of [(d: WeatherChartDay) => d.maxTa, (d: WeatherChartDay) => d.minTa]) {
    g.append("path")
      .datum(days)
      .attr("d", edge(value))
      .attr("fill", "none")
      .attr("stroke", temperature)
      .attr("stroke-width", 1)
      .attr("opacity", WEATHER_CHART.TEMPERATURE_EDGE_OPACITY);
  }

  const groundLine = d3
    .line<WeatherChartDay>()
    .defined((d) => d.groundTemp !== null)
    .x((d) => x(d.offset))
    .y((d) => y(d.groundTemp ?? 0))
    .curve(d3.curveMonotoneX);
  for (const [stroke, width] of [
    [palette.surface.raised, WEATHER_CHART.GROUND_HALO_WIDTH],
    [ground, WEATHER_CHART.GROUND_STROKE],
  ] as const) {
    g.append("path")
      .datum(days)
      .attr("d", groundLine)
      .attr("fill", "none")
      .attr("stroke", stroke)
      .attr("stroke-width", width)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round");
  }
};

/** x 눈금 — 1·15일 라벨 + 라벨 없는 보조 눈금 */
export const drawXAxis = (
  g: Group,
  { x, fontSize, palette }: DrawContext,
  axisTop: number,
  labelTicks: DateTick[],
  minorTicks: DateTick[],
) => {
  g.append("g")
    .selectAll("line")
    .data([...labelTicks, ...minorTicks])
    .join("line")
    .attr("x1", (t) => x(t.offset))
    .attr("x2", (t) => x(t.offset))
    .attr("y1", axisTop)
    .attr("y2", (t) => axisTop + (labelTicks.includes(t) ? WEATHER_CHART.MINOR_TICK_LENGTH * 1.5 : WEATHER_CHART.MINOR_TICK_LENGTH))
    .attr("stroke", palette.surface.borderStrong);
  g.append("g")
    .selectAll("text")
    .data(labelTicks)
    .join("text")
    .attr("x", (t) => x(t.offset))
    .attr("y", axisTop + LINE_CHART.X_LABEL_OFFSET)
    .attr("text-anchor", "middle")
    .attr("font-size", fontSize)
    .attr("fill", palette.text.secondary)
    .style("font-variant-numeric", "tabular-nums")
    .text((t) => formatShortDate(t.date));
};

/**
 * 기상 자료 끝 — 마지막 관측일 오른쪽 끝에 세로 점선과 "기상 자료 M/D까지".
 * 라벨은 강수 줄 이름 띠에 둬 데이터와 겹치지 않는다.
 */
export const drawWeatherEnd = (
  g: Group,
  { x, barWidth, fontSize, palette }: DrawContext,
  weatherEnd: NonNullable<WeatherPanel["weatherEnd"]>,
  rainTop: number,
  axisTop: number,
) => {
  const px = x(weatherEnd.offset) + barWidth / 2 + WEATHER_CHART.BAR_GAP;
  g.append("line")
    .attr("x1", px)
    .attr("x2", px)
    .attr("y1", rainTop - WEATHER_CHART.ROW_LABEL_HEIGHT / 2)
    .attr("y2", axisTop)
    .attr("stroke", palette.text.disabled)
    .attr("stroke-dasharray", "2,3");
  g.append("text")
    .attr("x", px + WEATHER_CHART.WEATHER_END_LABEL_GAP)
    .attr("y", rainTop - WEATHER_CHART.ROW_LABEL_HEIGHT / 2)
    .attr("dy", "0.32em")
    .attr("font-size", fontSize)
    .attr("fill", palette.text.secondary)
    .style("font-variant-numeric", "tabular-nums")
    .text(`기상 자료 ${formatShortDate(weatherEnd.date)}까지`);
};
