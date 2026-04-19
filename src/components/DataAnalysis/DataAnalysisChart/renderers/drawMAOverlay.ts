import * as d3 from "d3";
import type { MovingAverageDatum } from "../../../../utils/analysis/statistics";
import type { AnalysisSeries } from "../seriesBuilder";

export type DrawMAOverlayParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  series: AnalysisSeries;
  xScale: d3.ScaleTime<number, number>;
  globalYScale: d3.ScaleLinear<number, number>;
  yearMAData: MovingAverageDatum[];
  isMobile: boolean;
};

/** 시리즈에 해당하는 이동평균선을 오버레이합니다. */
export const drawMAOverlay = ({
  subplotGroup,
  series,
  xScale,
  globalYScale,
  yearMAData,
  isMobile,
}: DrawMAOverlayParams) => {
  const seriesKey = `${series.region}-${series.gradeKey}`;
  const groupMAData = yearMAData
    .filter((d) => d.gradeKey === series.gradeKey && d.region === series.region)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (groupMAData.length === 0) return;

  const drawMALine = (
    getValue: (d: MovingAverageDatum) => number | null,
    dashArray: string,
  ) => {
    const line = d3
      .line<MovingAverageDatum>()
      .defined((d) => getValue(d) !== null)
      .x((d) => xScale(new Date(d.date)))
      .y((d) => globalYScale(getValue(d)!))
      .curve(d3.curveMonotoneX);

    subplotGroup
      .append("path")
      .datum(groupMAData)
      .attr("data-series-key", seriesKey)
      .attr("fill", "none")
      .attr("stroke", series.color)
      .attr("stroke-width", isMobile ? 1 : 1.5)
      .attr("stroke-opacity", 0.55)
      .attr("stroke-dasharray", dashArray)
      .attr("d", line);
  };

  drawMALine((d) => d.ma7, "4,3");
  drawMALine((d) => d.ma14, "8,4");
};

export default drawMAOverlay;
