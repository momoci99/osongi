import type * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { YEARLY_TREND_CHART } from "../../../const/Charts";
import { LARGE_FIRE_MIN_HA } from "../../../const/Wildfire";
import {
  describeFireDamage,
  formatFireMonth,
  type FireEvent,
} from "../../../utils/wildfire/unionFires";

type DrawFireMarkersParams = {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  x: d3.ScaleBand<number>;
  innerHeight: number;
  events: FireEvent[];
  theme: Theme;
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
};

const { FIRE_MARKER } = YEARLY_TREND_CHART;

/** 축 범위 안 시즌별로 산불을 묶는다 */
export const groupBySeason = (events: FireEvent[], years: number[]): Map<number, FireEvent[]> => {
  const inRange = new Set(years);
  const bySeason = new Map<number, FireEvent[]>();
  for (const event of events) {
    if (!inRange.has(event.seasonYear)) continue;
    bySeason.set(event.seasonYear, [...(bySeason.get(event.seasonYear) ?? []), event]);
  }
  return bySeason;
};

/** 피해가 10배 커질 때마다 한 단계씩 커지는 머리 점 — 100ha 와 10만ha 가 같아 보이지 않게 */
export const markerRadius = (damageHa: number): number => {
  const decades = Math.log10(Math.max(damageHa, LARGE_FIRE_MIN_HA) / LARGE_FIRE_MIN_HA);
  return Math.min(FIRE_MARKER.RADIUS_MAX, FIRE_MARKER.RADIUS_MIN + decades * FIRE_MARKER.RADIUS_PER_DECADE);
};

const tooltipHtml = (events: FireEvent[]) =>
  events
    .map((event) => `<strong>${formatFireMonth(event.startDate)} ${event.label}</strong><br/>${describeFireDamage(event)}`)
    .join("<br/>");

/**
 * 불난 뒤 첫 시즌 막대의 왼쪽 경계에 세로 점선과 머리 점을 그린다.
 * "이 선 오른쪽부터가 산불 이후"로 읽히게 막대 가운데가 아닌 경계에 둔다.
 */
const drawFireMarkers = ({ root, x, innerHeight, events, theme, tooltip }: DrawFireMarkersParams) => {
  const bySeason = groupBySeason(events, x.domain());
  if (bySeason.size === 0) return;

  const gap = (x.step() - x.bandwidth()) / 2;
  const markers = [...bySeason.entries()].map(([year, seasonEvents]) => ({
    cx: (x(year) ?? 0) - gap,
    events: seasonEvents,
    radius: markerRadius(Math.max(...seasonEvents.map((event) => event.totalHa))),
  }));
  const headY = -FIRE_MARKER.TOP_SPACE / 2;

  const group = root
    .append("g")
    .attr("class", "fire-markers")
    .selectAll("g")
    .data(markers)
    .join("g")
    .attr("transform", (marker) => `translate(${marker.cx},0)`);

  group
    .append("line")
    .attr("y1", headY)
    .attr("y2", innerHeight)
    .attr("stroke", theme.palette.chart.fire)
    .attr("stroke-width", FIRE_MARKER.LINE_WIDTH)
    .attr("stroke-dasharray", FIRE_MARKER.DASH);

  group
    .append("circle")
    .attr("cy", headY)
    .attr("r", (marker) => marker.radius)
    .attr("fill", theme.palette.chart.fire);

  group
    .append("rect")
    .attr("x", -FIRE_MARKER.HIT_WIDTH / 2)
    .attr("y", headY - FIRE_MARKER.RADIUS_MAX)
    .attr("width", FIRE_MARKER.HIT_WIDTH)
    .attr("height", innerHeight - headY + FIRE_MARKER.RADIUS_MAX)
    .attr("fill", "transparent")
    .style("cursor", "default")
    .on("mousemove", (event: MouseEvent, marker) => {
      tooltip
        .style("opacity", "1")
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 12}px`)
        .html(tooltipHtml(marker.events));
    })
    .on("mouseleave", () => tooltip.style("opacity", "0"));
};

export default drawFireMarkers;
