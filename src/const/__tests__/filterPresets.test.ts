import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FILTER_PRESETS, isPresetActive } from "../filterPresets";
import type { AnalysisFilters } from "../../utils/analysis/filters";
import { GRADE_OPTIONS } from "../Common";

const ALL_GRADES = GRADE_OPTIONS.map((o) => o.value);

const baseFilters: AnalysisFilters = {
  regions: [],
  unions: [],
  grades: ALL_GRADES,
  startDate: new Date(2024, 9, 1),
  endDate: new Date(2024, 9, 7),
  comparisonEnabled: false,
  comparisonStartDate: null,
  comparisonEndDate: null,
};

const getPreset = (id: string) => {
  const preset = FILTER_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`preset not found: ${id}`);
  return preset;
};

describe("current-season 프리셋", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("당해연도 8/1 ~ 11/30을 반환한다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const result = getPreset("current-season").apply(baseFilters);
    expect(result.startDate).toEqual(new Date(2024, 7, 1));
    expect(result.endDate).toEqual(new Date(2024, 10, 30));
  });

  it("전체 등급을 포함한다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const result = getPreset("current-season").apply(baseFilters);
    expect(result.grades.sort()).toEqual(ALL_GRADES.sort());
  });

  it("비교 기능이 비활성화된다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const result = getPreset("current-season").apply(baseFilters);
    expect(result.comparisonEnabled).toBe(false);
  });
});

describe("last-season 프리셋", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("전년도 8/1 ~ 11/30을 반환한다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const result = getPreset("last-season").apply(baseFilters);
    expect(result.startDate).toEqual(new Date(2023, 7, 1));
    expect(result.endDate).toEqual(new Date(2023, 10, 30));
  });
});

describe("recent-30days 프리셋", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("오늘 기준 29일 전 ~ 오늘을 반환한다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const result = getPreset("recent-30days").apply(baseFilters);
    expect(result.endDate.toDateString()).toBe(new Date(2024, 9, 15).toDateString());
    expect(result.startDate.toDateString()).toBe(new Date(2024, 8, 16).toDateString());
  });
});

describe("grade1-only 프리셋", () => {
  it("날짜는 유지하고 grades를 grade1만으로 변경한다", () => {
    const result = getPreset("grade1-only").apply(baseFilters);
    expect(result.grades).toEqual(["grade1"]);
    expect(result.startDate).toBe(baseFilters.startDate);
    expect(result.endDate).toBe(baseFilters.endDate);
  });
});

describe("yoy-comparison 프리셋", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("당해 시즌과 전년도 동기간 비교를 설정한다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const result = getPreset("yoy-comparison").apply(baseFilters);
    expect(result.startDate).toEqual(new Date(2024, 7, 1));
    expect(result.endDate).toEqual(new Date(2024, 10, 30));
    expect(result.comparisonEnabled).toBe(true);
    expect(result.comparisonStartDate).toEqual(new Date(2023, 7, 1));
    expect(result.comparisonEndDate).toEqual(new Date(2023, 10, 30));
  });
});

describe("isPresetActive", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("filters가 current-season과 일치하면 true를 반환한다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const preset = getPreset("current-season");
    const matchingFilters: AnalysisFilters = {
      ...baseFilters,
      startDate: new Date(2024, 7, 1),
      endDate: new Date(2024, 10, 30),
    };
    expect(isPresetActive(preset, matchingFilters)).toBe(true);
  });

  it("날짜가 다르면 false를 반환한다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const preset = getPreset("current-season");
    expect(isPresetActive(preset, baseFilters)).toBe(false);
  });

  it("등급이 다르면 false를 반환한다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const preset = getPreset("current-season");
    const filters: AnalysisFilters = {
      ...baseFilters,
      startDate: new Date(2024, 7, 1),
      endDate: new Date(2024, 10, 30),
      grades: ["grade1"],
    };
    expect(isPresetActive(preset, filters)).toBe(false);
  });
});
