import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { LINE_CHART } from "../../../../const/AnalysisLayout";
import { spreadLabels, ticksInDomain, type AxisTick } from "../../../../utils/analysisQuery/chartScale";
import { formatAxisTick } from "../../../../utils/analysisQuery/format";
import { scaleFont } from "../../../../utils/d3/chartMargins";
import type {
  ChartPoint,
  ChartSeries,
  LineChartModel,
} from "../../../../utils/analysisQuery/lineChartModel";
import type { AnalysisMetric } from "../../../../utils/analysisQuery/types";

type Group = d3.Selection<SVGGElement, unknown, null, undefined>;
export type SeriesGroup = d3.Selection<SVGGElement, unknown, null, undefined>;
type Scales = {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  innerWidth: number;
  innerHeight: number;
};

const { AXIS_FONT_SIZE, Y_TICK_COUNT, X_LABEL_OFFSET, Y_LABEL_OFFSET, DIRECT_LABEL_OFFSET } = LINE_CHART;

/**
 * 좁은 폭에서 x 눈금 라벨이 겹치지 않게 솎아낸다.
 * 시즌 라벨(major)을 먼저 자리 잡게 하고, 나머지는 빈자리에만 둔다.
 */
const dropCollidingTicks = (
  ticks: AxisTick[],
  x: d3.ScaleLinear<number, number>,
  minGap: number,
): AxisTick[] => {
  const kept: AxisTick[] = [];
  const rank = (tick: AxisTick) => (tick.major ? 2 : tick.fine ? 0 : 1);
  const byPriority = [...ticks].sort((a, b) => rank(b) - rank(a));
  for (const tick of byPriority) {
    const px = x(tick.position);
    if (kept.every((other) => Math.abs(x(other.position) - px) >= minGap)) kept.push(tick);
  }
  return kept;
};

/** 격자·눈금 — 데이터보다 한참 뒤로 물러나게 */
export const renderAxes = (
  g: Group,
  { x, y, innerWidth, innerHeight }: Scales,
  model: LineChartModel,
  metric: AnalysisMetric,
  theme: Theme,
) => {
  const yTicks = y.ticks(Y_TICK_COUNT);
  const yMax = y.domain()[1];
  const grid = g.append("g");

  grid
    .selectAll("line")
    .data(yTicks)
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", (tick) => y(tick))
    .attr("y2", (tick) => y(tick))
    .attr("stroke", theme.palette.surface.border)
    .attr("stroke-dasharray", (tick) => (tick === y.domain()[0] ? null : "2,4"));

  grid
    .selectAll("text")
    .data(yTicks)
    .join("text")
    .attr("x", -Y_LABEL_OFFSET)
    .attr("y", (tick) => y(tick))
    .attr("dy", "0.32em")
    .attr("text-anchor", "end")
    .attr("font-size", scaleFont(AXIS_FONT_SIZE))
    .attr("fill", theme.palette.text.secondary)
    .style("font-variant-numeric", "tabular-nums")
    .text((tick) => formatAxisTick(metric, tick, yMax));

  g.append("g")
    .selectAll("line")
    .data(model.mapping.boundaries)
    .join("line")
    .attr("x1", (position) => x(position))
    .attr("x2", (position) => x(position))
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", theme.palette.surface.borderStrong)
    .attr("stroke-dasharray", "3,3");

  const [domainStart, domainEnd] = x.domain();
  const seasonCount = model.mapping.boundaries.length + 1;
  const segmentWidth = innerWidth / seasonCount;
  const candidates = ticksInDomain(model.mapping.ticks(segmentWidth), [domainStart, domainEnd]);
  const visibleTicks = dropCollidingTicks(candidates, x, LINE_CHART.MIN_TICK_GAP);

  g.append("g")
    .selectAll("text")
    .data(visibleTicks)
    .join("text")
    .attr("x", (tick) => x(tick.position))
    .attr("y", innerHeight + X_LABEL_OFFSET)
    .attr("text-anchor", "middle")
    .attr("font-size", scaleFont(AXIS_FONT_SIZE))
    .attr("font-weight", (tick) => (tick.major ? 700 : 400))
    .attr("fill", (tick) => (tick.major ? theme.palette.text.primary : theme.palette.text.secondary))
    .style("font-variant-numeric", "tabular-nums")
    .text((tick) => tick.label);
};

/** 평년 밴드 — 채움 영역 + 점선 중앙값 */
export const renderBand = (g: Group, { x, y }: Scales, model: LineChartModel, theme: Theme) => {
  if (!model.band || model.band.length === 0) return;
  const color = theme.palette.text.secondary;

  g.append("path")
    .datum(model.band)
    .attr("fill", color)
    .attr("fill-opacity", LINE_CHART.BAND_OPACITY)
    .attr(
      "d",
      d3
        .area<(typeof model.band)[number]>()
        .x((point) => x(point.position))
        .y0((point) => y(point.lower))
        .y1((point) => y(point.upper))
        .curve(d3.curveMonotoneX),
    );

  g.append("path")
    .datum(model.band)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", LINE_CHART.STROKE_CONTEXT)
    .attr("stroke-dasharray", "4,3")
    .attr(
      "d",
      d3
        .line<(typeof model.band)[number]>()
        .x((point) => x(point.position))
        .y((point) => y(point.median))
        .curve(d3.curveMonotoneX),
    );
};

/** 역할별 선 두께 */
const strokeWidthOf = (series: ChartSeries): number =>
  series.role === "focus"
    ? LINE_CHART.STROKE_EMPHASIS
    : series.role === "context" || series.role === "comparison"
      ? LINE_CHART.STROKE_CONTEXT
      : LINE_CHART.STROKE;

/** 그리는 순서 — 문맥·전년 시리즈가 아래, 강조 시리즈가 위 */
const ROLE_ORDER = { comparison: 0, context: 0, entity: 1, focus: 2 } as const;

/**
 * 시리즈 선·마커.
 * 없는 추이를 만들지 않도록 선형 보간만 쓰고, 긴 공백은 모델에서 이미 끊겨 있다.
 */
export const renderSeries = (
  g: Group,
  { x, y }: Scales,
  model: LineChartModel,
  colorOf: (series: ChartSeries) => string,
  theme: Theme,
): Map<string, SeriesGroup> => {
  const groups = new Map<string, SeriesGroup>();
  const ordered = [...model.series].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
  const line = d3
    .line<ChartPoint>()
    .x((point) => x(point.position))
    .y((point) => y(point.value));

  for (const series of ordered) {
    const color = colorOf(series);
    const group = g.append("g").attr("opacity", series.opacity);
    groups.set(series.key, group);

    group
      .selectAll("path")
      .data(series.segments.filter((segment) => segment.length > 1))
      .join("path")
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", strokeWidthOf(series))
      .attr("stroke-dasharray", series.role === "comparison" ? "5,4" : null)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);

    /** 문맥 시리즈에 마커까지 찍으면 강조 시리즈보다 시끄러워진다 */
    const showAllMarkers =
      series.role !== "context" &&
      series.role !== "comparison" &&
      series.points.length <= LINE_CHART.MARKER_MAX_POINTS;
    const markerPoints = showAllMarkers
      ? series.points
      : series.segments.filter((segment) => segment.length === 1).flat();

    group
      .selectAll("circle")
      .data(markerPoints)
      .join("circle")
      .attr("cx", (point) => x(point.position))
      .attr("cy", (point) => y(point.value))
      .attr("r", LINE_CHART.MARKER_RADIUS)
      .attr("fill", color)
      .attr("fill-opacity", (point) => (point.lowSample ? LINE_CHART.LOW_SAMPLE_OPACITY : 1))
      .attr("stroke", theme.palette.surface.raised)
      .attr("stroke-width", 1.5);
  }
  return groups;
};

/**
 * 호버한 문맥 시리즈를 선명하게 올린다.
 * 지난 시즌 선은 모두 같은 회색이라, 짚은 선이 몇 년인지 선 자체로 알려준다.
 */
export const highlightSeries = (
  groups: Map<string, SeriesGroup>,
  model: LineChartModel,
  activeKey: string | null,
) => {
  for (const series of model.series) {
    if (series.role !== "context") continue;
    const group = groups.get(series.key);
    if (!group) continue;
    const active = series.key === activeKey;
    group.attr("opacity", active ? 1 : series.opacity);
  }
};

/** 선 끝 직접 라벨 — 시리즈가 적을 때만 */
export const renderDirectLabels = (
  g: Group,
  { x, y, innerHeight }: Scales,
  model: LineChartModel,
  theme: Theme,
) => {
  const labeled = model.series.filter((series) => series.points.length > 0);
  if (labeled.length < 2 || labeled.length > LINE_CHART.DIRECT_LABEL_MAX_SERIES) return;

  const ends = labeled.map((series) => series.points[series.points.length - 1]);
  /** 값이 0인 선(시즌 초 누계 등)의 라벨이 x축 눈금 줄로 내려가지 않게 플롯 안에 둔다 */
  const ys = spreadLabels(
    ends.map((point) => y(point.value)),
    LINE_CHART.DIRECT_LABEL_MIN_GAP,
    innerHeight - AXIS_FONT_SIZE / 2,
  );

  g.append("g")
    .selectAll("text")
    .data(labeled)
    .join("text")
    .attr("x", (_, index) => x(ends[index].position) + DIRECT_LABEL_OFFSET)
    .attr("y", (_, index) => ys[index])
    .attr("dy", "0.32em")
    .attr("font-size", scaleFont(AXIS_FONT_SIZE))
    .attr("font-weight", (series) => (series.role === "focus" ? 700 : 500))
    .attr("fill", (series) =>
      series.role === "context" || series.role === "comparison"
        ? theme.palette.text.secondary
        : theme.palette.text.primary,
    )
    .attr("stroke", theme.palette.surface.raised)
    .attr("stroke-width", LINE_CHART.LABEL_HALO_WIDTH)
    .attr("stroke-linejoin", "round")
    .style("paint-order", "stroke")
    .style("font-variant-numeric", "tabular-nums")
    .text((series) => series.label);
};
