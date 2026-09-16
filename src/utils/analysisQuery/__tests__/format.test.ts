import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatMetricText,
  formatMetricValue,
  formatQuantity,
  formatUnitPrice,
  describeTime,
  formatAxisValue,
} from "../format";

describe("분석 수치 포맷", () => {
  it("단가는 만원/kg 소수 한 자리", () => {
    expect(formatUnitPrice(1_021_562)).toEqual({ value: "102.2", unit: "만원/kg" });
  });

  it("수량은 1톤 기준으로 kg·톤 전환", () => {
    expect(formatQuantity(7.58)).toEqual({ value: "7.6", unit: "kg" });
    expect(formatQuantity(69_420)).toEqual({ value: "69.4", unit: "톤" });
  });

  it("금액은 1억 기준으로 만원·억원 전환", () => {
    expect(formatAmount(10_346_002)).toEqual({ value: "1,035", unit: "만원" });
    expect(formatAmount(715_621_705)).toEqual({ value: "7.2", unit: "억원" });
  });

  it("지표별 분기와 null", () => {
    expect(formatMetricValue("gradeShare", 0.253)).toEqual({ value: "25.3", unit: "%" });
    expect(formatMetricValue("cumQuantity", 1500).unit).toBe("톤");
    expect(formatMetricText("unitPrice", null)).toBe("–");
    expect(formatMetricText("unitPrice", 500_000)).toBe("50.0만원/kg");
  });
});

describe("describeTime", () => {
  it("시즌 선택 설명", () => {
    expect(describeTime({ kind: "seasons", years: [2026] })).toBe("2026 시즌");
    expect(describeTime({ kind: "seasons", years: [2024, 2025, 2026] })).toBe("2024–2026 · 3개 시즌");
    expect(describeTime({ kind: "seasons", years: [2023, 2026] })).toBe("2023, 2026 · 2개 시즌");
  });

  it("기간 설명", () => {
    expect(describeTime({ kind: "range", start: "2025-09-01", end: "2025-10-15" })).toBe(
      "2025.09.01 – 2025.10.15",
    );
  });
});

describe("formatAxisValue", () => {
  it("축 종류별 표시", () => {
    expect(formatAxisValue("date", "2024-09-19", "day")).toBe("2024.09.19");
    expect(formatAxisValue("monthDay", "09-05", "week")).toBe("9/5~");
    expect(formatAxisValue("seasonDay", 8, "day")).toBe("8일차");
    expect(formatAxisValue("year", 2024, "season")).toBe("2024");
  });
});
