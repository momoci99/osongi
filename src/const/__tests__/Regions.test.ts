import { describe, it, expect } from "vitest";
import { AVAILABLE_REGIONS, REGION_UNION_MAP } from "../Common";
import {
  SCOPE_ROUTES,
  encodeRoute,
  findRegionOfUnion,
  isRegionName,
  isUnionOfRegion,
  regionPath,
  siblingUnions,
  unionPath,
} from "../Regions";

describe("지역 경로 생성", () => {
  it("지역·조합 경로를 한글 그대로 만든다", () => {
    expect(regionPath("경북")).toBe("/region/경북");
    expect(unionPath("경북", "봉화")).toBe("/region/경북/봉화");
  });

  it("sitemap·canonical 용으로만 퍼센트 인코딩한다", () => {
    expect(encodeRoute("/region/경북/봉화")).toBe(
      `/region/${encodeURIComponent("경북")}/${encodeURIComponent("봉화")}`
    );
  });

  it("인코딩 결과를 디코딩하면 원래 경로로 돌아온다", () => {
    const path = unionPath("강원", "양양");
    expect(decodeURIComponent(encodeRoute(path))).toBe(path);
  });
});

describe("지역·조합 유효성 검사", () => {
  it("등록된 지역만 통과시킨다", () => {
    expect(isRegionName("경북")).toBe(true);
    expect(isRegionName("서울")).toBe(false);
    expect(isRegionName(undefined)).toBe(false);
  });

  it("지역에 실제로 속한 조합만 통과시킨다", () => {
    expect(isUnionOfRegion("강원", "양양")).toBe(true);
    expect(isUnionOfRegion("경북", "양양")).toBe(false);
    expect(isUnionOfRegion("서울", "양양")).toBe(false);
    expect(isUnionOfRegion("강원", undefined)).toBe(false);
  });

  it("조합이 속한 지역을 찾고, 없으면 null을 준다", () => {
    expect(findRegionOfUnion("양양")).toBe("강원");
    expect(findRegionOfUnion("없는조합")).toBeNull();
  });
});

describe("SCOPE_ROUTES", () => {
  const unionCount = AVAILABLE_REGIONS.reduce(
    (sum, region) => sum + REGION_UNION_MAP[region].length,
    0
  );

  it("지역 페이지와 조합 페이지를 모두 포함한다", () => {
    expect(SCOPE_ROUTES).toHaveLength(AVAILABLE_REGIONS.length + unionCount);
  });

  it("경로가 중복되지 않는다", () => {
    const paths = SCOPE_ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("조합 라우트는 소속 지역과 짝이 맞는다", () => {
    for (const route of SCOPE_ROUTES) {
      if (route.union) {
        expect(isUnionOfRegion(route.region, route.union)).toBe(true);
        expect(route.path).toBe(unionPath(route.region, route.union));
      } else {
        expect(route.path).toBe(regionPath(route.region));
      }
    }
  });
});

describe("siblingUnions", () => {
  it("자기 자신을 뺀 같은 지역 조합을 준다", () => {
    const siblings = siblingUnions("강원", "양양");
    expect(siblings).not.toContain("양양");
    expect(siblings).toEqual(
      REGION_UNION_MAP["강원"].filter((name) => name !== "양양")
    );
  });

  it("알 수 없는 지역이면 빈 배열을 준다", () => {
    expect(siblingUnions("서울", "양양")).toEqual([]);
  });
});
