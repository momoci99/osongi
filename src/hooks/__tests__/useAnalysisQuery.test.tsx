import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import type { ReactNode } from "react";
import useAnalysisQuery from "../useAnalysisQuery";

const context = {
  availableYears: [2023, 2024, 2025, 2026],
  inSeason: true,
};

/** 초기 URL을 지정한 라우터 래퍼 */
const withRouter =
  (initialEntry: string) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  );

/** 훅 결과와 현재 location을 함께 관찰 */
const useQueryWithLocation = () => ({
  ...useAnalysisQuery(context),
  location: useLocation(),
});

describe("useAnalysisQuery", () => {
  it("파라미터가 없으면 기본 템플릿을 쓰고 URL은 그대로 둔다", () => {
    const { result } = renderHook(useQueryWithLocation, {
      wrapper: withRouter("/data-analysis"),
    });
    expect(result.current.activeTemplateId).toBe("thisYearVsNormal");
    expect(result.current.location.search).toBe("");
  });

  it("URL 파라미터를 쿼리로 읽는다", () => {
    const { result } = renderHook(useQueryWithLocation, {
      wrapper: withRouter("/data-analysis?view=rank&years=2024&by=union"),
    });
    expect(result.current.query).toMatchObject({
      view: "rank",
      time: { kind: "seasons", years: [2024] },
      groupBy: "union",
    });
  });

  it("부분 갱신은 URL에 전체 쿼리를 기록하고 템플릿 매칭이 풀린다", () => {
    const { result } = renderHook(useQueryWithLocation, {
      wrapper: withRouter("/data-analysis"),
    });

    act(() => result.current.updateQuery({ commonUnitsOnly: true }));

    const params = new URLSearchParams(result.current.location.search);
    expect(params.get("common")).toBe("1");
    expect(params.get("view")).toBe("overlay");
    expect(result.current.activeTemplateId).toBeNull();
  });

  it("템플릿 적용", () => {
    const { result } = renderHook(useQueryWithLocation, {
      wrapper: withRouter("/data-analysis"),
    });

    act(() => result.current.applyTemplate("seasonSummary"));

    expect(result.current.activeTemplateId).toBe("seasonSummary");
    expect(result.current.query.view).toBe("table");
  });
});

describe("useAnalysisQuery 즉시 반영", () => {
  it("URL 반영을 기다리지 않고 같은 렌더에서 새 쿼리를 돌려준다", () => {
    const { result } = renderHook(useQueryWithLocation, {
      wrapper: withRouter("/data-analysis"),
    });

    act(() => result.current.applyTemplate("unionRank"));

    expect(result.current.query.view).toBe("rank");
    expect(result.current.activeTemplateId).toBe("unionRank");
    expect(new URLSearchParams(result.current.location.search).get("view")).toBe("rank");
  });
});
