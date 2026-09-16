import { useEffect, useRef, type RefObject } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { useContainerWidth } from "../../../utils/d3/useContainerSize";
import { SEASON_STRIP } from "../../../const/AnalysisLayout";
import { SEASON_NOTES } from "../../../const/Analysis";
import {
  fromWindowOffset,
  toWindowOffset,
} from "../../../utils/analysisQuery/seasonWindow";
import { formatQuantity } from "../../../utils/analysisQuery/format";
import type { AnalysisTime } from "../../../utils/analysisQuery/types";

type UseDrawSeasonStripParams = {
  years: number[];
  dailyQuantity: Map<string, number>;
  time: AnalysisTime;
  theme: Theme;
  /** 호버 날짜·물량을 리렌더 없이 표시할 요소 */
  readoutRef: RefObject<HTMLSpanElement | null>;
  onYearClick: (year: number, additive: boolean) => void;
  onRangeSelect: (start: string, end: string) => void;
};

/** 날짜가 현재 선택에 포함되는지 */
const isSelectedDate = (date: string, time: AnalysisTime): boolean =>
  time.kind === "seasons"
    ? time.years.includes(Number(date.slice(0, 4)))
    : date >= time.start && date <= time.end;

/** 연도 라벨이 강조 대상인지 (시즌 선택이거나 기간이 걸친 해) */
const isSelectedYear = (year: number, time: AnalysisTime): boolean =>
  time.kind === "seasons"
    ? time.years.includes(year)
    : year >= Number(time.start.slice(0, 4)) && year <= Number(time.end.slice(0, 4));

/**
 * 시즌 스트립 D3 렌더링.
 * 연도마다 09-01~11-30 창만 잘라 이어 붙이고, 일별 공판량을 제곱근 막대로 그린다.
 * 클릭은 시즌 선택, 드래그는 달력 기간 선택으로 해석한다.
 */
const useDrawSeasonStrip = ({
  years,
  dailyQuantity,
  time,
  theme,
  readoutRef,
  onYearClick,
  onRangeSelect,
}: UseDrawSeasonStripParams) => {
  const { containerRef, width } = useContainerWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  /** 핸들러 교체만으로 전체를 다시 그리지 않도록 ref로 보관 */
  const handlersRef = useRef({ onYearClick, onRangeSelect });

  useEffect(function syncStripHandlers() {
    handlersRef.current = { onYearClick, onRangeSelect };
  });

  useEffect(
    function drawSeasonStrip() {
      const svgEl = svgRef.current;
      if (!svgEl || width === 0 || years.length === 0) return;

      const { PLOT_HEIGHT, LABEL_HEIGHT, WINDOW_DAYS, LABEL_FONT_SIZE, LABEL_BASELINE } = SEASON_STRIP;
      const height = PLOT_HEIGHT + LABEL_HEIGHT;
      const compactLabel = width < SEASON_STRIP.COMPACT_LABEL_WIDTH;

      const svg = d3.select(svgEl).attr("width", width).attr("height", height);
      svg.selectAll("*").remove();

      const x = d3
        .scaleBand<number>()
        .domain(years)
        .range([0, width])
        .paddingInner(SEASON_STRIP.BAND_PADDING);
      const dayWidth = x.bandwidth() / WINDOW_DAYS;
      const step = x.step();

      const yearSet = new Set(years);
      const entries = [...dailyQuantity].filter(([date]) =>
        yearSet.has(Number(date.slice(0, 4))),
      );
      const maxQuantity = d3.max(entries, ([, quantity]) => quantity) ?? 0;
      const y = d3.scaleSqrt().domain([0, maxQuantity]).range([0, PLOT_HEIGHT - 2]);

      const bandX = (year: number) => x(year) ?? 0;
      const dateX = (date: string) =>
        bandX(Number(date.slice(0, 4))) + toWindowOffset(date) * dayWidth;

      /** 픽셀 → 날짜. 연도 사이 여백은 가까운 쪽 연도로 붙인다 */
      const pixelToDate = (px: number): string => {
        const index = Math.min(Math.max(Math.floor((px + (step - x.bandwidth()) / 2) / step), 0), years.length - 1);
        const year = years[index];
        return fromWindowOffset(year, (px - bandX(year)) / dayWidth);
      };

      svg
        .append("g")
        .selectAll("rect")
        .data(years)
        .join("rect")
        .attr("x", bandX)
        .attr("y", PLOT_HEIGHT - 1)
        .attr("width", x.bandwidth())
        .attr("height", 1)
        .attr("fill", theme.palette.surface.border);

      if (time.kind === "range") {
        const startX = dateX(time.start);
        const endX = dateX(time.end) + dayWidth;
        svg
          .append("rect")
          .attr("x", startX)
          .attr("y", 0)
          .attr("width", Math.max(endX - startX, dayWidth))
          .attr("height", PLOT_HEIGHT)
          .attr("rx", 2)
          .attr("fill", theme.palette.primary.main)
          .attr("fill-opacity", SEASON_STRIP.RANGE_FILL_OPACITY);
      }

      svg
        .append("g")
        .selectAll("rect")
        .data(entries)
        .join("rect")
        .attr("x", ([date]) => dateX(date))
        .attr("y", ([, quantity]) => PLOT_HEIGHT - 1 - y(quantity))
        .attr("width", Math.max(dayWidth - SEASON_STRIP.BAR_GAP, SEASON_STRIP.MIN_BAR_WIDTH))
        .attr("height", ([, quantity]) => y(quantity))
        .attr("fill", theme.palette.primary.main)
        .attr("fill-opacity", ([date]) =>
          isSelectedDate(date, time) ? 1 : SEASON_STRIP.MUTED_OPACITY,
        );

      const labels = svg
        .append("g")
        .attr("transform", `translate(0, ${PLOT_HEIGHT + LABEL_BASELINE})`)
        .selectAll<SVGTextElement, number>("text")
        .data(years)
        .join("text")
        .attr("x", (year) => bandX(year) + x.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", LABEL_FONT_SIZE)
        .attr("font-weight", (year) => (isSelectedYear(year, time) ? 700 : 500))
        .attr("fill", (year) =>
          isSelectedYear(year, time)
            ? theme.palette.text.primary
            : theme.palette.text.disabled,
        )
        .style("font-variant-numeric", "tabular-nums")
        .text((year) => (compactLabel ? `'${String(year).slice(2)}` : String(year)));

      labels.each(function drawNoteDot(year) {
        const note = SEASON_NOTES[year];
        if (!note) return;
        const labelWidth = this.getComputedTextLength?.() ?? 0;
        svg
          .append("circle")
          .attr("cx", bandX(year) + x.bandwidth() / 2 + labelWidth / 2 + SEASON_STRIP.NOTE_DOT_GAP)
          .attr("cy", PLOT_HEIGHT + LABEL_BASELINE - LABEL_FONT_SIZE / 2 + 1)
          .attr("r", SEASON_STRIP.NOTE_DOT_RADIUS)
          .attr("fill", theme.palette.secondary.main)
          .append("title")
          .text(`${year}: ${note}`);
      });

      const guide = svg
        .append("line")
        .attr("y1", 0)
        .attr("y2", PLOT_HEIGHT)
        .attr("stroke", theme.palette.text.secondary)
        .attr("stroke-width", 1)
        .attr("pointer-events", "none")
        .style("display", "none");

      const brushGroup = svg.append("g");
      const brush = d3
        .brushX()
        .extent([
          [0, 0],
          [width, height],
        ])
        .on("end", function handleBrushEnd(event: d3.D3BrushEvent<unknown>) {
          if (!event.sourceEvent) return;

          if (event.selection) {
            const [x0, x1] = event.selection as [number, number];
            brushGroup.call(brush.move, null);
            handlersRef.current.onRangeSelect(pixelToDate(x0), pixelToDate(x1));
            return;
          }

          const [px] = d3.pointer(event.sourceEvent, svgEl);
          const source = event.sourceEvent as MouseEvent;
          const additive = source.shiftKey || source.metaKey || source.ctrlKey;
          handlersRef.current.onYearClick(Number(pixelToDate(px).slice(0, 4)), additive);
        });

      brushGroup.call(brush);
      brushGroup.select(".selection").attr("fill", theme.palette.primary.main).attr("stroke", "none");
      brushGroup
        .on("mousemove.readout", function showReadout(event: MouseEvent) {
          const [px] = d3.pointer(event, svgEl);
          const date = pixelToDate(px);
          const quantity = dailyQuantity.get(date);
          guide.style("display", null).attr("x1", dateX(date)).attr("x2", dateX(date));
          if (readoutRef.current) {
            const formatted = quantity ? formatQuantity(quantity) : null;
            readoutRef.current.textContent = formatted
              ? `${date} · ${formatted.value}${formatted.unit}`
              : `${date} · 공판 없음`;
          }
        })
        .on("mouseleave.readout", function hideReadout() {
          guide.style("display", "none");
          if (readoutRef.current) readoutRef.current.textContent = "";
        });
    },
    [width, years, dailyQuantity, time, theme, readoutRef],
  );

  return { containerRef, svgRef };
};

export default useDrawSeasonStrip;
