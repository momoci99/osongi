import { describe, it, expect } from "vitest";
import {
  getGradeDashPattern,
  getGradeColor,
  getGradeColorMap,
  getGradeColorArray,
  filterMushroomSeasonData,
  groupDataByYear,
  createDataSeries,
  getResponsiveSettings,
  calculateTickInterval,
} from "../chartUtils";
import { createAppTheme } from "../../theme";
import { createMockWeeklyPriceDatum, SAMPLE_ALL_GRADES } from "./fixtures";
import {
  GRADE_DASH_PATTERNS,
  CHART_MARGINS,
  FONT_SIZES,
} from "../../const/Numbers";

/** getGradeDashPattern */
describe("getGradeDashPattern", () => {
  it.each([
    ["grade1", GRADE_DASH_PATTERNS.grade1],
    ["grade2", GRADE_DASH_PATTERNS.grade2],
    ["grade3Stopped", GRADE_DASH_PATTERNS.grade3Stopped],
    ["grade3Estimated", GRADE_DASH_PATTERNS.grade3Estimated],
    ["gradeBelow", GRADE_DASH_PATTERNS.gradeBelow],
    ["mixedGrade", GRADE_DASH_PATTERNS.mixedGrade],
  ])("%s → %s 패턴을 반환한다", (grade, expected) => {
    expect(getGradeDashPattern(grade)).toBe(expected);
  });

  it("미지 키는 grade1 기본값을 반환한다", () => {
    expect(getGradeDashPattern("unknownGrade")).toBe(GRADE_DASH_PATTERNS.grade1);
  });
});

/** getGradeColor */
describe("getGradeColor", () => {
  const palette = ["#red", "#blue", "#green", "#purple", "#orange", "#gray"];

  it("인덱스에 따라 색상을 매핑한다", () => {
    expect(getGradeColor("grade1", palette)).toBe("#red"); // index 0
    expect(getGradeColor("grade2", palette)).toBe("#blue"); // index 1
    expect(getGradeColor("mixedGrade", palette)).toBe("#gray"); // index 5
  });

  it("미지 키는 grade1 인덱스(0)를 사용한다", () => {
    expect(getGradeColor("unknownGrade", palette)).toBe("#red");
  });

  it("palette 길이를 넘으면 modulo 처리한다", () => {
    const shortPalette = ["#a", "#b"];
    // grade2 인덱스=1, 1 % 2 = 1
    expect(getGradeColor("grade2", shortPalette)).toBe("#b");
    // gradeBelow 인덱스=4, 4 % 2 = 0
    expect(getGradeColor("gradeBelow", shortPalette)).toBe("#a");
  });
});

/** getGradeColorMap */
describe("getGradeColorMap", () => {
  const theme = createAppTheme("light");

  it("6개 등급 색상을 포함한다", () => {
    const colorMap = getGradeColorMap(theme);
    expect(Object.keys(colorMap)).toHaveLength(6);
    SAMPLE_ALL_GRADES.forEach((grade) => {
      expect(colorMap[grade]).toBeDefined();
      expect(typeof colorMap[grade]).toBe("string");
    });
  });

  it("테마의 chart palette 값과 일치한다", () => {
    const colorMap = getGradeColorMap(theme);
    expect(colorMap.grade1).toBe(theme.palette.chart.grade1);
    expect(colorMap.grade2).toBe(theme.palette.chart.grade2);
  });
});

/** getGradeColorArray */
describe("getGradeColorArray", () => {
  const theme = createAppTheme("dark");

  it("6개 색상 배열을 반환한다", () => {
    const colors = getGradeColorArray(theme);
    expect(colors).toHaveLength(6);
  });

  it("순서가 grade1~mixedGrade이다", () => {
    const colors = getGradeColorArray(theme);
    expect(colors[0]).toBe(theme.palette.chart.grade1);
    expect(colors[5]).toBe(theme.palette.chart.mixedGrade);
  });
});

/** filterMushroomSeasonData */
describe("filterMushroomSeasonData", () => {
  it("시즌(8~12월) 데이터만 남긴다", () => {
    const data = [
      createMockWeeklyPriceDatum({ date: "2024-08-01" }), // 시즌
      createMockWeeklyPriceDatum({ date: "2024-10-15" }), // 시즌
      createMockWeeklyPriceDatum({ date: "2024-07-31" }), // 시즌 외
      createMockWeeklyPriceDatum({ date: "2024-01-15" }), // 시즌 외
    ];
    const result = filterMushroomSeasonData(data);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2024-08-01");
    expect(result[1].date).toBe("2024-10-15");
  });

  it("시즌 외 데이터만 있으면 빈 배열을 반환한다", () => {
    const data = [
      createMockWeeklyPriceDatum({ date: "2024-03-01" }),
      createMockWeeklyPriceDatum({ date: "2024-06-15" }),
    ];
    const result = filterMushroomSeasonData(data);
    expect(result).toHaveLength(0);
  });

  it("빈 배열을 입력하면 빈 배열을 반환한다", () => {
    expect(filterMushroomSeasonData([])).toHaveLength(0);
  });

  it("12월 데이터를 포함한다", () => {
    const data = [createMockWeeklyPriceDatum({ date: "2024-12-31" })];
    const result = filterMushroomSeasonData(data);
    expect(result).toHaveLength(1);
  });
});

/** groupDataByYear */
describe("groupDataByYear", () => {
  it("연도별로 그룹화한다", () => {
    const data = [
      createMockWeeklyPriceDatum({ date: "2023-10-01" }),
      createMockWeeklyPriceDatum({ date: "2024-10-01" }),
      createMockWeeklyPriceDatum({ date: "2024-10-05" }),
    ];
    const result = groupDataByYear(data);
    expect(result.size).toBe(2);
    expect(result.get(2023)).toHaveLength(1);
    expect(result.get(2024)).toHaveLength(2);
  });

  it("빈 배열이면 빈 Map을 반환한다", () => {
    const result = groupDataByYear([]);
    expect(result.size).toBe(0);
  });

  it("같은 연도의 데이터를 올바르게 그룹화한다", () => {
    const data = [
      createMockWeeklyPriceDatum({ date: "2024-08-01" }),
      createMockWeeklyPriceDatum({ date: "2024-09-15" }),
      createMockWeeklyPriceDatum({ date: "2024-12-31" }),
    ];
    const result = groupDataByYear(data);
    expect(result.size).toBe(1);
    expect(result.get(2024)).toHaveLength(3);
  });
});

/** createDataSeries */
describe("createDataSeries", () => {
  const palette = ["#a", "#b", "#c", "#d", "#e", "#f"];

  it("region-grade 복합키로 그룹화한다", () => {
    const data = [
      createMockWeeklyPriceDatum({ region: "강원", gradeKey: "grade1" }),
      createMockWeeklyPriceDatum({ region: "강원", gradeKey: "grade1" }),
      createMockWeeklyPriceDatum({ region: "경북", gradeKey: "grade1" }),
    ];
    const result = createDataSeries(data, palette);
    expect(result).toHaveLength(2);
    expect(result.find((s) => s.key === "강원-grade1")?.data).toHaveLength(2);
    expect(result.find((s) => s.key === "경북-grade1")?.data).toHaveLength(1);
  });

  it("각 시리즈에 색상을 할당한다", () => {
    const data = [
      createMockWeeklyPriceDatum({ region: "강원", gradeKey: "grade1" }),
    ];
    const result = createDataSeries(data, palette);
    expect(result[0].color).toBe(palette[0]); // grade1 → index 0
  });

  it("빈 데이터면 빈 배열을 반환한다", () => {
    const result = createDataSeries([], palette);
    expect(result).toHaveLength(0);
  });

  it("region과 gradeKey를 올바르게 분리한다", () => {
    const data = [
      createMockWeeklyPriceDatum({ region: "강원", gradeKey: "grade2" }),
    ];
    const result = createDataSeries(data, palette);
    expect(result[0].region).toBe("강원");
    expect(result[0].gradeKey).toBe("grade2");
  });
});

/** getResponsiveSettings */
describe("getResponsiveSettings", () => {
  it("모바일(768 미만)이면 모바일 설정을 반환한다", () => {
    const result = getResponsiveSettings(500);
    expect(result.isMobile).toBe(true);
    expect(result.margin.left).toBe(CHART_MARGINS.MOBILE.LEFT);
    expect(result.margin.right).toBe(CHART_MARGINS.MOBILE.RIGHT);
    expect(result.fontSize.title).toBe(FONT_SIZES.MOBILE.TITLE);
  });

  it("데스크톱(768 이상)이면 데스크톱 설정을 반환한다", () => {
    const result = getResponsiveSettings(1024);
    expect(result.isMobile).toBe(false);
    expect(result.margin.left).toBe(CHART_MARGINS.DESKTOP.LEFT);
    expect(result.margin.right).toBe(CHART_MARGINS.DESKTOP.RIGHT);
    expect(result.fontSize.title).toBe(FONT_SIZES.DESKTOP.TITLE);
  });

  it("경계값(768)이면 데스크톱으로 판단한다", () => {
    const result = getResponsiveSettings(768);
    expect(result.isMobile).toBe(false);
  });

  it("top/bottom 마진은 디바이스에 관계없이 동일하다", () => {
    const mobile = getResponsiveSettings(500);
    const desktop = getResponsiveSettings(1024);
    expect(mobile.margin.top).toBe(CHART_MARGINS.TOP);
    expect(desktop.margin.top).toBe(CHART_MARGINS.TOP);
    expect(mobile.margin.bottom).toBe(CHART_MARGINS.BOTTOM);
    expect(desktop.margin.bottom).toBe(CHART_MARGINS.BOTTOM);
  });

  it("isMobile 파라미터 오버라이드가 동작한다", () => {
    const result = getResponsiveSettings(1024, true);
    expect(result.isMobile).toBe(true);
    expect(result.margin.left).toBe(CHART_MARGINS.MOBILE.LEFT);
  });
});

/** calculateTickInterval */
describe("calculateTickInterval", () => {
  it("모바일 + 짧은 기간(≤7일) → 2를 반환한다", () => {
    expect(calculateTickInterval(5, true)).toBe(2);
    expect(calculateTickInterval(7, true)).toBe(2);
  });

  it("모바일 + 중간 기간(≤15일) → 3을 반환한다", () => {
    expect(calculateTickInterval(10, true)).toBe(3);
    expect(calculateTickInterval(15, true)).toBe(3);
  });

  it("모바일 + 긴 기간(>15일) → 최소 5 이상을 반환한다", () => {
    const result = calculateTickInterval(30, true);
    expect(result).toBeGreaterThanOrEqual(5);
  });

  it("데스크톱 + 짧은 기간(≤7일) → 1을 반환한다", () => {
    expect(calculateTickInterval(5, false)).toBe(1);
    expect(calculateTickInterval(7, false)).toBe(1);
  });

  it("데스크톱 + 중간 기간(≤15일) → 2를 반환한다", () => {
    expect(calculateTickInterval(10, false)).toBe(2);
    expect(calculateTickInterval(15, false)).toBe(2);
  });

  it("데스크톱 + 긴 기간(>15일) → 최소 3 이상을 반환한다", () => {
    const result = calculateTickInterval(30, false);
    expect(result).toBeGreaterThanOrEqual(3);
  });
});
