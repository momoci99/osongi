import { describe, it, expect, beforeEach } from "vitest";
import { useAnalysisFilterStore } from "../useAnalysisFilterStore";
import { GRADE_OPTIONS } from "../../const/Common";

describe("useAnalysisFilterStore", () => {
  beforeEach(() => {
    useAnalysisFilterStore.getState().resetFilters();
  });

  /** 초기 상태 */
  describe("초기 상태", () => {
    it("regions는 빈 배열이다", () => {
      expect(useAnalysisFilterStore.getState().filters.regions).toEqual([]);
    });

    it("unions는 빈 배열이다", () => {
      expect(useAnalysisFilterStore.getState().filters.unions).toEqual([]);
    });

    it("grades는 모든 등급을 포함한다", () => {
      const allGrades = GRADE_OPTIONS.map((o) => o.value);
      expect(useAnalysisFilterStore.getState().filters.grades).toEqual(
        allGrades,
      );
    });

    it("comparisonEnabled는 false이다", () => {
      expect(useAnalysisFilterStore.getState().filters.comparisonEnabled).toBe(
        false,
      );
    });

    it("comparisonStartDate는 null이다", () => {
      expect(
        useAnalysisFilterStore.getState().filters.comparisonStartDate,
      ).toBeNull();
    });

    it("comparisonEndDate는 null이다", () => {
      expect(
        useAnalysisFilterStore.getState().filters.comparisonEndDate,
      ).toBeNull();
    });

    it("startDate와 endDate는 Date 객체이다", () => {
      const { startDate, endDate } = useAnalysisFilterStore.getState().filters;
      expect(startDate).toBeInstanceOf(Date);
      expect(endDate).toBeInstanceOf(Date);
    });
  });

  /** setFilters */
  describe("setFilters", () => {
    it("필터를 업데이트한다", () => {
      const current = useAnalysisFilterStore.getState().filters;
      useAnalysisFilterStore.getState().setFilters({
        ...current,
        regions: ["강원"],
        unions: ["양양군산림조합"],
      });

      const updated = useAnalysisFilterStore.getState().filters;
      expect(updated.regions).toEqual(["강원"]);
      expect(updated.unions).toEqual(["양양군산림조합"]);
    });

    it("비교 모드를 활성화한다", () => {
      const current = useAnalysisFilterStore.getState().filters;
      const compStart = new Date(2024, 9, 1);
      const compEnd = new Date(2024, 9, 7);
      useAnalysisFilterStore.getState().setFilters({
        ...current,
        comparisonEnabled: true,
        comparisonStartDate: compStart,
        comparisonEndDate: compEnd,
      });

      const updated = useAnalysisFilterStore.getState().filters;
      expect(updated.comparisonEnabled).toBe(true);
      expect(updated.comparisonStartDate).toEqual(compStart);
      expect(updated.comparisonEndDate).toEqual(compEnd);
    });
  });

  /** resetFilters */
  describe("resetFilters", () => {
    it("필터를 초기 상태로 되돌린다", () => {
      const current = useAnalysisFilterStore.getState().filters;
      useAnalysisFilterStore.getState().setFilters({
        ...current,
        regions: ["경북"],
        grades: ["grade1"],
        comparisonEnabled: true,
      });

      useAnalysisFilterStore.getState().resetFilters();

      const reset = useAnalysisFilterStore.getState().filters;
      expect(reset.regions).toEqual([]);
      expect(reset.grades).toEqual(GRADE_OPTIONS.map((o) => o.value));
      expect(reset.comparisonEnabled).toBe(false);
    });
  });
});
