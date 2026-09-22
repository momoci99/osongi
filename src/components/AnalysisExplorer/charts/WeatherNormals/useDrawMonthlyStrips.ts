import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { LINE_CHART, NORMAL_STRIP_CHART } from "../../../../const/AnalysisLayout";
import { useContainerWidth } from "../../../../utils/d3/useContainerSize";
import { isMobileWidth, scaleFont, scaleLength } from "../../../../utils/d3/chartMargins";
import {
  describeRank,
  NORMAL_METRICS,
  rankOf,
  type MetricStrips,
  type MonthStrip,
  type NormalMetricKey,
} from "../../../../utils/weather/weatherNormals";
import { hideTooltip, placeTooltip } from "../chartTooltip";
import { renderTooltipHtml } from "../lineTooltip";
import { useSettingsStore } from "../../../../stores/useSettingsStore";

type UseDrawMonthlyStripsParams = {
  strips: MetricStrips[];
  selectedYear: number;
  theme: Theme;
};

/** 강수는 정수 mm, 기온은 소수 한 자리 */
export const formatNormalValue = (value: number, key: NormalMetricKey): string =>
  key === "rain" ? `${Math.round(value)}${NORMAL_METRICS[key].unit}` : `${value.toFixed(1)}${NORMAL_METRICS[key].unit}`;

/** 지표 색 — V1 날씨 토큰과 같은 짝 */
export const metricColor = (key: NormalMetricKey, theme: Theme): string => {
  const { weather } = theme.palette.chart;
  return key === "rain" ? weather.rain : key === "avgTa" ? weather.temperature : weather.ground;
};

/** 오른쪽 글 — 값 + 순위, 진행 중이면 마지막 관측일 */
const rankText = (month: MonthStrip, key: NormalMetricKey): { value: string; note: string } => {
  if (!month.selected) return { value: "—", note: "자료 없음" };
  const value = formatNormalValue(month.selected.value, key);
  if (month.selected.partialUntil) {
    const until = month.selected.partialUntil;
    return { value, note: `${Number(until.slice(5, 7))}/${Number(until.slice(8))}까지` };
  }
  return { value, note: month.rank ? describeRank(month.rank, key, false) : "" };
};

/** 줄 x 범위 — 역대 값과 선택 값 전체, 값이 하나뿐이면 앞뒤로 벌린다 */
const rowDomain = (month: MonthStrip): [number, number] => {
  const all = [...month.values.map((v) => v.value), ...(month.selected ? [month.selected.value] : [])];
  const [min, max] = d3.extent(all) as [number | undefined, number | undefined];
  if (min === undefined || max === undefined) return [0, 1];
  return min === max ? [min - 1, max + 1] : [min, max];
};

/** 월별 점 분포 — 지표마다 제목 + 달별 줄, 한 해 = 점 하나 */
const useDrawMonthlyStrips = ({ strips, selectedYear, theme }: UseDrawMonthlyStripsParams) => {
  /** 큰글씨 모드를 켜고 끄면 글자 크기가 달라져 다시 그려야 한다 */
  const displayMode = useSettingsStore((state) => state.displayMode);
  const { containerRef, width } = useContainerWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    function drawMonthlyStrips() {
      const svgEl = svgRef.current;
      const tooltipEl = tooltipRef.current;
      if (!svgEl || !tooltipEl || width === 0 || strips.length === 0) return;

      const { palette } = theme;
      const mobile = isMobileWidth(width);
      const fontSize = scaleFont(LINE_CHART.AXIS_FONT_SIZE);
      const rowHeight = scaleLength(NORMAL_STRIP_CHART.ROW_HEIGHT);
      const titleHeight = scaleLength(NORMAL_STRIP_CHART.GROUP_TITLE_HEIGHT);
      const monthsPerGroup = strips[0].months.length;
      const groupHeight = titleHeight + monthsPerGroup * rowHeight;
      const height = strips.length * groupHeight + (strips.length - 1) * NORMAL_STRIP_CHART.GROUP_GAP;
      const labelWidth = scaleLength(NORMAL_STRIP_CHART.MONTH_LABEL_WIDTH);
      const rankWidth = scaleLength(mobile ? NORMAL_STRIP_CHART.RANK_WIDTH.MOBILE : NORMAL_STRIP_CHART.RANK_WIDTH.DESKTOP);
      const stripLeft = labelWidth + NORMAL_STRIP_CHART.DOT_PAD;
      const stripRight = Math.max(stripLeft + 1, width - rankWidth - NORMAL_STRIP_CHART.DOT_PAD);

      const svg = d3.select(svgEl).attr("width", width).attr("height", height);
      svg.selectAll("*").remove();

      const drawRow = (g: d3.Selection<SVGGElement, unknown, null, undefined>, month: MonthStrip, key: NormalMetricKey) => {
        const color = metricColor(key, theme);
        const x = d3.scaleLinear().domain(rowDomain(month)).range([stripLeft, stripRight]);
        const cy = rowHeight / 2;

        g.append("text")
          .attr("x", 0)
          .attr("y", cy)
          .attr("dy", "0.32em")
          .attr("font-size", fontSize)
          .attr("fill", palette.text.secondary)
          .style("font-variant-numeric", "tabular-nums")
          .text(`${month.month}월`);

        g.append("line")
          .attr("x1", stripLeft - NORMAL_STRIP_CHART.DOT_PAD)
          .attr("x2", stripRight + NORMAL_STRIP_CHART.DOT_PAD)
          .attr("y1", cy)
          .attr("y2", cy)
          .attr("stroke", palette.surface.border);

        if (month.median !== null) {
          const half = NORMAL_STRIP_CHART.MEDIAN_TICK_HEIGHT / 2;
          g.append("line")
            .attr("x1", x(month.median))
            .attr("x2", x(month.median))
            .attr("y1", cy - half)
            .attr("y2", cy + half)
            .attr("stroke", palette.text.secondary)
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "round");
        }

        const others = month.values.filter((v) => v.year !== selectedYear);
        g.append("g")
          .selectAll("circle")
          .data(others)
          .join("circle")
          .attr("cx", (d) => x(d.value))
          .attr("cy", cy)
          .attr("r", NORMAL_STRIP_CHART.YEAR_DOT_RADIUS)
          .attr("fill", color)
          .attr("opacity", NORMAL_STRIP_CHART.YEAR_DOT_OPACITY);

        /** 선택 시즌 — 표면색 테로 역대 점 위에 떠 보이게. 진행 중인 달은 빈 점 */
        if (month.selected) {
          const partial = month.selected.partialUntil !== null;
          g.append("circle")
            .attr("cx", x(month.selected.value))
            .attr("cy", cy)
            .attr("r", NORMAL_STRIP_CHART.SELECTED_DOT_RADIUS)
            .attr("fill", partial ? palette.surface.raised : color)
            .attr("stroke", partial ? color : palette.surface.raised)
            .attr("stroke-width", NORMAL_STRIP_CHART.SELECTED_RING_WIDTH);
        }

        const { value, note } = rankText(month, key);
        const text = g
          .append("text")
          .attr("x", width)
          .attr("y", cy)
          .attr("dy", "0.32em")
          .attr("text-anchor", "end")
          .attr("font-size", fontSize)
          .style("font-variant-numeric", "tabular-nums");
        text.append("tspan").attr("font-weight", 700).attr("fill", palette.text.primary).text(value);
        if (note) text.append("tspan").attr("dx", 6).attr("fill", palette.text.secondary).text(note);

        /** 호버 — 점보다 넓은 줄 전체를 대상으로, 가장 가까운 해를 보여준다 */
        const points = [
          ...others,
          ...(month.selected ? [{ year: selectedYear, value: month.selected.value }] : []),
        ];
        const allValues = month.values.map((v) => v.value);
        g.append("rect")
          .attr("x", stripLeft - NORMAL_STRIP_CHART.DOT_PAD)
          .attr("width", stripRight - stripLeft + NORMAL_STRIP_CHART.DOT_PAD * 2)
          .attr("height", rowHeight)
          .attr("fill", "transparent")
          .on("pointermove", function showYear(event: PointerEvent) {
            const [px] = d3.pointer(event, this);
            const nearest = d3.least(points, (p) => Math.abs(x(p.value) - px));
            if (!nearest) return;
            const isPartial = nearest.year === selectedYear && month.selected?.partialUntil;
            const rank = isPartial ? null : rankOf(nearest.value, allValues);
            tooltipEl.innerHTML = renderTooltipHtml({
              title: `${nearest.year}년 ${month.month}월${isPartial ? ` (${rankText(month, key).note})` : ""}`,
              rows: [
                {
                  key,
                  label: NORMAL_METRICS[key].label,
                  color,
                  value: formatNormalValue(nearest.value, key),
                  detail: month.median === null ? "" : `역대 중앙값 ${formatNormalValue(month.median, key)}`,
                  lowSample: false,
                },
              ],
              normal: rank ? describeRank(rank, key) : null,
            });
            const [cx, cy2] = d3.pointer(event, containerRef.current);
            placeTooltip(tooltipEl, cx, cy2, containerRef.current?.clientWidth ?? width);
          })
          .on("pointerleave", function hideYear() {
            hideTooltip(tooltipEl);
          });
      };

      strips.forEach((strip, groupIndex) => {
        const top = groupIndex * (groupHeight + NORMAL_STRIP_CHART.GROUP_GAP);
        const group = svg.append("g").attr("transform", `translate(0,${top})`);
        group
          .append("text")
          .attr("x", 0)
          .attr("y", titleHeight / 2)
          .attr("dy", "0.32em")
          .attr("font-size", scaleFont(12))
          .attr("font-weight", 700)
          .attr("fill", palette.text.primary)
          .text(`월 ${NORMAL_METRICS[strip.key].label} (${NORMAL_METRICS[strip.key].unit})`);
        strip.months.forEach((month, rowIndex) => {
          const row = group.append("g").attr("transform", `translate(0,${titleHeight + rowIndex * rowHeight})`);
          drawRow(row, month, strip.key);
        });
      });
    },
    [strips, selectedYear, theme, width, containerRef, displayMode],
  );

  return { containerRef, svgRef, tooltipRef };
};

export default useDrawMonthlyStrips;
