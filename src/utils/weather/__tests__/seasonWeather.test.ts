import { describe, expect, it } from "vitest";
import { buildSeasonWeather, stationsForUnions } from "../seasonWeather";
import type { StationWeatherFile } from "../publicWeather";

/** 07-01 부터 days 일, 모든 값이 value 인 파일 */
const file = (stationId: number, year: number, days: number, value: number, overrides: Partial<Record<string, (number | null)[]>> = {}): StationWeatherFile => {
  const filled = Array<number>(days).fill(value);
  return {
    stationId,
    generatedAt: "",
    startMonthDay: "07-01",
    years: {
      [year]: { avgTa: filled, minTa: filled, maxTa: filled, sumRn: filled, avgRhm: filled, avgTs: filled, ...overrides },
    },
  };
};

describe("stationsForUnions", () => {
  it("같은 관측소를 쓰는 조합을 묶는다 (고성·양양 → 속초)", () => {
    const stations = stationsForUnions(["고성", "양양", "봉화"]);
    expect(stations.map((s) => s.stationId)).toEqual([90, 271]);
    expect(stations[0].unions).toEqual(["고성", "양양"]);
    expect(stations[0].isSubstitute).toBe(true);
  });

  it("동명 지점과 대체 지점이 같은 관측소면 대체 표시를 끈다 (인제·양구 → 인제)", () => {
    expect(stationsForUnions(["양구", "인제"])[0].isSubstitute).toBe(false);
  });

  it("매핑 없는 조합은 무시", () => {
    expect(stationsForUnions(["없는조합"])).toEqual([]);
  });
});

describe("buildSeasonWeather", () => {
  it("여러 지점은 날마다 평균한다", () => {
    const [day] = buildSeasonWeather([file(1, 2025, 153, 10), file(2, 2025, 153, 20)], ["2025-09-01"]);
    expect(day.avgTa).toBe(15);
    expect(day.rain).toBe(15);
  });

  it("결측 지점은 평균에서 뺀다", () => {
    const missing = file(2, 2025, 153, 20, { avgTa: Array<number | null>(153).fill(null) });
    expect(buildSeasonWeather([file(1, 2025, 153, 10), missing], ["2025-09-01"])[0].avgTa).toBe(10);
  });

  it("3주 전 7일 누적 강수 — 22~28일 전 합", () => {
    const rain = Array<number>(153).fill(0);
    // 09-01 은 07-01 기준 인덱스 62 → 22~28일 전 = 인덱스 34~40
    for (let i = 34; i <= 40; i++) rain[i] = 2;
    rain[33] = 100;
    rain[41] = 100;
    const [day] = buildSeasonWeather([file(1, 2025, 153, 0, { sumRn: rain })], ["2025-09-01"]);
    expect(day.lagRain).toBe(14);
  });

  it("22일 전 하루 강수를 옮겨 붙인다", () => {
    const rain = Array<number>(153).fill(0);
    rain[62 - 22] = 31;
    const [day] = buildSeasonWeather([file(1, 2025, 153, 0, { sumRn: rain })], ["2025-09-01"]);
    expect(day.shiftedRain).toBe(31);
  });

  it("수집 창 밖이나 없는 연도는 null", () => {
    const [outside, noYear] = buildSeasonWeather([file(1, 2025, 153, 10)], ["2025-12-05", "2024-09-01"]);
    expect(outside.avgTa).toBeNull();
    expect(noYear.avgTa).toBeNull();
  });
});
