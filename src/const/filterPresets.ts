import type { AnalysisFilters } from "../utils/analysis/filters";
import { isSameDate } from "../utils/analysis/dateRange";
import { MUSHROOM_SEASON } from "./Numbers";
import { GRADE_OPTIONS } from "./Common";

export type FilterPreset = {
  id: string;
  label: string;
  /** 현재 filters를 받아 새 filters를 반환 */
  apply: (current: AnalysisFilters) => AnalysisFilters;
};

const ALL_GRADES = GRADE_OPTIONS.map((o) => o.value);

/** 시즌 시작일(8/1)과 종료일(11/30)을 반환한다. */
const getSeasonRange = (year: number) => ({
  startDate: new Date(year, MUSHROOM_SEASON.START_MONTH - 1, 1),
  endDate: new Date(year, 10, 30), // 11/30
});

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "current-season",
    label: "올해 시즌 전체",
    apply: (current) => {
      const year = new Date().getFullYear();
      const { startDate, endDate } = getSeasonRange(year);
      return {
        ...current,
        startDate,
        endDate,
        grades: ALL_GRADES,
        regions: [],
        unions: [],
        comparisonEnabled: false,
        comparisonStartDate: null,
        comparisonEndDate: null,
      };
    },
  },
  {
    id: "last-season",
    label: "작년 시즌 전체",
    apply: (current) => {
      const year = new Date().getFullYear() - 1;
      const { startDate, endDate } = getSeasonRange(year);
      return {
        ...current,
        startDate,
        endDate,
        grades: ALL_GRADES,
        regions: [],
        unions: [],
        comparisonEnabled: false,
        comparisonStartDate: null,
        comparisonEndDate: null,
      };
    },
  },
  {
    id: "recent-30days",
    label: "최근 30일",
    apply: (current) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 29);
      return {
        ...current,
        startDate,
        endDate,
        comparisonEnabled: false,
        comparisonStartDate: null,
        comparisonEndDate: null,
      };
    },
  },
  {
    id: "grade1-only",
    label: "1등품만",
    apply: (current) => ({
      ...current,
      grades: ["grade1"],
    }),
  },
  {
    id: "yoy-comparison",
    label: "올해 vs 작년",
    apply: (current) => {
      const year = new Date().getFullYear();
      const { startDate, endDate } = getSeasonRange(year);
      const compStart = new Date(year - 1, MUSHROOM_SEASON.START_MONTH - 1, 1);
      const compEnd = new Date(year - 1, 10, 30);
      return {
        ...current,
        startDate,
        endDate,
        grades: ALL_GRADES,
        regions: [],
        unions: [],
        comparisonEnabled: true,
        comparisonStartDate: compStart,
        comparisonEndDate: compEnd,
      };
    },
  },
];

/** 현재 필터가 주어진 프리셋과 일치하는지 확인한다. */
export const isPresetActive = (
  preset: FilterPreset,
  filters: AnalysisFilters
): boolean => {
  const applied = preset.apply(filters);

  if (!isSameDate(applied.startDate, filters.startDate)) return false;
  if (!isSameDate(applied.endDate, filters.endDate)) return false;

  const sortedApplied = [...applied.grades].sort();
  const sortedCurrent = [...filters.grades].sort();
  if (sortedApplied.join(",") !== sortedCurrent.join(",")) return false;

  if (applied.comparisonEnabled !== filters.comparisonEnabled) return false;

  if (applied.comparisonEnabled) {
    if (
      applied.comparisonStartDate &&
      filters.comparisonStartDate &&
      !isSameDate(applied.comparisonStartDate, filters.comparisonStartDate)
    )
      return false;
    if (
      applied.comparisonEndDate &&
      filters.comparisonEndDate &&
      !isSameDate(applied.comparisonEndDate, filters.comparisonEndDate)
    )
      return false;
  }

  return true;
};
