import { addDays } from "../../../utils/analysisQuery/rows";
import { formatAxisValue, formatMetricText, formatMetricValue } from "../../../utils/analysisQuery/format";
import type { ChartBandPoint, ChartPoint, ChartSeries } from "../../../utils/analysisQuery/lineChartModel";
import type { AnalysisAxis, AnalysisQuery } from "../../../utils/analysisQuery/types";

/** 툴팁 한 줄 */
export type TooltipRow = {
  key: string;
  label: string;
  color: string;
  value: string;
  /** 시즌 일차 축에서 실제 날짜 등 보조 정보 */
  detail: string;
  lowSample: boolean;
  /** 색 표본 불투명도 — 차트의 선과 같은 진하기로 */
  opacity?: number;
  /** 차트에서 강조 중인 시리즈 */
  active?: boolean;
};

/** 툴팁 내용 */
export type TooltipContent = {
  title: string;
  rows: TooltipRow[];
  normal: string | null;
};

type BuildTooltipParams = {
  axis: AnalysisAxis;
  query: AnalysisQuery;
  hits: { series: ChartSeries; point: ChartPoint; color: string }[];
  band: ChartBandPoint | undefined;
  seasonStarts: Record<number, string>;
  /** 강조 중인 시리즈 키 */
  activeKey?: string | null;
};

/** 시즌 일차 → 실제 날짜 (M/D) */
const seasonDayDate = (point: ChartPoint, seasonStarts: Record<number, string>): string => {
  const start = seasonStarts[point.year];
  if (!start) return "";
  const [, month, day] = addDays(start, Number(point.x) - 1)
    .split("-")
    .map(Number);
  return `${month}/${day}`;
};

/** 평년 한 줄 — 범위 값은 단위를 한 번만 붙인다 */
const describeBand = (query: AnalysisQuery, band: ChartBandPoint): string => {
  const lower = formatMetricValue(query.metric, band.lower);
  const upper = formatMetricValue(query.metric, band.upper);
  return `평년 ${formatMetricText(query.metric, band.median)} · 범위 ${lower.value}–${upper.value}${upper.unit} · ${band.seasons}시즌`;
};

/** 호버 위치의 툴팁 내용 — 값 큰 순 정렬 */
export const buildTooltipContent = ({
  axis,
  query,
  hits,
  band,
  seasonStarts,
  activeKey = null,
}: BuildTooltipParams): TooltipContent | null => {
  const sample = hits[0]?.point ?? band;
  if (!sample) return null;

  const rows = [...hits]
    .sort((a, b) => b.point.value - a.point.value)
    .map(({ series, point, color }) => ({
      key: series.key,
      label: series.label,
      color,
      value: formatMetricText(query.metric, point.value),
      detail: [axis === "seasonDay" ? seasonDayDate(point, seasonStarts) : "", `${point.records}건`]
        .filter(Boolean)
        .join(" · "),
      lowSample: point.lowSample,
      opacity: series.opacity,
      active: series.key === activeKey,
    }));

  return {
    title: formatAxisValue(axis, sample.x, query.granularity),
    rows,
    normal: band ? describeBand(query, band) : null,
  };
};

/** HTML 특수문자 이스케이프 */
const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** 툴팁 HTML — D3 호버 루프에서 리렌더 없이 갱신하기 위해 문자열로 만든다 */
export const renderTooltipHtml = (content: TooltipContent): string => {
  const rows = content.rows
    .map(
      (row) => `
      <div class="tt-row${row.lowSample ? " tt-low" : ""}${row.active ? " tt-active" : ""}">
        <span class="tt-swatch" style="background:${row.color};opacity:${row.opacity ?? 1}"></span>
        <span class="tt-label">${escapeHtml(row.label)}</span>
        <span class="tt-value">${escapeHtml(row.value)}</span>
        <span class="tt-detail">${escapeHtml(row.detail)}</span>
      </div>`,
    )
    .join("");
  const normal = content.normal ? `<div class="tt-normal">${escapeHtml(content.normal)}</div>` : "";
  return `<div class="tt-title">${escapeHtml(content.title)}</div>${rows}${normal}`;
};
