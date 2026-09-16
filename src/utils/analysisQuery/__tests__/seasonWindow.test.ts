import { describe, expect, it } from "vitest";
import { fromWindowOffset, sumQuantityByDate, toggleSeason, toWindowOffset } from "../seasonWindow";
import { makeRow } from "./fixtures";

describe("시즌 창 오프셋", () => {
  it("09-01이 0, 11-30이 마지막", () => {
    expect(toWindowOffset("2024-09-01")).toBe(0);
    expect(toWindowOffset("2024-11-30")).toBe(90);
  });

  it("창 밖 날짜는 경계로 고정", () => {
    expect(toWindowOffset("2024-08-20")).toBe(0);
    expect(toWindowOffset("2024-12-15")).toBe(90);
  });

  it("오프셋 → 날짜 왕복", () => {
    expect(fromWindowOffset(2025, toWindowOffset("2025-10-07"))).toBe("2025-10-07");
    expect(fromWindowOffset(2025, 120)).toBe("2025-11-30");
  });

  it("날짜별 수량 합계", () => {
    const totals = sumQuantityByDate([
      makeRow("2024-09-19", { quantity: 1 }),
      makeRow("2024-09-19", { quantity: 2, grade: "grade2" }),
    ]);
    expect(totals.get("2024-09-19")).toBe(3);
  });
});

describe("toggleSeason", () => {
  it("보조키 없으면 그 시즌만 선택", () => {
    expect(toggleSeason({ kind: "seasons", years: [2024, 2025] }, 2023, false)).toEqual({
      kind: "seasons",
      years: [2023],
    });
  });

  it("보조키면 토글하고 정렬, 마지막 하나는 남긴다", () => {
    const seasons = (years: number[]) => ({ kind: "seasons" as const, years });
    expect(toggleSeason(seasons([2025]), 2023, true)).toEqual(seasons([2023, 2025]));
    expect(toggleSeason(seasons([2023, 2025]), 2025, true)).toEqual(seasons([2023]));
    expect(toggleSeason(seasons([2025]), 2025, true)).toEqual(seasons([2025]));
  });

  it("기간 선택 상태에서 클릭하면 시즌 선택으로 전환", () => {
    expect(toggleSeason({ kind: "range", start: "2025-09-01", end: "2025-09-30" }, 2024, true)).toEqual({
      kind: "seasons",
      years: [2024],
    });
  });
});
