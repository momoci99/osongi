import { describe, expect, it } from "vitest";
import { KMA_DAILY_FIELDS } from "../../../const/Weather";
import type { KmaDailyRow, KmaRawYearFile } from "../kmaAsos";
import { buildStationWeatherFile, toPublicYearValues, weatherWindowDates } from "../publicWeather";

const row = (tm: string, overrides: Partial<KmaDailyRow> = {}): KmaDailyRow => ({
  ...(Object.fromEntries(KMA_DAILY_FIELDS.map((f) => [f, ""])) as KmaDailyRow),
  tm,
  ...overrides,
});

const raw = (year: number, rows: KmaDailyRow[]): KmaRawYearFile => ({
  stationId: 271,
  year,
  startDt: `${year}0701`,
  endDt: `${year}1130`,
  complete: true,
  fetchedAt: "",
  rows,
});

describe("weatherWindowDates", () => {
  it("07-01 ~ 11-30 153일", () => {
    const dates = weatherWindowDates(2025);
    expect(dates).toHaveLength(153);
    expect(dates[0]).toBe("2025-07-01");
    expect(dates.at(-1)).toBe("2025-11-30");
  });

  it("마지막 날짜에서 자른다", () => {
    expect(weatherWindowDates(2026, "2026-07-03")).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"]);
  });
});

describe("toPublicYearValues", () => {
  it("강수 빈 값은 0, 행이 없는 날은 null, 소수 1자리로 반올림", () => {
    const values = toPublicYearValues(
      raw(2026, [row("2026-07-01", { avgTa: "25.94", sumRn: "" }), row("2026-07-03", { avgTa: "24.0", sumRn: "12.3" })]),
    );
    expect(values.avgTa).toEqual([25.9, null, 24]);
    expect(values.sumRn).toEqual([0, null, 12.3]);
  });

  it("전 기간 결측인 필드는 뺀다", () => {
    const values = toPublicYearValues(raw(2026, [row("2026-07-01", { avgTa: "25.0" })]));
    expect(values).not.toHaveProperty("avgCm5Te");
    expect(values).toHaveProperty("avgTa");
  });
});

describe("buildStationWeatherFile", () => {
  it("연도 키로 묶고 시작 월-일을 기록한다", () => {
    const file = buildStationWeatherFile(271, [raw(2025, [row("2025-07-01", { avgTa: "1" })]), raw(2024, [row("2024-07-01", { avgTa: "2" })])], "t");
    expect(Object.keys(file.years)).toEqual(["2024", "2025"]);
    expect(file.startMonthDay).toBe("07-01");
    expect(file.stationId).toBe(271);
  });
});
