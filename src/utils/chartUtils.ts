import * as d3 from "d3";
import type { Theme } from "@mui/material/styles";
import type { WeeklyPriceDatum } from "../types/data";
import {
  GRADE_DASH_PATTERNS,
  GRADE_COLOR_INDICES,
  CHART_LAYOUT,
  CHART_MARGINS,
  FONT_SIZES,
  TICK_INTERVALS,
  MUSHROOM_SEASON,
  DATE_CONSTANTS
} from "../const/Numbers";
import { REGION_BASE_HUES } from "../const/Common";

// 등급별 대시 패턴 정의
export const getGradeDashPattern = (gradeKey: string): string => {
  return GRADE_DASH_PATTERNS[gradeKey as keyof typeof GRADE_DASH_PATTERNS] || GRADE_DASH_PATTERNS.grade1;
};

// 등급별 색상 매핑
export const getGradeColor = (gradeKey: string, colorPalette: readonly string[]): string => {
  const colorIndex = GRADE_COLOR_INDICES[gradeKey as keyof typeof GRADE_COLOR_INDICES] || GRADE_COLOR_INDICES.grade1;
  return colorPalette[colorIndex % colorPalette.length];
};

// 테마에서 등급 색상 Record 추출 (D3 차트 공통)
export const getGradeColorMap = (theme: Theme): Record<string, string> => {
  const chart = theme.palette.chart;
  return {
    grade1: chart.grade1,
    grade2: chart.grade2,
    grade3Stopped: chart.grade3Stopped,
    grade3Estimated: chart.grade3Estimated,
    gradeBelow: chart.gradeBelow,
    mixedGrade: chart.mixedGrade,
  };
};

// 테마에서 등급 색상 배열 추출 (D3 scaleOrdinal.range용)
export const getGradeColorArray = (theme: Theme): string[] => {
  const chart = theme.palette.chart;
  return [
    chart.grade1,
    chart.grade2,
    chart.grade3Stopped,
    chart.grade3Estimated,
    chart.gradeBelow,
    chart.mixedGrade,
  ];
};

// 송이버섯 시즌 데이터 필터링
export const filterMushroomSeasonData = (data: WeeklyPriceDatum[]): WeeklyPriceDatum[] => {
  return data.filter((d) => {
    const date = new Date(d.date);
    const month = date.getMonth() + DATE_CONSTANTS.MONTH_OFFSET;
    return month >= MUSHROOM_SEASON.START_MONTH && month <= MUSHROOM_SEASON.END_MONTH;
  });
};

// 연도별 데이터 그룹화
export const groupDataByYear = (data: WeeklyPriceDatum[]): Map<number, WeeklyPriceDatum[]> => {
  const yearGroups = new Map<number, WeeklyPriceDatum[]>();
  data.forEach((d) => {
    const year = new Date(d.date).getFullYear();
    if (!yearGroups.has(year)) {
      yearGroups.set(year, []);
    }
    yearGroups.get(year)!.push(d);
  });
  return yearGroups;
};

// 데이터 시리즈 생성 (지역-등급별)
export const createDataSeries = (
  data: WeeklyPriceDatum[], 
  colorPalette: readonly string[]
): Array<{
  key: string;
  region: string;
  gradeKey: string;
  color: string;
  data: WeeklyPriceDatum[];
}> => {
  const seriesMap = new Map<string, WeeklyPriceDatum[]>();

  data.forEach((d) => {
    const key = `${d.region}-${d.gradeKey}`;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, []);
    }
    seriesMap.get(key)!.push(d);
  });

  return Array.from(seriesMap.entries()).map(([key, seriesData]) => {
    const [region, gradeKey] = key.split("-");
    return {
      key,
      region: region || "",
      gradeKey: gradeKey || "",
      color: getGradeColor(gradeKey || "", colorPalette),
      data: seriesData,
    };
  });
};

// 반응형 차트 설정
export const getResponsiveSettings = (
  containerWidth: number,
  isMobile: boolean = containerWidth < CHART_LAYOUT.MOBILE_BREAKPOINT
) => {
  return {
    isMobile,
    margin: {
      top: CHART_MARGINS.TOP,
      right: isMobile ? CHART_MARGINS.MOBILE.RIGHT : CHART_MARGINS.DESKTOP.RIGHT,
      bottom: CHART_MARGINS.BOTTOM,
      left: isMobile ? CHART_MARGINS.MOBILE.LEFT : CHART_MARGINS.DESKTOP.LEFT,
    },
    fontSize: {
      title: isMobile ? FONT_SIZES.MOBILE.TITLE : FONT_SIZES.DESKTOP.TITLE,
      axis: isMobile ? FONT_SIZES.MOBILE.AXIS : FONT_SIZES.DESKTOP.AXIS,
      legend: isMobile ? FONT_SIZES.MOBILE.LEGEND : FONT_SIZES.DESKTOP.LEGEND,
      message: isMobile ? FONT_SIZES.MOBILE.MESSAGE : FONT_SIZES.DESKTOP.MESSAGE,
    },
  };
};

/** 등급별 HSL 명도/채도 파라미터 */
const GRADE_HSL_PARAMS: Record<string, { s: number; lLight: number; lDark: number }> = {
  grade1:          { s: 0.80, lLight: 0.30, lDark: 0.68 },
  grade2:          { s: 0.68, lLight: 0.45, lDark: 0.55 },
  grade3Stopped:   { s: 0.55, lLight: 0.52, lDark: 0.48 },
  grade3Estimated: { s: 0.42, lLight: 0.58, lDark: 0.42 },
  gradeBelow:      { s: 0.30, lLight: 0.62, lDark: 0.38 },
  mixedGrade:      { s: 0.12, lLight: 0.58, lDark: 0.42 },
};

/** 다지역 모드: 지역=색조, 등급=명도/채도 조합으로 색상을 계산한다 */
export const getRegionGradeColor = (
  region: string,
  gradeKey: string,
  isDark: boolean,
): string => {
  const hue = REGION_BASE_HUES[region] ?? 0;
  const params = GRADE_HSL_PARAMS[gradeKey] ?? GRADE_HSL_PARAMS.grade1;
  const l = isDark ? params.lDark : params.lLight;
  return d3.hsl(hue, params.s, l).formatHex();
};

// 적응적 틱 간격 계산
export const calculateTickInterval = (
  dataSpanDays: number,
  isMobile: boolean
): number => {
  if (isMobile) {
    // 모바일: 더 넓은 간격
    if (dataSpanDays <= TICK_INTERVALS.SHORT_PERIOD) return TICK_INTERVALS.MOBILE.SHORT_RETURN;
    if (dataSpanDays <= TICK_INTERVALS.MEDIUM_PERIOD) return TICK_INTERVALS.MOBILE.MEDIUM_RETURN;
    return Math.max(TICK_INTERVALS.MOBILE.LONG_MIN, Math.ceil(dataSpanDays / TICK_INTERVALS.MOBILE.DIVISOR));
  } else {
    // 데스크톱: 상대적으로 좁은 간격
    if (dataSpanDays <= TICK_INTERVALS.SHORT_PERIOD) return TICK_INTERVALS.DESKTOP.SHORT_RETURN;
    if (dataSpanDays <= TICK_INTERVALS.MEDIUM_PERIOD) return TICK_INTERVALS.DESKTOP.MEDIUM_RETURN;
    return Math.max(TICK_INTERVALS.DESKTOP.LONG_MIN, Math.ceil(dataSpanDays / TICK_INTERVALS.DESKTOP.DIVISOR));
  }
};