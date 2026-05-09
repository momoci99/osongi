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

const createDefaultFilters = (): AnalysisFilters => {
  const { startDate, endDate } = getDefaultDateRange();
  return {
    regions: [],
    unions: [],
    grades: GRADE_OPTIONS.map((o) => o.value),
    startDate,
    endDate,
    comparisonEnabled: false,
    comparisonStartDate: null,
    comparisonEndDate: null,
  };
};

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
