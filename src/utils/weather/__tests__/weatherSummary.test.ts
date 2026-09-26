import { describe, expect, it } from "vitest";
import { latestCumulativeRain, latestMonthFact } from "../weatherSummary";
import type { CumulativeRainModel, MetricStrips, MonthStrip } from "../weatherNormals";

const month = (m: number, value: number | null, ranked: boolean, partialUntil: string | null = null): MonthStrip => ({
  month: m,
  values: [],
  median: null,
  selected: value === null ? null : { value, partialUntil },
  rank: ranked ? { position: 2, total: 10, side: "high" } : null,
});

const strips: MetricStrips[] = [
  { key: "avgTa", months: [month(7, 25, true), month(8, 26, true), month(9, 21, false, "2026-09-25"), month(10, null, false)] },
];

describe("latestMonthFact", () => {
  it("순위가 있는 가장 최근 달을 고른다", () => {
    expect(latestMonthFact(strips, "avgTa")).toMatchObject({ month: 8, value: 26, rank: { position: 2 } });
  });

  it("순위 있는 달이 없으면 진행 중인 달 값을 쓴다", () => {
    const partial: MetricStrips[] = [{ key: "rain", months: [month(7, 40, false, "2026-07-10")] }];
    expect(latestMonthFact(partial, "rain")).toMatchObject({ month: 7, value: 40, partialUntil: "2026-07-10" });
  });

  it("지표가 없거나 값이 없으면 null", () => {
    expect(latestMonthFact(strips, "groundTemp")).toBeNull();
  });
});

describe("latestCumulativeRain", () => {
  it("선택 시즌의 마지막 관측일 값을 준다", () => {
    const model: CumulativeRainModel = {
      bandYears: 3,
      days: [
        { offset: 0, monthDay: "07-01", min: 0, max: 5, median: 1, selected: 2, rank: null },
        { offset: 1, monthDay: "07-02", min: 0, max: 9, median: 3, selected: 4, rank: { position: 1, total: 4, side: "low" } },
        { offset: 2, monthDay: "07-03", min: 0, max: 9, median: 3, selected: null, rank: null },
      ],
    };
    expect(latestCumulativeRain(model)).toEqual({ monthDay: "07-02", value: 4, rank: { position: 1, total: 4, side: "low" } });
  });
});
