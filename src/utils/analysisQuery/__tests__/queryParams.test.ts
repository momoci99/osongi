import { describe, expect, it } from "vitest";
import { parseAnalysisQuery, serializeAnalysisQuery } from "../queryParams";
import { makeQuery } from "./fixtures";

describe("URL 쿼리 직렬화", () => {
  it("직렬화 후 파싱하면 원래 쿼리로 돌아온다", () => {
    const query = makeQuery({
      view: "overlay",
      time: { kind: "seasons", years: [2023, 2026] },
      align: "seasonDay",
      regions: ["경북"],
      unions: ["봉화", "울진"],
      grades: ["grade1", "grade2"],
      metric: "cumQuantity",
      groupBy: "year",
      granularity: "week",
      compare: "normal",
      commonUnitsOnly: true,
    });
    const params = new URLSearchParams(serializeAnalysisQuery(query).toString());
    expect(parseAnalysisQuery(params, makeQuery())).toEqual(query);
  });

  it("달력 기간도 왕복한다", () => {
    const query = makeQuery({ time: { kind: "range", start: "2025-09-01", end: "2025-10-15" } });
    expect(parseAnalysisQuery(serializeAnalysisQuery(query), makeQuery())).toEqual(query);
  });

  it("전체 등급은 all 토큰으로 표현한다", () => {
    const params = serializeAnalysisQuery(makeQuery({ grades: [] }));
    expect(params.get("grades")).toBe("all");
    expect(parseAnalysisQuery(params, makeQuery({ grades: ["grade1"] })).grades).toEqual([]);
  });

  it("잘못된 값은 파라미터 단위로 폴백한다", () => {
    const fallback = makeQuery();
    const params = new URLSearchParams(
      "view=pie&years=abc,2025&from=2025-11-31&to=2025-12-01&grades=grade9&metric=quantity",
    );
    expect(parseAnalysisQuery(params, fallback)).toEqual({
      ...fallback,
      time: { kind: "seasons", years: [2025] },
      metric: "quantity",
    });
  });

  it("파라미터가 없으면 폴백 그대로", () => {
    const fallback = makeQuery({ view: "heatmap" });
    expect(parseAnalysisQuery(new URLSearchParams(), fallback)).toEqual(fallback);
  });
});

describe("파싱 결과 참조 공유", () => {
  it("같은 URL은 같은 객체, 다른 URL이라도 같은 조각은 같은 참조", () => {
    const fallback = makeQuery();
    const a = parseAnalysisQuery(new URLSearchParams("view=rank&regions=경북&years=2024"), fallback);
    const b = parseAnalysisQuery(new URLSearchParams("view=rank&regions=경북&years=2024"), fallback);
    const c = parseAnalysisQuery(new URLSearchParams("view=table&regions=경북&years=2024"), fallback);

    expect(b).toBe(a);
    expect(c).not.toBe(a);
    expect(c.regions).toBe(a.regions);
    expect(c.time).toBe(a.time);
  });
});
