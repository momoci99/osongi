import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";

/** 데이터 없을 때 메시지 표시 */
export const drawEmptyMessage = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number,
  messageFontSize: string,
  theme: Theme,
) => {
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .style("fill", theme.palette.text.secondary)
    .style("font-size", messageFontSize)
    .text("송이버섯 시즌(8월~12월) 데이터가 없습니다");
};

export default drawEmptyMessage;
