import { type RefObject } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { GradeKeyToKorean } from "../../../../const/Common";
import type { WeeklyPriceDatum } from "../../../../types/data";
import { createD3Tooltip, removeD3Tooltip } from "../../../../utils/d3Tooltip";
import type { AnalysisSeries } from "../seriesBuilder";

export type DrawSubplotCrosshairParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  yearData: WeeklyPriceDatum[];
  seriesList: AnalysisSeries[];
  xScale: d3.ScaleTime<number, number>;
  yValue: (d: WeeklyPriceDatum) => number;
  subplotWidth: number;
  subplotHeight: number;
  isMobile: boolean;
  theme: Theme;
  hiddenSeriesRef: RefObject<Set<string>>;
};

/** bisect 결과에서 가장 가까운 날짜를 반환합니다. */
const getNearestDate = (
  dates: Date[],
  index: number,
  target: Date,
): Date | null => {
  if (dates.length === 0) return null;
  const d0 = dates[index - 1];
  const d1 = dates[index];
  if (!d0) return d1;
  if (!d1) return d0;
  return target.getTime() - d0.getTime() > d1.getTime() - target.getTime()
    ? d1
    : d0;
};

/** 한국어 날짜 포맷 */
const formatDateKorean = (date: Date): string =>
  `${date.getFullYear()}년 ${(date.getMonth() + 1).toString().padStart(2, "0")}월 ${date.getDate().toString().padStart(2, "0")}일`;

/** 서브플롯에 crosshair 인터랙션을 추가합니다. */
export const drawSubplotCrosshair = ({
  subplotGroup,
  yearData,
  seriesList,
  xScale,
  yValue,
  subplotWidth,
  subplotHeight,
  isMobile,
  theme,
  hiddenSeriesRef,
}: DrawSubplotCrosshairParams) => {
  const crosshairLine = subplotGroup
    .append("line")
    .attr("class", "crosshair-line")
    .attr("y1", 0)
    .attr("y2", subplotHeight)
    .attr("stroke", theme.palette.text.secondary)
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3")
    .attr("opacity", 0)
    .style("pointer-events", "none");

  const uniqueDates = [...new Set(yearData.map((d) => d.date))]
    .sort()
    .map((s) => new Date(s));

  const bisect = d3.bisector<Date, Date>((d) => d).left;

  /** 날짜별 lookup Map (O(1) 조회용) */
  const dateMap = new Map<string, Map<string, WeeklyPriceDatum>>();
  seriesList.forEach((series) => {
    const key = `${series.region}-${series.gradeKey}`;
    series.data.forEach((d) => {
      const dateKey = new Date(d.date).toDateString();
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
      dateMap.get(dateKey)!.set(key, d);
    });
  });

  const handleMove = (event: MouseEvent | TouchEvent) => {
    const [mouseX] = d3.pointer(event, subplotGroup.node()!);
    const hoveredDate = xScale.invert(mouseX);
    const index = bisect(uniqueDates, hoveredDate);
    const nearestDate = getNearestDate(uniqueDates, index, hoveredDate);
    if (!nearestDate) return;

    const xPos = xScale(nearestDate);
    crosshairLine.attr("x1", xPos).attr("x2", xPos).attr("opacity", 0.6);

    const dateKey = nearestDate.toDateString();
    const datumMap = dateMap.get(dateKey);
    if (!datumMap) return;

    const hidden = hiddenSeriesRef.current;
    const entries: Array<{
      region: string;
      gradeKey: string;
      color: string;
      value: number;
    }> = [];

    seriesList.forEach((series) => {
      const seriesKey = `${series.region}-${series.gradeKey}`;
      if (hidden.has(seriesKey)) return;
      const point = datumMap.get(seriesKey);
      if (!point) return;
      entries.push({
        region: series.region,
        gradeKey: series.gradeKey,
        color: series.color,
        value: yValue(point),
      });
    });

    if (entries.length === 0) {
      removeD3Tooltip();
      return;
    }

    const tooltip = createD3Tooltip(theme);
    const header = `<div style="font-weight:bold;margin-bottom:4px">${formatDateKorean(nearestDate)}</div>`;
    const maxRows = isMobile ? 8 : 15;
    const displayEntries = entries.slice(0, maxRows);
    const rows = displayEntries
      .map((e) => {
        const grade =
          (GradeKeyToKorean as Record<string, string>)[e.gradeKey] ||
          e.gradeKey;
        return `<div style="display:flex;align-items:center;gap:6px">
          <span style="width:8px;height:8px;border-radius:50%;background:${e.color};display:inline-block"></span>
          <span>${e.region} ${grade}</span>
          <span style="margin-left:auto;font-weight:600">${e.value.toLocaleString()}</span>
        </div>`;
      })
      .join("");
    const truncation =
      entries.length > maxRows
        ? `<div style="color:gray">... 외 ${entries.length - maxRows}개</div>`
        : "";

    tooltip.html(header + rows + truncation);

    const [bodyX, bodyY] = d3.pointer(event, document.body);
    const tooltipWidth = 220;
    const flipX = bodyX + tooltipWidth > window.innerWidth - 20;
    tooltip
      .style("left", (flipX ? bodyX - tooltipWidth - 10 : bodyX + 15) + "px")
      .style("top", Math.max(10, bodyY - 10) + "px")
      .style("max-height", isMobile ? "200px" : "400px")
      .style("overflow-y", "auto")
      .style("min-width", "180px");
  };

  const overlay = subplotGroup
    .append("rect")
    .attr("class", "crosshair-overlay")
    .attr("width", subplotWidth)
    .attr("height", subplotHeight)
    .attr("fill", "transparent")
    .style("cursor", "crosshair");

  overlay
    .on("mousemove", handleMove)
    .on("touchmove", (event: TouchEvent) => {
      event.preventDefault();
      handleMove(event);
    })
    .on("mouseleave", () => {
      crosshairLine.attr("opacity", 0);
      removeD3Tooltip();
    })
    .on("touchend", () => {
      crosshairLine.attr("opacity", 0);
      removeD3Tooltip();
    });
};

export default drawSubplotCrosshair;
