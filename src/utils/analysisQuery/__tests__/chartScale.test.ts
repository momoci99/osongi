import { describe, expect, it } from "vitest";
import { buildXMapping, splitByGap, spreadLabels, ticksInDomain } from "../chartScale";

describe("buildXMapping", () => {
  it("달력 기간 축은 시즌 사이를 접어 이어 붙인다", () => {
    const mapping = buildXMapping("date", ["2024-09-19", "2024-10-31", "2025-09-22"], "day");
    const first2025 = mapping.toPosition("2025-09-22");
    const last2024 = mapping.toPosition("2024-10-31");

    expect(mapping.toPosition("2024-09-01")).toBe(0);
    expect(first2025 - last2024).toBeLessThan(91);
    expect(mapping.boundaries).toHaveLength(1);
    expect(mapping.ticks(400).filter((tick) => tick.major).map((tick) => tick.label)).toEqual([
      "2024",
      "2025",
    ]);
  });

  it("좁은 시즌 구간에서는 월 눈금을 생략한다", () => {
    const mapping = buildXMapping("date", ["2024-09-19", "2025-09-22"], "day");
    expect(mapping.ticks(80)).toHaveLength(2);
  });

  it("월일 축은 연도와 무관하게 같은 위치", () => {
    const mapping = buildXMapping("monthDay", ["09-19", "10-01"], "day");
    expect(mapping.toPosition("10-01") - mapping.toPosition("09-19")).toBe(12);
  });

  it("시즌 일차 축은 숫자 그대로, 10일 간격 눈금", () => {
    const mapping = buildXMapping("seasonDay", [1, 5, 32], "day");
    expect(mapping.domain).toEqual([1, 32]);
    expect(mapping.ticks(0).map((tick) => tick.label)).toEqual(["1일차", "10일차", "20일차", "30일차"]);
  });

  it("연도 축은 선을 끊지 않는다", () => {
    expect(buildXMapping("year", [2020, 2024], "season").gapBreak).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("ticksInDomain", () => {
  /** 매핑의 도메인 안 눈금 라벨 */
  const labelsOf = (mapping: ReturnType<typeof buildXMapping>) =>
    ticksInDomain(mapping.ticks(400), mapping.domain).map((tick) => tick.label);

  it("시즌 초 짧은 구간에서도 날짜 라벨을 다른 날로 당기지 않는다 (연도 겹침)", () => {
    const labels = labelsOf(buildXMapping("monthDay", ["09-15", "09-25"], "day"));
    expect(labels).not.toContain("9/1");
    expect(labels).not.toContain("10/1");
    expect(labels).toEqual(expect.arrayContaining(["9/15", "9/20", "9/25"]));
  });

  it("단일 시즌 짧은 구간에도 x 라벨이 생긴다 (추이)", () => {
    const labels = labelsOf(buildXMapping("date", ["2026-09-15", "2026-09-25"], "day"));
    expect(labels).toEqual(expect.arrayContaining(["9/15", "9/20", "9/25"]));
  });

  it("구간이 길면 보충 눈금 없이 월·보름 눈금만 쓴다", () => {
    const labels = labelsOf(buildXMapping("date", ["2025-09-01", "2025-11-30"], "day"));
    expect(labels).toEqual(["9/1", "10/1", "11/1", "9/15", "10/15", "11/15"]);
  });

  it("다시즌 연도 라벨은 데이터 시작이 늦어도 도메인 안에 남는다", () => {
    const mapping = buildXMapping("date", ["2024-09-19", "2025-09-22"], "day");
    const yearTicks = ticksInDomain(mapping.ticks(400), mapping.domain).filter((tick) => tick.major);
    expect(yearTicks.map((tick) => tick.label)).toEqual(["2024", "2025"]);
    expect(yearTicks[0].position).toBe(mapping.domain[0]);
  });
});

describe("splitByGap", () => {
  it("기준보다 긴 공백에서 끊는다", () => {
    const points = [1, 2, 4, 9, 10].map((position) => ({ position }));
    expect(splitByGap(points, 3).map((segment) => segment.map((p) => p.position))).toEqual([
      [1, 2, 4],
      [9, 10],
    ]);
  });
});

describe("spreadLabels", () => {
  it("겹치는 라벨을 아래로 밀고 입력 순서를 유지한다", () => {
    expect(spreadLabels([50, 10, 12], 10)).toEqual([50, 10, 20]);
  });

  it("바닥을 넘으면 위로 되민다", () => {
    expect(spreadLabels([100, 100, 100], 10, 100)).toEqual([80, 90, 100]);
  });
});
