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

      const isMobile = isMobileWidth(width);
      const margin = selectMargin(
        width,
        YEARLY_TREND_CHART.MARGIN.MOBILE,
        YEARLY_TREND_CHART.MARGIN.DESKTOP
      );
      const innerWidth = Math.max(0, width - margin.left - margin.right);
      const innerHeight = Math.max(0, height - margin.top - margin.bottom);

      const svg = d3
        .select(svgEl)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`);
      svg.selectAll("*").remove();

      const root = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleBand<number>()
        .domain(yearly.map((entry) => entry.year))
        .range([0, innerWidth])
        .padding(YEARLY_TREND_CHART.BAND_PADDING);

      const maxTon = d3.max(yearly, (entry) => entry.totalQuantityKg / KILOGRAMS_PER_TON) ?? 0;
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

      const tickStep = isMobile
        ? Math.ceil(yearly.length / YEARLY_TREND_CHART.MOBILE_MAX_TICKS)
        : 1;

      root
        .append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(
          d3
            .axisBottom(x)
            .tickValues(x.domain().filter((_, index) => index % tickStep === 0))
            .tickFormat((year) => `${String(year).slice(2)}`)
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

      const tooltip = createD3Tooltip(theme);

      root
        .append("g")
        .selectAll("rect")
        .data(yearly)
        .join("rect")
        .attr("x", (entry) => x(entry.year) ?? 0)
        .attr("width", x.bandwidth())
        .attr("y", (entry) => yQuantity(entry.totalQuantityKg / KILOGRAMS_PER_TON))
        .attr(
          "height",
          (entry) =>
            innerHeight - yQuantity(entry.totalQuantityKg / KILOGRAMS_PER_TON)
        )
        .attr("rx", YEARLY_TREND_CHART.BAR_RADIUS)
        .attr("fill", theme.palette.chart.weight.main)
        .attr("opacity", YEARLY_TREND_CHART.BAR_OPACITY)
        .on("mousemove", (event: MouseEvent, entry) => {
          tooltip
            .style("opacity", "1")
            .style("left", `${event.pageX + 12}px`)
            .style("top", `${event.pageY - 12}px`)
            .html(
              `<strong>${entry.year}년</strong><br/>공판량 ${Math.round(
                entry.totalQuantityKg
              ).toLocaleString()}kg<br/>평균 단가 ${entry.avgPricePerKg.toLocaleString()}원/kg`
            );
        })
        .on("mouseleave", () => tooltip.style("opacity", "0"));

      const line = d3
        .line<YearStat>()
        .x((entry) => (x(entry.year) ?? 0) + x.bandwidth() / 2)
        .y((entry) => yPrice(entry.avgPricePerKg))
        .curve(d3.curveMonotoneX);

      root
        .append("path")
        .datum(yearly)
        .attr("fill", "none")
        .attr("stroke", theme.palette.chart.price.main)
        .attr("stroke-width", YEARLY_TREND_CHART.LINE_WIDTH)
        .attr("d", line);

      root
        .append("g")
        .selectAll("circle")
        .data(yearly)
        .join("circle")
        .attr("cx", (entry) => (x(entry.year) ?? 0) + x.bandwidth() / 2)
        .attr("cy", (entry) => yPrice(entry.avgPricePerKg))
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
