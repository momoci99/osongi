import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";

/**
 * D3 차트용 공유 툴팁 생성/제거 유틸리티.
 * 동일한 selector로 중복 생성을 방지하고, cleanup 함수를 반환하여 unmount 시 DOM 누수를 방지한다.
 */

const TOOLTIP_SELECTOR = "d3-chart-tooltip";

export function createD3Tooltip(theme: Theme): d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown> {
  removeD3Tooltip();

  return d3
    .select("body")
    .append("div")
    .attr("class", TOOLTIP_SELECTOR)
    .style("position", "absolute")
    .style("background", theme.palette.background.paper)
    .style("border", `1px solid ${theme.palette.divider}`)
    .style("border-radius", "8px")
    .style("padding", "10px 14px")
    .style("font-size", "12px")
    .style("box-shadow", theme.shadows[4])
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("color", theme.palette.text.primary);
}

export function removeD3Tooltip() {
  d3.selectAll(`.${TOOLTIP_SELECTOR}`).remove();
}
