import { describe, it, expect } from "vitest";
import { PAGE_META, regionPageMeta, unionPageMeta, toCanonicalUrl } from "../Seo";
import { SITE_URL } from "../Site";
import { regionPath, unionPath } from "../Regions";
import { toScopeMetaFacts } from "../../utils/regionNarrative";
import { makeScopeStats } from "../../test-fixtures/region";

const facts = toScopeMetaFacts(makeScopeStats());

describe("regionPageMeta", () => {
  it("지역명을 제목 앞에 두고 경로를 그대로 유지한다", () => {
    const meta = regionPageMeta("경북", regionPath("경북"), facts);

    expect(meta.title).toBe("경북 송이버섯 공판 시세 | 오송이");
    expect(meta.path).toBe("/region/경북");
  });

  it("설명에 시즌 지표를 넣는다", () => {
    const meta = regionPageMeta("경북", regionPath("경북"), facts);

    expect(meta.description).toContain("2025 시즌 평균 kg당 300,000원");
    expect(meta.description).toContain("최고 820,000원");
    expect(meta.description).toContain("공판량 12,000kg");
    expect(meta.description).toContain("2023년부터의");
  });

  it("지표가 없으면 숫자 없이 설명을 만든다", () => {
    const meta = regionPageMeta("경남", regionPath("경남"));

    expect(meta.description).toContain("경남 지역 송이버섯 공판 시세.");
    expect(meta.description).toContain("역대");
    expect(meta.description).not.toMatch(/\d/);
  });
});

describe("unionPageMeta", () => {
  it("제목에 조합명과 소속 지역을 함께 담는다", () => {
    const meta = unionPageMeta("경북", "봉화", unionPath("경북", "봉화"), facts);

    expect(meta.title).toBe("봉화 송이 시세 (경북 봉화산림조합) | 오송이");
    expect(meta.path).toBe("/region/경북/봉화");
    expect(meta.description).toContain("경북 봉화산림조합 송이버섯 공판 시세.");
    expect(meta.description).toContain("2025 시즌 평균 kg당 300,000원");
  });
});

describe("toCanonicalUrl", () => {
  it("허브 경로를 절대 URL로 바꾼다", () => {
    expect(toCanonicalUrl(PAGE_META.regionIndex.path)).toBe(`${SITE_URL}/region`);
  });
});
