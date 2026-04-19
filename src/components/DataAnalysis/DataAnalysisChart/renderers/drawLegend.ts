import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { GradeKeyToKorean } from "../../../../const/Common";
import type { LegendItem } from "../seriesBuilder";

export type DrawLegendParams = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  items: LegendItem[];
  legendTop: number;
  marginLeft: number;
  availableWidth: number;
  isMobile: boolean;
  fontSize: { legend: string };
  theme: Theme;
  onLegendClick?: (seriesKey: string) => void;
};

/** 범례를 차트 하단에 가로 배치합니다. 총 SVG 높이를 반환합니다. */
export const drawLegend = ({
  svg,
  items,
  legendTop,
  marginLeft,
  availableWidth,
  isMobile,
  fontSize,
  theme,
  onLegendClick,
}: DrawLegendParams): number => {
  const legend = svg
    .append("g")
    .attr("transform", `translate(${marginLeft}, ${legendTop})`);

  const itemSpacing = isMobile ? 10 : 14;
  const lineWidth = isMobile ? 15 : 20;
  const textOffset = lineWidth + 5;
  const rowHeight = isMobile ? 18 : 22;
  let cursorX = 0;
  let cursorY = 0;

  if (items.length > 20) {
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -8)
      .style("font-size", isMobile ? "9px" : "11px")
      .style("fill", theme.palette.text.secondary)
      .style("font-style", "italic")
      .text("💡 범례를 클릭하면 시리즈를 숨길 수 있습니다");
  }

  items.forEach((item) => {
    const label = `${item.region} ${
      (GradeKeyToKorean as Record<string, string>)[item.gradeKey] ||
      item.gradeKey
    }`;
    const estimatedWidth =
      textOffset + label.length * (isMobile ? 8 : 9) + itemSpacing;

    if (cursorX + estimatedWidth > availableWidth && cursorX > 0) {
      cursorX = 0;
      cursorY += rowHeight;
    }

    const seriesKey = `${item.region}-${item.gradeKey}`;

    const legendItem = legend
      .append("g")
      .attr("transform", `translate(${cursorX}, ${cursorY})`)
      .attr("data-legend-key", seriesKey)
      .style("cursor", "pointer");

    const hitAreaHeight = Math.max(rowHeight, 44);
    legendItem
      .append("rect")
      .attr("x", -4)
      .attr("y", -hitAreaHeight / 2)
      .attr("width", estimatedWidth)
      .attr("height", hitAreaHeight)
      .attr("fill", "transparent");

    legendItem
      .append("line")
      .attr("x1", 0)
      .attr("x2", lineWidth)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", item.color)
      .attr("stroke-width", isMobile ? 1.5 : 2)
      .attr("stroke-dasharray", item.dashPattern);

    legendItem
      .append("text")
      .attr("x", textOffset)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .style("font-size", fontSize.legend)
      .style("fill", theme.palette.text.secondary)
      .text(label);

    if (onLegendClick) {
      legendItem.on("click", () => onLegendClick(seriesKey));
    }

    cursorX += estimatedWidth;
  });

  const legendRows = Math.floor(cursorY / rowHeight) + 1;
  return legendTop + legendRows * rowHeight + 8;
};

export default drawLegend;
