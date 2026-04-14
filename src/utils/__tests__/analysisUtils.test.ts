import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDefaultDateRange,
  generateDateRange,
  isMushroomSeason,
  getDateOnly,
  isSameDate,
  isDateInRange,
  applyFilters,
  calculateKPI,
  calculateKPIComparison,
  calculateGradeBreakdown,
  transformToScatterData,
  calculateRegionComparison,
  getComparisonDateRange,
  transformToChartData,
  convertAuctionRecordToRaw,
} from "../analysisUtils";
import type { AnalysisFilters } from "../analysisUtils";
import {
  createMockAuctionRecord,
  createMockAuctionDBRecord,
  SAMPLE_GRADES,
} from "./fixtures";

/** getDefaultDateRange */
describe("getDefaultDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("시즌 중(8월)이면 최근 7일 범위를 반환한다", () => {
    vi.setSystemTime(new Date(2024, 7, 15)); // 8월 15일
    const { startDate, endDate } = getDefaultDateRange();
    expect(endDate.getMonth()).toBe(7); // 8월
    expect(endDate.getDate()).toBe(15);
    expect(startDate.getDate()).toBe(9); // 15 - 6 = 9
  });

  it("시즌 중(10월)이면 최근 7일 범위를 반환한다", () => {
    vi.setSystemTime(new Date(2024, 9, 20)); // 10월 20일
    const { startDate, endDate } = getDefaultDateRange();
    expect(endDate.getDate()).toBe(20);
    expect(startDate.getDate()).toBe(14);
  });

  it("시즌 중(12월)이면 최근 7일 범위를 반환한다", () => {
    vi.setSystemTime(new Date(2024, 11, 15)); // 12월 15일
    const { startDate, endDate } = getDefaultDateRange();
    expect(endDate.getMonth()).toBe(11);
    expect(endDate.getDate()).toBe(15);
    expect(startDate.getDate()).toBe(9); // 15 - 6 = 9
  });

  it("시즌 외(1월)이면 작년 10월 1~7일을 반환한다", () => {
    vi.setSystemTime(new Date(2025, 0, 15)); // 1월 15일
    const { startDate, endDate } = getDefaultDateRange();
    expect(startDate.getFullYear()).toBe(2024);
    expect(startDate.getMonth()).toBe(9); // 10월
    expect(startDate.getDate()).toBe(1);
    expect(endDate.getDate()).toBe(7);
  });

  it("시즌 외(7월)이면 작년 10월 1~7일을 반환한다", () => {
    vi.setSystemTime(new Date(2025, 6, 1)); // 7월 1일
    const { startDate, endDate } = getDefaultDateRange();
    expect(startDate.getFullYear()).toBe(2024);
    expect(startDate.getMonth()).toBe(9);
    expect(startDate.getDate()).toBe(1);
    expect(endDate.getDate()).toBe(7);
  });
});

/** generateDateRange */
describe("generateDateRange", () => {
  it("3일 범위에서 3개의 Date를 반환한다", () => {
    const start = new Date(2024, 9, 1);
    const end = new Date(2024, 9, 3);
    const result = generateDateRange(start, end);
    expect(result).toHaveLength(3);
    expect(result[0].getDate()).toBe(1);
    expect(result[2].getDate()).toBe(3);
  });

  it("같은 날이면 1개를 반환한다", () => {
    const date = new Date(2024, 9, 1);
    const result = generateDateRange(date, date);
    expect(result).toHaveLength(1);
  });

  it("start > end이면 빈 배열을 반환한다", () => {
    const start = new Date(2024, 9, 5);
    const end = new Date(2024, 9, 1);
    const result = generateDateRange(start, end);
    expect(result).toHaveLength(0);
  });

  it("원본 날짜를 변경하지 않는다", () => {
    const start = new Date(2024, 9, 1);
    const end = new Date(2024, 9, 3);
    const startTime = start.getTime();
    generateDateRange(start, end);
    expect(start.getTime()).toBe(startTime);
  });
});

/** isMushroomSeason */
describe("isMushroomSeason", () => {
  it("8월은 시즌이다", () => {
    expect(isMushroomSeason(new Date(2024, 7, 1))).toBe(true);
  });

  it("10월은 시즌이다", () => {
    expect(isMushroomSeason(new Date(2024, 9, 15))).toBe(true);
  });

  it("12월은 시즌이다", () => {
    expect(isMushroomSeason(new Date(2024, 11, 31))).toBe(true);
  });

  it("7월은 시즌이 아니다", () => {
    expect(isMushroomSeason(new Date(2024, 6, 31))).toBe(false);
  });

  it("1월은 시즌이 아니다", () => {
    expect(isMushroomSeason(new Date(2024, 0, 1))).toBe(false);
  });

  it("6월은 시즌이 아니다", () => {
    expect(isMushroomSeason(new Date(2024, 5, 15))).toBe(false);
  });
});

/** getDateOnly */
describe("getDateOnly", () => {
  it("시간을 제거하고 날짜만 반환한다", () => {
    const date = new Date(2024, 9, 1, 14, 30, 45);
    const result = getDateOnly(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it("이미 시간이 0인 경우에도 정상 동작한다", () => {
    const date = new Date(2024, 9, 1, 0, 0, 0);
    const result = getDateOnly(date);
    expect(result.getTime()).toBe(date.getTime());
  });
});

/** isSameDate */
describe("isSameDate", () => {
  it("같은 날 다른 시간이면 true를 반환한다", () => {
    const date1 = new Date(2024, 9, 1, 10, 0);
    const date2 = new Date(2024, 9, 1, 23, 59);
    expect(isSameDate(date1, date2)).toBe(true);
  });

  it("다른 날이면 false를 반환한다", () => {
    const date1 = new Date(2024, 9, 1);
    const date2 = new Date(2024, 9, 2);
    expect(isSameDate(date1, date2)).toBe(false);
  });

  it("같은 날 같은 시간이면 true를 반환한다", () => {
    const date = new Date(2024, 9, 1, 12, 0);
    expect(isSameDate(date, new Date(date))).toBe(true);
  });

  it("다른 월이면 false를 반환한다", () => {
    const date1 = new Date(2024, 9, 1);
    const date2 = new Date(2024, 10, 1);
    expect(isSameDate(date1, date2)).toBe(false);
  });
});

/** isDateInRange */
describe("isDateInRange", () => {
  const start = new Date(2024, 9, 1);
  const end = new Date(2024, 9, 7);

  it("범위 내 날짜면 true를 반환한다", () => {
    expect(isDateInRange(new Date(2024, 9, 3), start, end)).toBe(true);
  });

  it("시작일 경계값이면 true를 반환한다", () => {
    expect(isDateInRange(new Date(2024, 9, 1, 23, 59), start, end)).toBe(true);
  });

  it("종료일 경계값이면 true를 반환한다", () => {
    expect(isDateInRange(new Date(2024, 9, 7, 10, 30), start, end)).toBe(true);
  });

  it("범위 이전이면 false를 반환한다", () => {
    expect(isDateInRange(new Date(2024, 8, 30), start, end)).toBe(false);
  });

  it("범위 이후이면 false를 반환한다", () => {
    expect(isDateInRange(new Date(2024, 9, 8), start, end)).toBe(false);
  });

  it("시간이 다르더라도 같은 날이면 시간을 무시한다", () => {
    const dateWithTime = new Date(2024, 9, 1, 15, 30, 45);
    expect(isDateInRange(dateWithTime, start, end)).toBe(true);
  });
});

/** applyFilters */
describe("applyFilters", () => {
  const baseFilters: AnalysisFilters = {
    regions: [],
    unions: [],
    grades: [],
    startDate: new Date(2024, 9, 1),
    endDate: new Date(2024, 9, 7),
    comparisonEnabled: false,
    comparisonStartDate: null,
    comparisonEndDate: null,
  };

  const data = [
    createMockAuctionRecord({ region: "강원", union: "양양군산림조합", date: "2024-10-01" }),
    createMockAuctionRecord({ region: "경북", union: "울진군산림조합", date: "2024-10-03" }),
    createMockAuctionRecord({ region: "강원", union: "인제군산림조합", date: "2024-10-05" }),
    createMockAuctionRecord({ region: "경남", union: "함양군산림조합", date: "2024-10-10" }),
  ];

  it("빈 필터면 전체 데이터를 반환한다 (날짜 범위 내)", () => {
    const wideFilters = { ...baseFilters, endDate: new Date(2024, 9, 31) };
    const result = applyFilters(data, wideFilters);
    expect(result).toHaveLength(4);
  });

  it("지역 필터를 적용한다", () => {
    const filters = { ...baseFilters, regions: ["강원"], endDate: new Date(2024, 9, 31) };
    const result = applyFilters(data, filters);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.region === "강원")).toBe(true);
  });

  it("조합 필터를 적용한다", () => {
    const filters = { ...baseFilters, unions: ["울진군산림조합"], endDate: new Date(2024, 9, 31) };
    const result = applyFilters(data, filters);
    expect(result).toHaveLength(1);
    expect(result[0].union).toBe("울진군산림조합");
  });

  it("날짜 필터를 적용한다", () => {
    const result = applyFilters(data, baseFilters);
    // 10/1 ~ 10/7 범위 내: 10/01, 10/03, 10/05
    expect(result).toHaveLength(3);
  });

  it("복합 필터를 적용한다 (지역 + 날짜)", () => {
    const filters = { ...baseFilters, regions: ["강원"] };
    const result = applyFilters(data, filters);
    // 강원 + 10/1~10/7: 10/01, 10/05
    expect(result).toHaveLength(2);
  });

  it("일치하는 데이터가 없으면 빈 배열을 반환한다", () => {
    const filters = { ...baseFilters, regions: ["충북"] };
    const result = applyFilters(data, filters);
    expect(result).toHaveLength(0);
  });

  it("복수 지역 필터를 지원한다", () => {
    const filters = { ...baseFilters, regions: ["강원", "경북"], endDate: new Date(2024, 9, 31) };
    const result = applyFilters(data, filters);
    expect(result).toHaveLength(3);
  });
});

/** calculateKPI */
describe("calculateKPI", () => {
  it("가중평균 단가를 정확히 계산한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "10", unitPrice: "100,000" },
        grade2: { quantity: "20", unitPrice: "50,000" },
      }),
    ];
    const result = calculateKPI(data, SAMPLE_GRADES);
    // 가중평균: (100000*10 + 50000*20) / (10+20) = 2000000/30 ≈ 66667
    expect(result.avgPrice).toBe(Math.round(2000000 / 30));
    expect(result.totalQuantity).toBe(30);
  });

  it("빈 데이터면 0을 반환한다", () => {
    const result = calculateKPI([], SAMPLE_GRADES);
    expect(result.avgPrice).toBe(0);
    expect(result.totalQuantity).toBe(0);
    expect(result.maxPrice.value).toBe(0);
    expect(result.minPrice.value).toBe(0);
    expect(result.tradingDays).toBe(0);
  });

  it("minPrice 초기값(Infinity)이 데이터 없을 때 0으로 처리된다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "0", unitPrice: "0" },
      }),
    ];
    const result = calculateKPI(data, ["grade1"]);
    expect(result.minPrice.value).toBe(0);
  });

  it("maxPrice를 정확히 추적한다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        grade1: { quantity: "5", unitPrice: "200,000" },
      }),
      createMockAuctionRecord({
        date: "2024-10-02",
        grade1: { quantity: "10", unitPrice: "150,000" },
      }),
    ];
    const result = calculateKPI(data, ["grade1"]);
    expect(result.maxPrice.value).toBe(200000);
    expect(result.maxPrice.date).toBe("2024-10-01");
  });

  it("minPrice를 정확히 추적한다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        grade1: { quantity: "5", unitPrice: "200,000" },
      }),
      createMockAuctionRecord({
        date: "2024-10-02",
        grade1: { quantity: "10", unitPrice: "150,000" },
      }),
    ];
    const result = calculateKPI(data, ["grade1"]);
    expect(result.minPrice.value).toBe(150000);
    expect(result.minPrice.date).toBe("2024-10-02");
  });

  it("거래일수를 정확히 센다", () => {
    const data = [
      createMockAuctionRecord({ date: "2024-10-01", grade1: { quantity: "5", unitPrice: "100,000" } }),
      createMockAuctionRecord({ date: "2024-10-01", grade1: { quantity: "3", unitPrice: "90,000" } }),
      createMockAuctionRecord({ date: "2024-10-02", grade1: { quantity: "10", unitPrice: "110,000" } }),
    ];
    const result = calculateKPI(data, ["grade1"]);
    expect(result.tradingDays).toBe(2); // 중복 날짜 제외
  });

  it("콤마 포함 문자열을 올바르게 파싱한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "1,000", unitPrice: "100,000" },
      }),
    ];
    const result = calculateKPI(data, ["grade1"]);
    expect(result.totalQuantity).toBe(1000);
    expect(result.avgPrice).toBe(100000);
  });

  it("quantity=0이면 해당 등급을 무시한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "10", unitPrice: "100,000" },
        grade2: { quantity: "0", unitPrice: "50,000" },
      }),
    ];
    const result = calculateKPI(data, SAMPLE_GRADES);
    expect(result.totalQuantity).toBe(10);
    expect(result.avgPrice).toBe(100000);
  });
});

/** calculateKPIComparison */
describe("calculateKPIComparison", () => {
  const makeKPI = (avgPrice: number, totalQuantity: number) => ({
    avgPrice,
    totalQuantity,
    maxPrice: { value: avgPrice, date: "2024-10-01", grade: "grade1" },
    minPrice: { value: avgPrice, date: "2024-10-01", grade: "grade1" },
    tradingDays: 5,
  });

  it("변동률을 정확히 계산한다", () => {
    const current = makeKPI(110000, 200);
    const previous = makeKPI(100000, 100);
    const result = calculateKPIComparison(current, previous);
    expect(result.changes.avgPrice).toBe(10); // (110000-100000)/100000*100
    expect(result.changes.totalQuantity).toBe(100); // (200-100)/100*100
  });

  it("previous=0이면 변동률 0을 반환한다", () => {
    const current = makeKPI(100000, 100);
    const previous = makeKPI(0, 0);
    const result = calculateKPIComparison(current, previous);
    expect(result.changes.avgPrice).toBe(0);
    expect(result.changes.totalQuantity).toBe(0);
  });

  it("current와 previous 객체를 그대로 포함한다", () => {
    const current = makeKPI(110000, 200);
    const previous = makeKPI(100000, 100);
    const result = calculateKPIComparison(current, previous);
    expect(result.current).toBe(current);
    expect(result.previous).toBe(previous);
  });

  it("음수 변동률을 정확히 계산한다", () => {
    const current = makeKPI(90000, 80);
    const previous = makeKPI(100000, 100);
    const result = calculateKPIComparison(current, previous);
    expect(result.changes.avgPrice).toBe(-10);
    expect(result.changes.totalQuantity).toBe(-20);
  });
});

/** calculateGradeBreakdown */
describe("calculateGradeBreakdown", () => {
  it("등급별 비중 합이 1.0이다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "10", unitPrice: "100,000" },
        grade2: { quantity: "20", unitPrice: "50,000" },
      }),
    ];
    const result = calculateGradeBreakdown(data, SAMPLE_GRADES);
    const totalQuantityRatio = result.reduce((sum, g) => sum + g.quantityRatio, 0);
    const totalAmountRatio = result.reduce((sum, g) => sum + g.amountRatio, 0);
    expect(totalQuantityRatio).toBeCloseTo(1.0);
    expect(totalAmountRatio).toBeCloseTo(1.0);
  });

  it("수량 0인 등급은 제외한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "10", unitPrice: "100,000" },
        grade2: { quantity: "0", unitPrice: "50,000" },
      }),
    ];
    const result = calculateGradeBreakdown(data, SAMPLE_GRADES);
    expect(result).toHaveLength(1);
    expect(result[0].gradeKey).toBe("grade1");
  });

  it("빈 데이터면 빈 배열을 반환한다", () => {
    const result = calculateGradeBreakdown([], SAMPLE_GRADES);
    expect(result).toHaveLength(0);
  });

  it("금액 비중을 정확히 계산한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "10", unitPrice: "100,000" },
        grade2: { quantity: "10", unitPrice: "50,000" },
      }),
    ];
    const result = calculateGradeBreakdown(data, SAMPLE_GRADES);
    // grade1 금액: 10*100000=1000000, grade2 금액: 10*50000=500000
    const grade1 = result.find((g) => g.gradeKey === "grade1")!;
    expect(grade1.amountRatio).toBeCloseTo(1000000 / 1500000);
  });
});

/** transformToScatterData */
describe("transformToScatterData", () => {
  it("유효 데이터만 변환한다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        grade1: { quantity: "10", unitPrice: "100,000" },
        grade2: { quantity: "0", unitPrice: "50,000" },
      }),
    ];
    const result = transformToScatterData(data, SAMPLE_GRADES);
    expect(result).toHaveLength(1);
    expect(result[0].gradeKey).toBe("grade1");
  });

  it("quantity=0이면 제외한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "0", unitPrice: "100,000" },
      }),
    ];
    const result = transformToScatterData(data, ["grade1"]);
    expect(result).toHaveLength(0);
  });

  it("unitPrice=0이면 제외한다", () => {
    const data = [
      createMockAuctionRecord({
        grade1: { quantity: "10", unitPrice: "0" },
      }),
    ];
    const result = transformToScatterData(data, ["grade1"]);
    expect(result).toHaveLength(0);
  });

  it("date가 없으면 제외한다", () => {
    const data = [
      createMockAuctionRecord({
        date: undefined,
        grade1: { quantity: "10", unitPrice: "100,000" },
      }),
    ];
    const result = transformToScatterData(data, ["grade1"]);
    expect(result).toHaveLength(0);
  });

  it("올바른 필드를 포함한다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        region: "강원",
        union: "양양군산림조합",
        grade1: { quantity: "10", unitPrice: "100,000" },
      }),
    ];
    const result = transformToScatterData(data, ["grade1"]);
    expect(result[0]).toEqual({
      date: "2024-10-01",
      region: "강원",
      union: "양양군산림조합",
      gradeKey: "grade1",
      quantityKg: 10,
      unitPriceWon: 100000,
    });
  });
});

/** calculateRegionComparison */
describe("calculateRegionComparison", () => {
  it("지역별 가중평균을 계산한다", () => {
    const data = [
      createMockAuctionRecord({
        region: "강원",
        grade1: { quantity: "10", unitPrice: "100,000" },
      }),
      createMockAuctionRecord({
        region: "경북",
        grade1: { quantity: "20", unitPrice: "80,000" },
      }),
    ];
    const result = calculateRegionComparison(data, ["grade1"]);
    expect(result).toHaveLength(2);
    expect(result[0].region).toBe("강원"); // 100,000 > 80,000
    expect(result[0].avgPrice).toBe(100000);
    expect(result[1].region).toBe("경북");
    expect(result[1].avgPrice).toBe(80000);
  });

  it("avgPrice 내림차순으로 정렬한다", () => {
    const data = [
      createMockAuctionRecord({ region: "경남", grade1: { quantity: "10", unitPrice: "50,000" } }),
      createMockAuctionRecord({ region: "강원", grade1: { quantity: "10", unitPrice: "200,000" } }),
      createMockAuctionRecord({ region: "경북", grade1: { quantity: "10", unitPrice: "100,000" } }),
    ];
    const result = calculateRegionComparison(data, ["grade1"]);
    expect(result[0].region).toBe("강원");
    expect(result[1].region).toBe("경북");
    expect(result[2].region).toBe("경남");
  });

  it("빈 데이터면 빈 배열을 반환한다", () => {
    const result = calculateRegionComparison([], ["grade1"]);
    expect(result).toHaveLength(0);
  });

  it("같은 지역의 여러 레코드를 합산한다", () => {
    const data = [
      createMockAuctionRecord({ region: "강원", grade1: { quantity: "10", unitPrice: "100,000" } }),
      createMockAuctionRecord({ region: "강원", grade1: { quantity: "10", unitPrice: "200,000" } }),
    ];
    const result = calculateRegionComparison(data, ["grade1"]);
    expect(result).toHaveLength(1);
    // 가중평균: (100000*10 + 200000*10) / 20 = 150000
    expect(result[0].avgPrice).toBe(150000);
    expect(result[0].totalQuantity).toBe(20);
  });
});

/** getComparisonDateRange */
describe("getComparisonDateRange", () => {
  it("1년 전 동일 날짜를 반환한다", () => {
    const start = new Date(2024, 9, 1);
    const end = new Date(2024, 9, 7);
    const result = getComparisonDateRange(start, end);
    expect(result.startDate.getFullYear()).toBe(2023);
    expect(result.startDate.getMonth()).toBe(9);
    expect(result.startDate.getDate()).toBe(1);
    expect(result.endDate.getFullYear()).toBe(2023);
    expect(result.endDate.getDate()).toBe(7);
  });

  it("원본 날짜를 변경하지 않는다", () => {
    const start = new Date(2024, 9, 1);
    const end = new Date(2024, 9, 7);
    const startTime = start.getTime();
    const endTime = end.getTime();
    getComparisonDateRange(start, end);
    expect(start.getTime()).toBe(startTime);
    expect(end.getTime()).toBe(endTime);
  });
});

/** transformToChartData */
describe("transformToChartData", () => {
  it("날짜순으로 정렬한다", () => {
    const data = [
      createMockAuctionRecord({ date: "2024-10-03", grade1: { quantity: "10", unitPrice: "100,000" } }),
      createMockAuctionRecord({ date: "2024-10-01", grade1: { quantity: "5", unitPrice: "90,000" } }),
      createMockAuctionRecord({ date: "2024-10-02", grade1: { quantity: "8", unitPrice: "95,000" } }),
    ];
    const result = transformToChartData(data, ["grade1"]);
    expect(result[0].date).toBe("2024-10-01");
    expect(result[1].date).toBe("2024-10-02");
    expect(result[2].date).toBe("2024-10-03");
  });

  it("콤마 포함 숫자를 올바르게 파싱한다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        grade1: { quantity: "1,000", unitPrice: "100,000" },
      }),
    ];
    const result = transformToChartData(data, ["grade1"]);
    expect(result[0].quantityKg).toBe(1000);
    expect(result[0].unitPriceWon).toBe(100000);
  });

  it("중복 키(같은 date-region-union)를 처리한다", () => {
    const data = [
      createMockAuctionRecord({ date: "2024-10-01", region: "강원", union: "양양군산림조합", grade1: { quantity: "10", unitPrice: "100,000" } }),
      createMockAuctionRecord({ date: "2024-10-01", region: "강원", union: "양양군산림조합", grade1: { quantity: "20", unitPrice: "80,000" } }),
    ];
    const result = transformToChartData(data, ["grade1"]);
    // 중복 키는 마지막 레코드로 덮어씀 (Map 특성)
    expect(result).toHaveLength(1);
  });

  it("유효하지 않은 데이터(quantity=0)를 제외한다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        grade1: { quantity: "0", unitPrice: "100,000" },
      }),
    ];
    const result = transformToChartData(data, ["grade1"]);
    expect(result).toHaveLength(0);
  });

  it("빈 데이터면 빈 배열을 반환한다", () => {
    const result = transformToChartData([], ["grade1"]);
    expect(result).toHaveLength(0);
  });

  it("여러 등급을 동시에 처리한다", () => {
    const data = [
      createMockAuctionRecord({
        date: "2024-10-01",
        grade1: { quantity: "10", unitPrice: "100,000" },
        grade2: { quantity: "20", unitPrice: "50,000" },
      }),
    ];
    const result = transformToChartData(data, SAMPLE_GRADES);
    expect(result).toHaveLength(2);
  });
});

/** convertAuctionRecordToRaw */
describe("convertAuctionRecordToRaw", () => {
  it("필드를 올바르게 매핑한다", () => {
    const dbRecord = createMockAuctionDBRecord();
    const raw = convertAuctionRecordToRaw(dbRecord);
    expect(raw.region).toBe(dbRecord.region);
    expect(raw.union).toBe(dbRecord.union);
    expect(raw.date).toBe(dbRecord.date);
  });

  it("숫자를 문자열로 변환한다", () => {
    const dbRecord = createMockAuctionDBRecord({
      grade1Quantity: 100,
      grade1UnitPrice: 200000,
    });
    const raw = convertAuctionRecordToRaw(dbRecord);
    expect(raw.grade1.quantity).toBe("100");
    expect(raw.grade1.unitPrice).toBe("200000");
  });

  it("모든 등급 필드를 변환한다", () => {
    const dbRecord = createMockAuctionDBRecord({
      grade2Quantity: 15,
      grade2UnitPrice: 80000,
      grade3StoppedQuantity: 5,
      grade3StoppedUnitPrice: 40000,
      mixedGradeQuantity: 30,
      mixedGradeUnitPrice: 20000,
    });
    const raw = convertAuctionRecordToRaw(dbRecord);
    expect(raw.grade2.quantity).toBe("15");
    expect(raw.grade3Stopped.quantity).toBe("5");
    expect(raw.mixedGrade.quantity).toBe("30");
    expect(raw.mixedGrade.unitPrice).toBe("20000");
  });

  it("공판량/공판금액 필드를 변환한다", () => {
    const dbRecord = createMockAuctionDBRecord({
      auctionQuantityTotal: 500,
      auctionAmountTotal: 10000000,
    });
    const raw = convertAuctionRecordToRaw(dbRecord);
    expect(raw.auctionQuantity.total).toBe("500");
    expect(raw.auctionAmount.total).toBe("10000000");
  });
});
