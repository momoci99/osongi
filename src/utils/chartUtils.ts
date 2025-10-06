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

// 등급별 대시 패턴 정의
export const getGradeDashPattern = (gradeKey: string): string => {
  return GRADE_DASH_PATTERNS[gradeKey as keyof typeof GRADE_DASH_PATTERNS] || GRADE_DASH_PATTERNS.grade1;
};

// 등급별 색상 매핑
export const getGradeColor = (gradeKey: string, colorPalette: readonly string[]): string => {
  const colorIndex = GRADE_COLOR_INDICES[gradeKey as keyof typeof GRADE_COLOR_INDICES] || GRADE_COLOR_INDICES.grade1;
  return colorPalette[colorIndex % colorPalette.length];
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