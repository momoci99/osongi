import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalysisFilters } from "../utils/analysis/filters";
import { getDefaultDateRange } from "../utils/analysis/dateRange";
import { GRADE_OPTIONS } from "../const/Common";

type AnalysisFilterState = {
  filters: AnalysisFilters;
  setFilters: (filters: AnalysisFilters) => void;
  resetFilters: () => void;
  advancedDialogOpen: boolean;
  toggleAdvancedDialog: () => void;
  setAdvancedDialogOpen: (open: boolean) => void;
};

/** 기본 선택 등급: 주요 거래 등급(1·2등품)만 표시해 첫 진입 가시성 확보 */
const DEFAULT_GRADES = ["grade1", "grade2"];

const createDefaultFilters = (): AnalysisFilters => {
  const { startDate, endDate } = getDefaultDateRange();
  return {
    regions: [],
    unions: [],
    grades: DEFAULT_GRADES,
    startDate,
    endDate,
    comparisonEnabled: false,
    comparisonStartDate: null,
    comparisonEndDate: null,
  };
};

type PersistedFiltersState = { filters: AnalysisFilters };

/**
 * localStorage 저장값 마이그레이션 함수.
 * 버전 올릴 때마다 `fromVersion < N` 블록을 누적 추가한다.
 *
 * v0 → v1: grades 기본값을 전체 6개 → ["grade1", "grade2"]로 축소
 */
const migrateFiltersState = (
  raw: unknown,
  fromVersion: number,
): PersistedFiltersState => {
  let state = raw as PersistedFiltersState;

  if (fromVersion < 1) {
    state = {
      ...state,
      filters: { ...state.filters, grades: DEFAULT_GRADES },
    };
  }

  return state;
};

const STORE_VERSION = 1;

/** Date 필드 키 목록 */
const DATE_KEYS: (keyof AnalysisFilters)[] = [
  "startDate",
  "endDate",
  "comparisonStartDate",
  "comparisonEndDate",
];

/**
 * 분석 필터 상태를 localStorage에 영속화하는 스토어.
 * Date 객체의 직렬화/역직렬화를 커스텀 storage로 처리한다.
 * 다이얼로그 열림 상태는 영속화하지 않는다 (partialize).
 */
export const useAnalysisFilterStore = create<AnalysisFilterState>()(
  persist(
    (set) => ({
      filters: createDefaultFilters(),
      setFilters: (filters) => set({ filters }),
      resetFilters: () => set({ filters: createDefaultFilters() }),
      advancedDialogOpen: false,
      toggleAdvancedDialog: () =>
        set((s) => ({ advancedDialogOpen: !s.advancedDialogOpen })),
      setAdvancedDialogOpen: (open) => set({ advancedDialogOpen: open }),
    }),
    {
      name: "osongi-analysis-filters",
      version: STORE_VERSION,
      migrate: migrateFiltersState,
      partialize: (state) => ({ filters: state.filters }),
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          if (parsed?.state?.filters) {
            for (const key of DATE_KEYS) {
              const val = parsed.state.filters[key];
              if (typeof val === "string") {
                parsed.state.filters[key] = new Date(val);
              }
            }
          }
          return parsed;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    },
  ),
);

export default useAnalysisFilterStore;
