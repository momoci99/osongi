import { describe, it, expect } from "vitest";
import { resolveDashboardScope, tradedUnionsOf } from "..";
import dayOverDay from "../dayOverDay";
import type { LatestDaily } from "../types";
import type { WeeklyManifest, WeeklyPriceDatum } from "../../../types/data";

const LATEST = "2026-10-05";
const PREV = "2026-10-03";

const row = (gradeKey: string, quantityKg: number, unitPriceWon: number) => ({
  gradeKey,
  quantityKg,
  unitPriceWon,
});

const day = (date: string, rows: ReturnType<typeof row>[]): WeeklyPriceDatum[] =>
  rows.map((r) => ({ date, ...r }));

const nationalComparison = {
  previousDate: PREV,
  gradeChanges: [
    { gradeKey: "grade1", currentPrice: 1, previousPrice: 1, changePercent: 0 },
  ],
};

const latestDaily = {
  totalQuantityTodayKg: 100,
  topRegion: { region: "강원", quantityKg: 60 },
  topUnion: { union: "양양", quantityKg: 40 },
  topGradeByQuantity: { gradeKey: "gradeBelow", quantityKg: 50 },
  gradeBreakdown: [row("gradeBelow", 50, 400000)],
  regionGradeBreakdown: {
    경북: [row("grade1", 10, 500000), row("gradeBelow", 30, 300000)],
  },
  unionGradeBreakdown: {
    봉화: [row("grade1", 10, 500000), row("gradeBelow", 10, 300000)],
    울진: [row("gradeBelow", 25, 300000)],
  },
  previousDayComparison: nationalComparison,
} as unknown as LatestDaily;

const weekly: WeeklyManifest = {
  generatedAt: "",
  weeklyData: day(LATEST, [row("gradeBelow", 50, 400000)]),
  regionWeeklyData: {
    경북: [
      ...day(PREV, [row("gradeBelow", 5, 250000)]),
      ...day(LATEST, [row("grade1", 10, 500000), row("gradeBelow", 30, 300000)]),
    ],
  },
  unionWeeklyData: {
    봉화: day(LATEST, [row("grade1", 10, 500000)]),
  },
};

const resolve = (myRegion: "경북" | "강원" | null, myUnion: string | null = null) =>
  resolveDashboardScope({ latestDaily, latestDate: LATEST, weekly, myRegion, myUnion });

describe("resolveDashboardScope", () => {
  it("지역을 고르지 않으면 전국 데이터와 전국 카드를 쓴다", () => {
    const scope = resolve(null);

    expect(scope.label).toBe("전국");
    expect(scope.gradeRows).toBe(latestDaily.gradeBreakdown);
    expect(scope.dayComparison).toBe(nationalComparison);
    expect(scope.kpis.map((k) => [k.title, k.content])).toEqual([
      ["전국 총 판매량", "100"],
      ["전국 최다 거래 등급", "등외품"],
      ["전국 최대 거래 지역", "강원"],
      ["전국 최대 거래 조합", "양양"],
    ]);
  });

  it("지역을 고르면 지역 합계·평균 단가·지역 1위 조합을 보여준다", () => {
    const scope = resolve("경북");

    expect(scope.label).toBe("경북");
    expect(scope.weekly).toBe(weekly.regionWeeklyData!.경북);
    expect(scope.kpis).toEqual([
      { title: "경북 총 판매량", content: "40", suffix: "kg" },
      { title: "경북 최다 거래 등급", content: "등외품", suffix: undefined },
      { title: "경북 평균 단가", content: "350,000", suffix: "원/kg" },
      { title: "경북 최대 거래 조합", content: "울진" },
    ]);
  });

  it("지역 전일 대비는 전국이 아니라 지역 7일 추이로 계산한다", () => {
    expect(resolve("경북").dayComparison).toEqual({
      previousDate: PREV,
      gradeChanges: [
        { gradeKey: "gradeBelow", currentPrice: 300000, previousPrice: 250000, changePercent: 20 },
      ],
    });
  });

  it("조합을 고르면 조합 카드와 지역 내 순위를 보여준다", () => {
    const scope = resolve("경북", "봉화");

    expect(scope.label).toBe("봉화 조합");
    expect(scope.kpis).toEqual([
      { title: "봉화 조합 총 판매량", content: "20", suffix: "kg" },
      { title: "봉화 조합 최다 거래 등급", content: "1등품", suffix: undefined },
      { title: "봉화 조합 평균 단가", content: "400,000", suffix: "원/kg" },
      { title: "경북 조합 중 판매량 순위", content: "2위", suffix: "/ 거래 2곳" },
    ]);
  });

  it("거래 없는 조합은 빈 표와 거래 없음 카드로 안내한다", () => {
    const scope = resolve("경북", "청송");

    expect(scope.gradeRows).toEqual([]);
    expect(scope.weekly).toEqual([]);
    expect(scope.dayComparison).toBeNull();
    expect(scope.kpis.map((k) => k.content)).toEqual(["0", "—", "—", "거래 없음"]);
  });

  it("다른 지역 조합이 남아 있으면 지역 범위로 돌아간다", () => {
    expect(resolve("경북", "양양").kind).toBe("region");
  });

  it("지역에 거래가 없으면 1위 조합 대신 빈 값", () => {
    expect(resolve("강원").kpis[3]).toEqual({ title: "강원 최대 거래 조합", content: "—" });
  });
});

describe("dayOverDay", () => {
  it("직전 거래일이 없으면 null", () => {
    expect(dayOverDay(day(LATEST, [row("grade1", 1, 100)]), LATEST)).toBeNull();
  });

  it("두 날 모두 거래된 등급이 없으면 null", () => {
    const data = [
      ...day(PREV, [row("grade2", 1, 100)]),
      ...day(LATEST, [row("grade1", 1, 100)]),
    ];
    expect(dayOverDay(data, LATEST)).toBeNull();
  });

  it("변동률을 소수 둘째 자리로 반올림한다", () => {
    const data = [
      ...day(PREV, [row("grade1", 1, 300)]),
      ...day(LATEST, [row("grade1", 1, 400)]),
    ];
    expect(dayOverDay(data, LATEST)?.gradeChanges[0].changePercent).toBe(33.33);
  });
});

describe("tradedUnionsOf", () => {
  it("거래가 있었던 조합 이름을 돌려준다", () => {
    expect(tradedUnionsOf(latestDaily)).toEqual(["봉화", "울진"]);
  });

  it("조합 집계가 없는 옛 매니페스트면 빈 목록", () => {
    expect(tradedUnionsOf({} as LatestDaily)).toEqual([]);
  });
});
