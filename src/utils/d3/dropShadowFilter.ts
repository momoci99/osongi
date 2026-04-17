import type { Selection } from "d3";

export type SvgSelection = Selection<SVGSVGElement, unknown, null, undefined>;

/**
 * SVG에 공통 drop shadow 필터를 추가하고 필터 id를 반환합니다.
 */
export const addDropShadowFilter = (
  svg: SvgSelection,
  isDark: boolean,
  id = "drop-shadow"
): string => {
  const defs = svg.select<SVGDefsElement>("defs").empty()
    ? svg.append("defs")
    : svg.select<SVGDefsElement>("defs");

  const filter = defs
    .selectAll<SVGFilterElement, string>(`filter#${id}`)
    .data([id])
    .join("filter")
    .attr("id", id)
    .attr("x", "-20%")
    .attr("y", "-20%")
    .attr("width", "140%")
    .attr("height", "140%");

  filter.selectAll("*").remove();

  filter
    .append("feDropShadow")
    .attr("dx", 1)
    .attr("dy", 1)
    .attr("stdDeviation", 1)
    .attr("flood-color", isDark ? "#000" : "#666")
    .attr("flood-opacity", 0.3);

  return id;
};
