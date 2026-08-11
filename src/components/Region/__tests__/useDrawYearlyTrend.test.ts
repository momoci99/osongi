import { describe, it, expect } from "vitest";
import { toYearSlots } from "../ScopeYearlyChart/useDrawYearlyTrend";
import type { YearStat } from "../../../types/region";

const year = (value: number): YearStat => ({
  year: value,
  totalQuantityKg: 1000,
  totalAmountWon: 200000000,
  avgPricePerKg: 200000,
});

describe("toYearSlots", () => {
  it("기록이 없는 해를 빈 슬롯으로 채운다", () => {
    /** 봉화처럼 2019년 기록이 없는 경우 축에서 해가 사라지면 추이를 오독한다 */
    const slots = toYearSlots([year(2018), year(2020), year(2021)]);

    expect(slots.map((slot) => slot.year)).toEqual([2018, 2019, 2020, 2021]);
    expect(slots[1].stat).toBeNull();
  });

  it("연속된 기록은 그대로 둔다", () => {
    const slots = toYearSlots([year(2023), year(2024)]);

    expect(slots).toHaveLength(2);
    expect(slots.every((slot) => slot.stat !== null)).toBe(true);
  });

  it("기록이 하나면 슬롯도 하나", () => {
    expect(toYearSlots([year(2025)])).toHaveLength(1);
  });

  it("기록이 없으면 빈 배열", () => {
    expect(toYearSlots([])).toEqual([]);
  });
});
