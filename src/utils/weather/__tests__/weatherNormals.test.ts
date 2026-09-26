import { describe, expect, it } from "vitest";
import {
  buildCumulativeRain,
  buildMonthlyStrips,
  describeRank,
  rankOf,
  seasonDaysByYear,
} from "../weatherNormals";
import type { StationWeatherFile, WeatherYearValues } from "../publicWeather";

/** 수집 창 07-01~11-30 = 153일 */
const WINDOW_DAYS = 153;
/** 07-01 기준 8월 1일 인덱스 */
const AUG_1 = 31;

/** 07-01 부터 days 일, 강수 rain·기온 temp 로 채운 연도 값 */
const yearValues = (rain: number, temp: number, days = WINDOW_DAYS): WeatherYearValues => {
  const filled = (value: number) => Array<number>(days).fill(value);
  return { sumRn: filled(rain), avgTa: filled(temp), minTa: filled(temp), maxTa: filled(temp), avgRhm: filled(70), avgTs: filled(temp) };
};

const stationFile = (years: Record<string, WeatherYearValues>): StationWeatherFile => ({
  stationId: 1,
  generatedAt: "",
  startMonthDay: "07-01",
  years,
});

describe("rankOf / describeRank", () => {
  it("위쪽 절반은 큰 쪽부터 센다", () => {
    expect(rankOf(9, [1, 5, 9, 7])).toEqual({ position: 1, total: 4, side: "high" });
    expect(describeRank({ position: 1, total: 4, side: "high" }, "rain")).toBe("4년 중 가장 많음");
  });

  it("아래쪽 절반은 작은 쪽부터 센다", () => {
    const rank = rankOf(2, [1, 2, 8, 9, 10]);
    expect(rank).toEqual({ position: 2, total: 5, side: "low" });
    expect(describeRank(rank!, "avgTa")).toBe("5년 중 2번째로 낮음");
  });

  it("비교 대상이 하나면 순위 없음", () => {
    expect(rankOf(3, [3])).toBeNull();
  });
});

describe("buildMonthlyStrips", () => {
  const byYear = seasonDaysByYear([
    stationFile({ 2023: yearValues(1, 20), 2024: yearValues(3, 22), 2025: yearValues(2, 21) }),
  ]);

  it("월 강수는 합, 기온은 평균으로 해마다 점 하나", () => {
    const [rain, temp] = buildMonthlyStrips(byYear, 2024);
    const august = rain.months.find((m) => m.month === 8)!;
    expect(august.values).toEqual([
      { year: 2023, value: 31 },
      { year: 2024, value: 93 },
      { year: 2025, value: 62 },
    ]);
    expect(august.median).toBe(62);
    expect(august.rank).toEqual({ position: 1, total: 3, side: "high" });
    expect(temp.months[0].selected).toEqual({ value: 22, partialUntil: null });
  });

  it("진행 중인 달은 빈 점(마지막 관측일)만, 순위 없음", () => {
    const partial = seasonDaysByYear([
      stationFile({ 2024: yearValues(1, 20), 2025: yearValues(1, 20), 2026: yearValues(2, 21, AUG_1 + 10) }),
    ]);
    const [rain] = buildMonthlyStrips(partial, 2026);
    const august = rain.months.find((m) => m.month === 8)!;
    expect(august.selected).toEqual({ value: 20, partialUntil: "2026-08-10" });
    expect(august.rank).toBeNull();
    expect(august.values.map((v) => v.year)).toEqual([2024, 2025]);
    expect(rain.months.find((m) => m.month === 9)!.selected).toBeNull();
  });

  it("관측일이 90% 미만인 달은 평년에서 뺀다", () => {
    const sparse = yearValues(1, 20);
    sparse.sumRn = sparse.sumRn!.map((v, i) => (i >= AUG_1 && i < AUG_1 + 5 ? null : v));
    const [rain] = buildMonthlyStrips(seasonDaysByYear([stationFile({ 2024: sparse, 2025: yearValues(1, 20) })]), 2025);
    expect(rain.months.find((m) => m.month === 8)!.values.map((v) => v.year)).toEqual([2025]);
  });
});

describe("buildCumulativeRain", () => {
  const byYear = seasonDaysByYear([
    stationFile({ 2023: yearValues(1, 20), 2024: yearValues(3, 20), 2025: yearValues(2, 20, AUG_1) }),
  ]);
  const model = buildCumulativeRain(byYear, 2025);

  it("07-01~10-31 을 매일 누적한다", () => {
    expect(model.days).toHaveLength(123);
    expect(model.days[0].monthDay).toBe("07-01");
    expect(model.days.at(-1)!.monthDay).toBe("10-31");
    expect(model.days[9]).toMatchObject({ min: 10, max: 30, median: 20, selected: 20 });
  });

  it("띠는 선택 시즌을 뺀 시즌들, 선택 시즌은 마지막 관측일까지", () => {
    expect(model.bandYears).toBe(2);
    expect(model.days[AUG_1 - 1].selected).toBe(62);
    expect(model.days[AUG_1].selected).toBeNull();
    expect(model.days[AUG_1 - 1].rank).toEqual({ position: 2, total: 3, side: "high" });
  });
});
