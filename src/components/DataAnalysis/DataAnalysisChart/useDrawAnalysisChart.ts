import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import type { WeeklyPriceDatum } from "../../../types/data";
import type { MovingAverageDatum } from "../../../utils/analysis/statistics";
import {
  CHART_LAYOUT,
  CHART_MARGINS,
  FONT_SIZES,
} from "../../../const/Numbers";
import { removeD3Tooltip } from "../../../utils/d3Tooltip";
import {
  filterMushroomSeason,
  groupByYear,
  getYAccessor,
} from "./seriesBuilder";
import type { ChartMode, ChartLayout } from "./seriesBuilder";
import { drawEmptyMessage } from "./renderers/drawEmptyMessage";
import { drawOverlayMode } from "./renderers/drawOverlayMode";
import { drawSubplotMode } from "./renderers/drawSubplotMode";

/**
 * 송이버섯 공판 데이터 시각화 차트
 *
 * ⚠️ 중요: 이 차트는 반드시 연도별 서브플롯(Year-based Subplots) 구조를 유지해야 함
 *
 * 핵심 아키텍처:
 * 1. 각 연도마다 독립적인 서브플롯 생성 (별도의 X축 스케일)
 * 2. 모든 서브플롯이 동일한 Y축 스케일 공유
 * 3. 송이버섯 시즌(8-12월) 데이터만 표시
 * 4. 등급별 색상 + 지역별 시리즈 구분
 */

type UseDrawAnalysisChartParams = {
  data: WeeklyPriceDatum[];
  height: number;
  theme: Theme;
  containerWidth: number;
  containerHeight: number;
  mode: ChartMode;
  maData: MovingAverageDatum[];
  showMA: boolean;
  showMarkers: boolean;
  layout: ChartLayout;
};

export const useDrawAnalysisChart = ({
  data,
  height,
  theme,
  containerWidth,
  containerHeight,
  mode,
  maData,
  showMA,
  showMarkers,
  layout,
}: UseDrawAnalysisChartParams) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const hiddenSeriesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return;

    const chartHeight = Math.max(
      containerHeight || height,
      CHART_LAYOUT.MIN_HEIGHT,
    );

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", containerWidth).attr("height", chartHeight);

    const isMobile = containerWidth < CHART_LAYOUT.MOBILE_BREAKPOINT;
    const margin = {
      top: CHART_MARGINS.TOP,
      right: isMobile ? CHART_MARGINS.MOBILE.RIGHT : CHART_MARGINS.DESKTOP.RIGHT,
      bottom: CHART_MARGINS.BOTTOM,
      left: isMobile ? CHART_MARGINS.MOBILE.LEFT : CHART_MARGINS.DESKTOP.LEFT,
    };
    const fontSize = {
      title: isMobile ? FONT_SIZES.MOBILE.TITLE : FONT_SIZES.DESKTOP.TITLE,
      axis: isMobile ? FONT_SIZES.MOBILE.AXIS : FONT_SIZES.DESKTOP.AXIS,
      legend: isMobile ? FONT_SIZES.MOBILE.LEGEND : FONT_SIZES.DESKTOP.LEGEND,
      message: isMobile ? FONT_SIZES.MOBILE.MESSAGE : FONT_SIZES.DESKTOP.MESSAGE,
    };

    const seasonData = filterMushroomSeason(data);
    if (seasonData.length === 0) {
      drawEmptyMessage(svg, containerWidth, chartHeight, fontSize.message, theme);
      return;
    }

    const yValue = getYAccessor(mode);
    const yearGroups = groupByYear(seasonData);
    const years = Array.from(yearGroups.keys()).sort();

    const toggleSeries = (seriesKey: string) => {
      const svgEl = d3.select(svgRef.current);
      const hidden = hiddenSeriesRef.current;
      if (hidden.has(seriesKey)) {
        hidden.delete(seriesKey);
        svgEl.selectAll(`[data-series-key="${seriesKey}"]`).attr("opacity", null);
        svgEl.selectAll(`[data-legend-key="${seriesKey}"]`).attr("opacity", null);
      } else {
        hidden.add(seriesKey);
        svgEl.selectAll(`[data-series-key="${seriesKey}"]`).attr("opacity", 0.08);
        svgEl.selectAll(`[data-legend-key="${seriesKey}"]`).attr("opacity", 0.3);
      }
    };

    const totalHeight =
      layout === "overlay"
        ? drawOverlayMode({
            svg,
            containerWidth,
            chartHeight,
            margin,
            fontSize,
            years,
            yearGroups,
            seasonData,
            yValue,
            mode,
            isMobile,
            theme,
            hiddenSeriesRef,
            onToggleSeries: toggleSeries,
          })
        : drawSubplotMode({
            svg,
            containerWidth,
            chartHeight,
            margin,
            fontSize,
            years,
            yearGroups,
            seasonData,
            yValue,
            mode,
            maData,
            showMA,
            showMarkers,
            isMobile,
            theme,
            hiddenSeriesRef,
            onToggleSeries: toggleSeries,
          });

    /** 다크모드 전환 등 재그리기 후 숨김 상태 복원 */
    hiddenSeriesRef.current.forEach((seriesKey) => {
      svg.selectAll(`[data-series-key="${seriesKey}"]`).attr("opacity", 0.08);
      svg.selectAll(`[data-legend-key="${seriesKey}"]`).attr("opacity", 0.3);
    });

    svg.attr("height", totalHeight);

    return () => removeD3Tooltip();
  }, [
    data,
    height,
    mode,
    theme,
    containerWidth,
    containerHeight,
    maData,
    showMA,
    showMarkers,
    layout,
  ]);

  return { svgRef, hiddenSeriesRef };
};

export default useDrawAnalysisChart;
