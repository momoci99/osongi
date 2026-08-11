import * as d3 from "d3";
import { REGION_SPARKLINE } from "../../const/RegionLayout";

export type SparkPaths = {
  line: string;
  area: string;
  lastX: number;
  lastY: number;
};

/**
 * 스파크라인의 선·면 경로를 만든다.
 * 축도 눈금도 없는 크기이므로 값의 절대치가 아니라 "오르내린 모양"만 전한다.
 */
export const buildSparkPaths = (points: number[]): SparkPaths | null => {
  if (points.length < REGION_SPARKLINE.MIN_POINTS) return null;

  const { WIDTH, HEIGHT, PADDING_Y } = REGION_SPARKLINE;
  const x = d3
    .scaleLinear()
    .domain([0, points.length - 1])
    .range([0, WIDTH]);
  /** 값이 모두 같으면 도메인이 0이 되어 좌표가 NaN 이 된다 */
  const [min, max] = d3.extent(points) as [number, number];
  const y = d3
    .scaleLinear()
    .domain(min === max ? [min - 1, max + 1] : [min, max])
    .range([HEIGHT - PADDING_Y, PADDING_Y]);

  const line = d3
    .line<number>()
    .x((_, index) => x(index))
    .y((value) => y(value))
    .curve(d3.curveMonotoneX);
  const area = d3
    .area<number>()
    .x((_, index) => x(index))
    .y0(HEIGHT)
    .y1((value) => y(value))
    .curve(d3.curveMonotoneX);

  return {
    line: line(points) ?? "",
    area: area(points) ?? "",
    lastX: x(points.length - 1),
    lastY: y(points[points.length - 1]),
  };
};
