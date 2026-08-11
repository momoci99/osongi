import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { useContainerSize } from "../../../utils/d3/useContainerSize";
import { isMobileWidth, selectMargin } from "../../../utils/d3/chartMargins";
import { createD3Tooltip, removeD3Tooltip } from "../../../utils/d3Tooltip";
import { KILOGRAMS_PER_TON, KRW_TEN_THOUSAND_UNIT } from "../../../const/Units";
import { YEARLY_TREND_CHART } from "../../../const/Charts";
import type { YearStat } from "../../../types/region";

type UseDrawYearlyTrendParams = {
  yearly: YearStat[];
  height: number;
  theme: Theme;
};

/** 결측 연도를 빈 슬롯으로 채운 축 단위 데이터 */
type YearSlot = { year: number; stat: YearStat | null };

/**
 * 공판 기록이 없는 해를 축에서 지우면 남은 해가 붙어 버려
 * "매년 이어진 추이"로 오독된다. 전체 연도 범위를 축으로 잡고 빈 해는 비워 둔다.
 */
export const toYearSlots = (yearly: YearStat[]): YearSlot[] => {
  if (yearly.length === 0) return [];

  const byYear = new Map(yearly.map((entry) => [entry.year, entry]));
  const firstYear = yearly[0].year;
  const lastYear = yearly[yearly.length - 1].year;

  return d3
    .range(firstYear, lastYear + 1)
    .map((year) => ({ year, stat: byYear.get(year) ?? null }));
};

/** 첫·끝은 네 자리, 중간은 두 자리. 축이 빽빽해지지 않으면서 기간이 읽힌다 */
const formatYearTick = (year: number, first: number, last: number): string =>
  year === first || year === last ? String(year) : String(year).slice(2);

/**
 * 연도별 공판량(막대)과 평균 단가(선)를 한 좌표계에 겹쳐 그린다.
 * 물량이 많은 해가 곧 고가인 해는 아니라는 점이 이 페이지의 핵심 정보라
 * 두 계열을 같은 x축에 묶어야 비교가 성립한다.
 */
const useDrawYearlyTrend = ({ yearly, height, theme }: UseDrawYearlyTrendParams) => {
  const { containerRef, width } = useContainerSize();
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(
    function drawYearlyTrend() {
      const svgEl = svgRef.current;
      if (!svgEl || width === 0 || yearly.length === 0) return;

      const slots = toYearSlots(yearly);
      const isMobile = isMobileWidth(width);
      const baseMargin = selectMargin(
        width,
        YEARLY_TREND_CHART.MARGIN.MOBILE,
        YEARLY_TREND_CHART.MARGIN.DESKTOP
      );

      /**
       * 모바일은 좌우 축 라벨 2개가 폭을 잠식해 막대가 실처럼 얇아진다.
       * 가격 축 라벨을 접고(값은 툴팁으로) 그 폭을 막대에 돌려준다.
       */
      const showPriceAxis = !isMobile;
      const margin = showPriceAxis
        ? baseMargin
        : { ...baseMargin, right: YEARLY_TREND_CHART.MOBILE_RIGHT_MARGIN };

      /** 막대가 최소 폭을 못 지키면 가로 스크롤로 확보한다 */
      const minPlotWidth =
        (slots.length * YEARLY_TREND_CHART.MIN_BAR_WIDTH) /
        (1 - YEARLY_TREND_CHART.BAND_PADDING);
      const chartWidth = Math.max(width, minPlotWidth + margin.left + margin.right);
      const innerWidth = Math.max(0, chartWidth - margin.left - margin.right);
      const innerHeight = Math.max(0, height - margin.top - margin.bottom);

      const svg = d3
        .select(svgEl)
        .attr("width", chartWidth)
        .attr("height", height)
        .attr("viewBox", `0 0 ${chartWidth} ${height}`);
      svg.selectAll("*").remove();

      const root = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleBand<number>()
        .domain(slots.map((slot) => slot.year))
        .range([0, innerWidth])
        .padding(YEARLY_TREND_CHART.BAND_PADDING);

      const maxTon =
        d3.max(yearly, (entry) => entry.totalQuantityKg / KILOGRAMS_PER_TON) ?? 0;
      const yQuantity = d3
        .scaleLinear()
        .domain([0, maxTon * YEARLY_TREND_CHART.Y_HEADROOM])
        .nice()
        .range([innerHeight, 0]);

      const maxPrice = d3.max(yearly, (entry) => entry.avgPricePerKg) ?? 0;
      const yPrice = d3
        .scaleLinear()
        .domain([0, maxPrice * YEARLY_TREND_CHART.Y_HEADROOM])
        .nice()
        .range([innerHeight, 0]);

      /** 가로 그리드만 남겨 막대·선 판독을 방해하지 않는다 */
      root
        .append("g")
        .attr("class", "grid")
        .call(
          d3
            .axisLeft(yQuantity)
            .ticks(YEARLY_TREND_CHART.Y_TICKS)
            .tickSize(-innerWidth)
            .tickFormat(() => "")
        )
        .call((g) => g.select(".domain").remove())
        .selectAll("line")
        .attr("stroke", theme.palette.divider)
        .attr("stroke-dasharray", "2,3");

      const firstYear = slots[0].year;
      const lastYear = slots[slots.length - 1].year;
      const tickStep = isMobile
        ? Math.ceil(slots.length / YEARLY_TREND_CHART.MOBILE_MAX_TICKS)
        : 1;
      /** 눈금을 솎아내도 첫·끝 해는 남겨 기간이 보이게 한다 */
      const tickYears = x
        .domain()
        .filter(
          (year, index) =>
            index % tickStep === 0 || year === firstYear || year === lastYear
        );

      root
        .append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(
          d3
            .axisBottom(x)
            .tickValues(tickYears)
            .tickFormat((year) => formatYearTick(Number(year), firstYear, lastYear))
        )
        .call((g) => g.select(".domain").attr("stroke", theme.palette.divider))
        .selectAll("text")
        .attr("fill", theme.palette.text.secondary)
        .attr("font-size", YEARLY_TREND_CHART.FONT_SIZE);

      root
        .append("g")
        .call(
          d3
            .axisLeft(yQuantity)
            .ticks(YEARLY_TREND_CHART.Y_TICKS)
            .tickFormat((value) => `${value}t`)
        )
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll("line").remove())
        .selectAll("text")
        .attr("fill", theme.palette.chart.weight.main)
        .attr("font-size", YEARLY_TREND_CHART.FONT_SIZE);

      if (showPriceAxis) {
        root
          .append("g")
          .attr("transform", `translate(${innerWidth},0)`)
          .call(
            d3
              .axisRight(yPrice)
              .ticks(YEARLY_TREND_CHART.Y_TICKS)
              .tickFormat(
                (value) => `${Math.round(Number(value) / KRW_TEN_THOUSAND_UNIT)}만`
              )
          )
          .call((g) => g.select(".domain").remove())
          .call((g) => g.selectAll("line").remove())
          .selectAll("text")
          .attr("fill", theme.palette.chart.price.main)
          .attr("font-size", YEARLY_TREND_CHART.FONT_SIZE);
      }

      const tooltip = createD3Tooltip(theme);
      const recorded = slots.filter(
        (slot): slot is { year: number; stat: YearStat } => slot.stat !== null
      );

      root
        .append("g")
        .selectAll("rect")
        .data(recorded)
        .join("rect")
        .attr("x", (slot) => x(slot.year) ?? 0)
        .attr("width", x.bandwidth())
        .attr("y", (slot) => yQuantity(slot.stat.totalQuantityKg / KILOGRAMS_PER_TON))
        .attr(
          "height",
          (slot) =>
            innerHeight - yQuantity(slot.stat.totalQuantityKg / KILOGRAMS_PER_TON)
        )
        .attr("rx", YEARLY_TREND_CHART.BAR_RADIUS)
        .attr("fill", theme.palette.chart.weight.main)
        .attr("opacity", YEARLY_TREND_CHART.BAR_OPACITY)
        .on("mousemove", (event: MouseEvent, slot) => {
          tooltip
            .style("opacity", "1")
            .style("left", `${event.pageX + 12}px`)
            .style("top", `${event.pageY - 12}px`)
            .html(
              `<strong>${slot.year}년</strong><br/>공판량 ${Math.round(
                slot.stat.totalQuantityKg
              ).toLocaleString()}kg<br/>평균 단가 ${slot.stat.avgPricePerKg.toLocaleString()}원/kg`
            );
        })
        .on("mouseleave", () => tooltip.style("opacity", "0"));

      /** 기록이 없는 해에서는 선을 끊는다 */
      const line = d3
        .line<YearSlot>()
        .defined((slot) => slot.stat !== null)
        .x((slot) => (x(slot.year) ?? 0) + x.bandwidth() / 2)
        .y((slot) => yPrice(slot.stat?.avgPricePerKg ?? 0))
        .curve(d3.curveMonotoneX);

      root
        .append("path")
        .datum(slots)
        .attr("fill", "none")
        .attr("stroke", theme.palette.chart.price.main)
        .attr("stroke-width", YEARLY_TREND_CHART.LINE_WIDTH)
        .attr("d", line);

      root
        .append("g")
        .selectAll("circle")
        .data(recorded)
        .join("circle")
        .attr("cx", (slot) => (x(slot.year) ?? 0) + x.bandwidth() / 2)
        .attr("cy", (slot) => yPrice(slot.stat.avgPricePerKg))
        .attr("r", YEARLY_TREND_CHART.DOT_RADIUS)
        .attr("fill", theme.palette.background.paper)
        .attr("stroke", theme.palette.chart.price.main)
        .attr("stroke-width", YEARLY_TREND_CHART.LINE_WIDTH);

      return () => {
        removeD3Tooltip();
      };
    },
    [yearly, height, theme, width]
  );

  return { containerRef, svgRef };
};

export default useDrawYearlyTrend;
