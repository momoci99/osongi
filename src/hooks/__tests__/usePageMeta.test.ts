import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import usePageMeta from "../usePageMeta";
import { PAGE_META } from "../../const/Seo";
import { SITE_URL } from "../../const/Site";

const getMetaContent = (selector: string): string | null =>
  document.head.querySelector(selector)?.getAttribute("content") ?? null;

describe("usePageMeta", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "";
  });

  it("title과 description을 페이지 메타로 갱신한다", () => {
    renderHook(() => usePageMeta(PAGE_META.dataAnalysis));

    expect(document.title).toBe(PAGE_META.dataAnalysis.title);
    expect(getMetaContent('meta[name="description"]')).toBe(
      PAGE_META.dataAnalysis.description
    );
  });

  it("canonical을 해당 라우트의 절대 URL로 설정한다", () => {
    renderHook(() => usePageMeta(PAGE_META.dataAnalysis));

    const canonical = document.head.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute("href")).toBe(`${SITE_URL}/data-analysis`);
  });

  it("OG·트위터 태그를 함께 갱신한다", () => {
    renderHook(() => usePageMeta(PAGE_META.dashboard));

    expect(getMetaContent('meta[property="og:title"]')).toBe(
      PAGE_META.dashboard.title
    );
    expect(getMetaContent('meta[property="og:url"]')).toBe(`${SITE_URL}/`);
    expect(getMetaContent('meta[name="twitter:description"]')).toBe(
      PAGE_META.dashboard.description
    );
  });

  it("기존 태그를 새로 만들지 않고 재사용한다", () => {
    document.head.innerHTML =
      '<meta name="description" content="이전 설명" /><link rel="canonical" href="https://osongi.vercel.app/" />';

    renderHook(() => usePageMeta(PAGE_META.dataAnalysis));

    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });
});
