import { describe, it, expect } from "vitest";
import {
  buildScopeNarrative,
  scopeLabel,
  toScopeMetaFacts,
} from "../regionNarrative";
import { makeScopeStats } from "../../test-fixtures/region";

describe("scopeLabel", () => {
  it("조합은 지역명을 앞에 붙인다", () => {
    expect(scopeLabel(makeScopeStats())).toBe("경북 봉화");
  });

  it("지역 페이지는 지역명만 쓴다", () => {
    expect(scopeLabel(makeScopeStats({ name: "경북", region: "경북" }))).toBe(
      "경북"
    );
  });
});

describe("toScopeMetaFacts", () => {
  it("메타 문구에 필요한 지표만 뽑는다", () => {
    expect(toScopeMetaFacts(makeScopeStats())).toEqual({
      seasonYear: 2025,
      avgPricePerKg: 300000,
      peakPriceWon: 820000,
      totalQuantityKg: 12000,
      firstYear: 2023,
    });
  });

  it("집계가 없으면 null로 채운다", () => {
    const facts = toScopeMetaFacts(
      makeScopeStats({ season: null, peak: null, yearly: [] })
    );

    expect(facts).toEqual({
      seasonYear: 2025,
      avgPricePerKg: null,
      peakPriceWon: null,
      totalQuantityKg: null,
      firstYear: null,
    });
  });
});

describe("buildScopeNarrative", () => {
  it("시즌 실적을 문장으로 풀어 쓴다", () => {
    const [seasonParagraph] = buildScopeNarrative(makeScopeStats());

    expect(seasonParagraph).toContain("경북 봉화산림조합");
    expect(seasonParagraph).toContain("2025-09-22부터 2025-11-12까지");
    expect(seasonParagraph).toContain("12,000kg");
    expect(seasonParagraph).toContain("300,000원");
  });

  it("지역 페이지는 '지역'으로 지칭한다", () => {
    const [seasonParagraph] = buildScopeNarrative(
      makeScopeStats({ name: "경북", region: "경북" })
    );

    expect(seasonParagraph).toContain("경북 지역");
    expect(seasonParagraph).not.toContain("산림조합");
  });

  it("최고 단가 등급과 시즌 최고가를 함께 알린다", () => {
    const paragraphs = buildScopeNarrative(makeScopeStats());

    expect(paragraphs[1]).toContain("1등품");
    expect(paragraphs[1]).toContain("820,000원");
    expect(paragraphs[1]).toContain("2025-09-30");
  });

  it("연도 추이와 전국 순위를 덧붙인다", () => {
    const paragraphs = buildScopeNarrative(makeScopeStats());

    expect(paragraphs[2]).toContain("2023년부터 2025년까지 3개 시즌");
    expect(paragraphs[2]).toContain("2024년");
    expect(paragraphs[3]).toContain("21개 조합 중 3위");
  });

  it("시즌 집계가 없으면 미집계 문장으로 대체한다", () => {
    const [first] = buildScopeNarrative(
      makeScopeStats({ season: null, peak: null, quantityRank: undefined })
    );

    expect(first).toContain("아직 집계되지 않았습니다");
  });

  it("연도 기록이 1개뿐이면 추이 문단을 만들지 않는다", () => {
    const paragraphs = buildScopeNarrative(
      makeScopeStats({
        yearly: [
          {
            year: 2025,
            totalQuantityKg: 12000,
            totalAmountWon: 3600000000,
            avgPricePerKg: 300000,
          },
        ],
      })
    );

    expect(paragraphs.some((text) => text.includes("개 시즌의 공판 기록"))).toBe(
      false
    );
  });
});
