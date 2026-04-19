import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PresetChips from "./PresetChips";
import { FILTER_PRESETS } from "../../../const/filterPresets";
import type { AnalysisFilters } from "../../../utils/analysis/filters";
import { GRADE_OPTIONS } from "../../../const/Common";

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

describe("PresetChips", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("5개 칩이 모두 렌더링된다", () => {
    render(<PresetChips filters={baseFilters} onApply={vi.fn()} />);
    FILTER_PRESETS.forEach((preset) => {
      expect(screen.getByText(preset.label)).toBeInTheDocument();
    });
  });

  it("칩 클릭 시 onApply가 해당 프리셋의 결과 filters로 호출된다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const onApply = vi.fn();
    render(<PresetChips filters={baseFilters} onApply={onApply} />);

    fireEvent.click(screen.getByText("올해 시즌 전체"));

    expect(onApply).toHaveBeenCalledOnce();
    const called = onApply.mock.calls[0][0] as AnalysisFilters;
    expect(called.startDate).toEqual(new Date(2024, 7, 1));
    expect(called.endDate).toEqual(new Date(2024, 10, 30));
  });

  it("현재 필터와 일치하는 프리셋 칩은 filled 스타일을 가진다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    const grade1Filters: AnalysisFilters = {
      ...baseFilters,
      grades: ["grade1"],
    };
    render(<PresetChips filters={grade1Filters} onApply={vi.fn()} />);

    const activeChip = screen.getByText("1등품만").closest(".MuiChip-root");
    expect(activeChip).toHaveClass("MuiChip-filled");
  });

  it("일치하지 않는 프리셋 칩은 outlined 스타일을 가진다", () => {
    vi.setSystemTime(new Date(2024, 9, 15));
    render(<PresetChips filters={baseFilters} onApply={vi.fn()} />);

    const chip = screen.getByText("올해 시즌 전체").closest(".MuiChip-root");
    expect(chip).toHaveClass("MuiChip-outlined");
  });
});
