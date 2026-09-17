import { describe, expect, it } from "vitest";
import { isValidCalendarDate } from "../calendarDate";

describe("isValidCalendarDate", () => {
  it("실제 존재하는 날짜는 true", () => {
    expect(isValidCalendarDate("2023-11-30")).toBe(true);
    expect(isValidCalendarDate("2024-02-29")).toBe(true);
  });

  it("월말을 넘는 날짜는 false", () => {
    expect(isValidCalendarDate("2023-11-31")).toBe(false);
    expect(isValidCalendarDate("2021-09-31")).toBe(false);
    expect(isValidCalendarDate("2023-02-29")).toBe(false);
  });

  it("범위를 벗어난 월·일은 false", () => {
    expect(isValidCalendarDate("2023-13-01")).toBe(false);
    expect(isValidCalendarDate("2023-00-10")).toBe(false);
    expect(isValidCalendarDate("2023-10-00")).toBe(false);
  });

  it("YYYY-MM-DD 형식이 아니면 false", () => {
    expect(isValidCalendarDate("2023-9-1")).toBe(false);
    expect(isValidCalendarDate("20230901")).toBe(false);
    expect(isValidCalendarDate("")).toBe(false);
  });
});
