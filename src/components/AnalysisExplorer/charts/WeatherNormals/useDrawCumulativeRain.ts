import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { CUMULATIVE_RAIN_CHART, LINE_CHART, WEATHER_CHART } from "../../../../const/AnalysisLayout";
import { useContainerWidth } from "../../../../utils/d3/useContainerSize";
import { isMobileWidth, scaleFont, scaleMargin } from "../../../../utils/d3/chartMargins";
import { formatInteger } from "../../../../utils/analysisQuery/format";
import {
  describeRank,
  type CumulativeRainDay,
  type CumulativeRainModel,
} from "../../../../utils/weather/weatherNormals";
import { hideTooltip, placeTooltip } from "../chartTooltip";
import { renderTooltipHtml, type TooltipRow } from "../lineTooltip";
import { useSettingsStore } from "../../../../stores/useSettingsStore";

type UseDrawCumulativeRainParams = {
  model: CumulativeRainModel;
  selectedYear: number;
  theme: Theme;
};

const formatMm = (value: number | null) => (value === null ? "—" : `${formatInteger(Math.round(value))}mm`);

/** 호버한 날의 툴팁 행 */
const tooltipRows = (day: CumulativeRainDay, selectedYear: number, theme: Theme): TooltipRow[] => {
  const { palette } = theme;
  const row = (key: string, label: string, color: string, value: string, opacity = 1): TooltipRow => ({
    key,
    label,
    color,
    value,
    detail: "",
    lowSample: false,
    opacity,
  });
  return [
    row("selected", `${selectedYear} 시즌`, palette.chart.weather.rain, formatMm(day.selected)),
    row("median", "역대 중앙값", palette.text.secondary, formatMm(day.median)),
    row(
      "range",
      "역대 범위",
      palette.chart.weather.rain,
      day.min === null || day.max === null ? "—" : `${formatMm(day.min)} ~ ${formatMm(day.max)}`,
      CUMULATIVE_RAIN_CHART.BAND_OPACITY[palette.mode] * 2,
    ),
  ];
};

/** 누적 강수 곡선 — 역대 범위 띠 + 중앙값 점선 + 선택 시즌 선 */
const useDrawCumulativeRain = ({ model, selectedYear, theme }: UseDrawCumulativeRainParams) => {
  /** 큰글씨 모드를 켜고 끄면 글자 크기가 달라져 다시 그려야 한다 */
  const displayMode = useSettingsStore((state) => state.displayMode);
  const { containerRef, width } = useContainerWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    function drawCumulativeRain() {
      const svgEl = svgRef.current;
      const tooltipEl = tooltipRef.current;
      if (!svgEl || !tooltipEl || width === 0 || model.days.length === 0) return;

      const { palette } = theme;
      const mobile = isMobileWidth(width);
      const margin = scaleMargin(mobile ? CUMULATIVE_RAIN_CHART.MARGIN.MOBILE : CUMULATIVE_RAIN_CHART.MARGIN.DESKTOP);
      const height = mobile ? CUMULATIVE_RAIN_CHART.HEIGHT.MOBILE : CUMULATIVE_RAIN_CHART.HEIGHT.DESKTOP;
      const innerWidth = Math.max(0, width - margin.left - margin.right);
      const innerHeight = height - margin.top - margin.bottom;
      const fontSize = scaleFont(LINE_CHART.AXIS_FONT_SIZE);
      const rainColor = palette.chart.weather.rain;

      const lastOffset = model.days.length - 1;
      const x = d3.scaleLinear().domain([0, lastOffset]).range([0, innerWidth]);
      const maxValue = d3.max(model.days, (d) => Math.max(d.max ?? 0, d.selected ?? 0)) ?? 0;
      const y = d3
        .scaleLinear()
        .domain([0, Math.max(1, maxValue)])
        .nice(CUMULATIVE_RAIN_CHART.Y_TICK_COUNT)
        .range([innerHeight, 0]);

      const svg = d3.select(svgEl).attr("width", width).attr("height", height);
      svg.selectAll("*").remove();
      const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      /** y 눈금 + 옅은 격자 */
      const yTicks = y.ticks(CUMULATIVE_RAIN_CHART.Y_TICK_COUNT);
      root
        .append("g")
        .selectAll("line")
        .data(yTicks)
        .join("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", (v) => y(v))
        .attr("y2", (v) => y(v))
        .attr("stroke", palette.surface.border)
        .attr("stroke-dasharray", (v) => (v === 0 ? null : "2,4"));
      root
        .append("g")
        .selectAll("text")
        .data(yTicks)
        .join("text")
        .attr("x", -LINE_CHART.Y_LABEL_OFFSET)
        .attr("y", (v) => y(v))
        .attr("dy", "0.32em")
        .attr("text-anchor", "end")
        .attr("font-size", fontSize)
        .attr("fill", palette.text.secondary)
        .style("font-variant-numeric", "tabular-nums")
        .text((v) => formatInteger(v));

      /** x 눈금 — 매월 1일 */
      const monthStarts = model.days.filter((d) => d.monthDay.endsWith("-01"));
      root
        .append("g")
        .selectAll("text")
        .data(monthStarts)
        .join("text")
        .attr("x", (d) => x(d.offset))
        .attr("y", innerHeight + LINE_CHART.X_LABEL_OFFSET)
        .attr("text-anchor", "middle")
        .attr("font-size", fontSize)
        .attr("fill", palette.text.secondary)
        .text((d) => `${Number(d.monthDay.slice(0, 2))}월`);

      const band = d3
        .area<CumulativeRainDay>()
        .defined((d) => d.min !== null && d.max !== null)
        .x((d) => x(d.offset))
        .y0((d) => y(d.min ?? 0))
        .y1((d) => y(d.max ?? 0));
      root
        .append("path")
        .datum(model.days)
        .attr("d", band)
        .attr("fill", rainColor)
        .attr("opacity", CUMULATIVE_RAIN_CHART.BAND_OPACITY[palette.mode]);

      const lineOf = (value: (d: CumulativeRainDay) => number | null) =>
        d3
          .line<CumulativeRainDay>()
          .defined((d) => value(d) !== null)
          .x((d) => x(d.offset))
          .y((d) => y(value(d) ?? 0));
      root
        .append("path")
        .datum(model.days)
        .attr("d", lineOf((d) => d.median))
        .attr("fill", "none")
        .attr("stroke", palette.text.secondary)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", CUMULATIVE_RAIN_CHART.MEDIAN_DASH);
      root
        .append("path")
        .datum(model.days)
        .attr("d", lineOf((d) => d.selected))
        .attr("fill", "none")
        .attr("stroke", rainColor)
        .attr("stroke-width", CUMULATIVE_RAIN_CHART.LINE_STROKE)
        .attr("stroke-linejoin", "round");

      /** 선 끝 직접 라벨 — 선택 시즌 연도 */
      const lastSelected = d3.greatest(
        model.days.filter((d) => d.selected !== null),
        (d) => d.offset,
      );
      if (lastSelected) {
        const nearRightEdge = x(lastSelected.offset) > innerWidth - 48;
        root
          .append("text")
          .attr("x", x(lastSelected.offset) + (nearRightEdge ? -6 : 6))
          .attr("y", y(lastSelected.selected ?? 0) - (nearRightEdge ? 10 : 0))
          .attr("dy", "0.32em")
          .attr("text-anchor", nearRightEdge ? "end" : "start")
          .attr("font-size", fontSize)
          .attr("font-weight", 700)
          .attr("fill", palette.text.primary)
          .attr("stroke", palette.surface.raised)
          .attr("stroke-width", LINE_CHART.LABEL_HALO_WIDTH)
          .attr("paint-order", "stroke")
          .text(String(selectedYear));
      }

      /** 호버 — 안내선 + 선택 시즌 점 + 툴팁 */
      const guide = root
        .append("line")
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", palette.surface.borderStrong)
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0)
        .attr("pointer-events", "none");
      const focus = root
        .append("circle")
        .attr("r", CUMULATIVE_RAIN_CHART.FOCUS_RADIUS)
        .attr("fill", rainColor)
        .attr("stroke", palette.surface.raised)
        .attr("stroke-width", 2)
        .attr("opacity", 0)
        .attr("pointer-events", "none");
      root
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("fill", "transparent")
        .on("pointermove", function showDay(event: PointerEvent) {
          const [px] = d3.pointer(event, this);
          const day = model.days[Math.max(0, Math.min(lastOffset, Math.round(x.invert(px))))];
          guide.attr("x1", x(day.offset)).attr("x2", x(day.offset)).attr("opacity", WEATHER_CHART.GUIDE_OPACITY);
          focus
            .attr("cx", x(day.offset))
            .attr("cy", y(day.selected ?? 0))
            .attr("opacity", day.selected === null ? 0 : 1);
          tooltipEl.innerHTML = renderTooltipHtml({
            title: `7월 1일 ~ ${Number(day.monthDay.slice(0, 2))}월 ${Number(day.monthDay.slice(3))}일 누적`,
            rows: tooltipRows(day, selectedYear, theme),
            normal: day.rank ? `${selectedYear} 시즌: ${describeRank(day.rank, "rain")}` : null,
          });
          const [cx, cy] = d3.pointer(event, containerRef.current);
          placeTooltip(tooltipEl, cx, cy, containerRef.current?.clientWidth ?? width);
        })
        .on("pointerleave", function hideDay() {
          guide.attr("opacity", 0);
          focus.attr("opacity", 0);
          hideTooltip(tooltipEl);
        });
    },
    [model, selectedYear, theme, width, containerRef, displayMode],
  );

  return { containerRef, svgRef, tooltipRef };
};

export default useDrawCumulativeRain;
