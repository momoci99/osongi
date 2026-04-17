import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import { GradeKeyToKorean } from "../../../const/Common";

export type PriceDatum = { gradeKey: string; unitPriceWon: number };

const BASE_MARGIN = { top: 16, right: 16, left: 48 } as const;

/**
 * bottom margin 을 라벨 길이에 따라 계산합니다.
 */
export const computeBottomMargin = (data: PriceDatum[]): number => {
  const labels = data.map(
    (d) =>
      (GradeKeyToKorean as Record<string, string>)[d.gradeKey] ?? d.gradeKey,
  );
  const longest = labels.reduce((a, b) => (b.length > a.length ? b : a), "");
  return Math.min(70, 28 + Math.floor(longest.length / 4) * 10);
};

/**
 * 차트 margin 객체를 반환합니다.
 */
export const getMargin = (data: PriceDatum[]) => ({
  ...BASE_MARGIN,
  bottom: computeBottomMargin(data),
});

/**
 * 가격 차트용 그라디언트를 SVG에 추가하고 id를 반환합니다.
 */
export const ensureGradient = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  theme: Theme,
): string => {
  const colorMain = theme.palette.chart.price.main;
  const colorLight = theme.palette.chart.price.light;
  const barColor = theme.palette.mode === "dark" ? colorLight : colorMain;

  const defsSel = svg.select("defs").empty()
    ? svg.append("defs")
    : svg.select("defs");

  const gradientId = `bar-gradient-price-${theme.palette.mode}`;
  defsSel.select(`#${gradientId}`).remove();

  const gradient = defsSel
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", barColor)
    .attr("stop-opacity", 0.9);

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", colorLight)
    .attr("stop-opacity", 0.7);

  return gradientId;
};
