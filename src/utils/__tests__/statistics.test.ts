import { describe, it, expect } from "vitest";
import { calculateMovingAverages } from "../analysis/statistics";
import { createMockWeeklyPriceDatum } from "./fixtures";

describe("calculateMovingAverages", () => {
  it("데이터 포인트가 window보다 적으면 null을 반환한다", () => {
    const data = [
      createMockWeeklyPriceDatum({ date: "2024-09-01", unitPriceWon: 100000 }),
      createMockWeeklyPriceDatum({ date: "2024-09-02", unitPriceWon: 200000 }),
    ];

    const result = calculateMovingAverages(data, [7, 14]);

    result.forEach((d) => {
      expect(d.ma7).toBeNull();
      expect(d.ma14).toBeNull();
    });
  });

  it("window=7: 7번째 포인트부터 올바른 평균을 반환한다", () => {
    const prices = [100, 200, 300, 400, 500, 600, 700];
    const data = prices.map((price, i) =>
      createMockWeeklyPriceDatum({
        date: `2024-09-${String(i + 1).padStart(2, "0")}`,
        unitPriceWon: price,
      })
    );

    const result = calculateMovingAverages(data, [7]);
    const last = result[result.length - 1];

    // SMA(7) = (100+200+300+400+500+600+700)/7 = 400
    expect(last.ma7).toBe(400);
  });

  it("window=7: 6번째 이하 포인트는 ma7=null", () => {
    const data = Array.from({ length: 6 }, (_, i) =>
      createMockWeeklyPriceDatum({
        date: `2024-09-${String(i + 1).padStart(2, "0")}`,
        unitPriceWon: 100000,
      })
    );

    const result = calculateMovingAverages(data, [7]);
    result.forEach((d) => expect(d.ma7).toBeNull());
  });

  it("그룹별로 독립적으로 계산한다", () => {
    const grade1Data = Array.from({ length: 7 }, (_, i) =>
      createMockWeeklyPriceDatum({
        date: `2024-09-${String(i + 1).padStart(2, "0")}`,
        gradeKey: "grade1",
        region: "강원",
        unitPriceWon: 100000,
      })
    );
    const grade2Data = Array.from({ length: 3 }, (_, i) =>
      createMockWeeklyPriceDatum({
        date: `2024-09-${String(i + 1).padStart(2, "0")}`,
        gradeKey: "grade2",
        region: "강원",
        unitPriceWon: 50000,
      })
    );

    const result = calculateMovingAverages([...grade1Data, ...grade2Data], [7]);

    const grade1Results = result.filter((d) => d.gradeKey === "grade1");
    const grade2Results = result.filter((d) => d.gradeKey === "grade2");

    // grade1: 7포인트 있으므로 마지막은 ma7 있음
    expect(grade1Results[6].ma7).toBe(100000);
    // grade2: 3포인트만 있으므로 ma7 없음
    grade2Results.forEach((d) => expect(d.ma7).toBeNull());
  });

  it("빈 데이터는 빈 배열을 반환한다", () => {
    expect(calculateMovingAverages([], [7, 14])).toHaveLength(0);
  });

  it("날짜 오름차순 정렬 후 계산한다", () => {
    const data = [
      createMockWeeklyPriceDatum({ date: "2024-09-07", unitPriceWon: 700 }),
      createMockWeeklyPriceDatum({ date: "2024-09-01", unitPriceWon: 100 }),
      createMockWeeklyPriceDatum({ date: "2024-09-04", unitPriceWon: 400 }),
      createMockWeeklyPriceDatum({ date: "2024-09-02", unitPriceWon: 200 }),
      createMockWeeklyPriceDatum({ date: "2024-09-05", unitPriceWon: 500 }),
      createMockWeeklyPriceDatum({ date: "2024-09-03", unitPriceWon: 300 }),
      createMockWeeklyPriceDatum({ date: "2024-09-06", unitPriceWon: 600 }),
    ];

    const result = calculateMovingAverages(data, [7]);
    const sortedResult = [...result].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // SMA(7) at last point = (100+200+300+400+500+600+700)/7 = 400
    expect(sortedResult[6].ma7).toBe(400);
  });
});
