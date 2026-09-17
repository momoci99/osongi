import { afterEach, describe, expect, it, vi } from "vitest";
import { makeQuery } from "../../utils/analysisQuery/__tests__/fixtures";
import type { ExplorerData } from "../../utils/analysisQuery/explorerData";

const request = vi.fn();

vi.mock("../analysisClient", () => ({
  getAnalysisClient: () => ({ request }),
}));

/** 모듈 캐시를 비우기 위해 매번 새로 불러온다 */
const importCache = async () => {
  vi.resetModules();
  return import("../explorerDataCache");
};

/** 요청 쿼리로 가짜 결과 생성 */
const respond = (dailyKey = "|") =>
  request.mockImplementation(async ({ query }) => ({
    type: "query",
    id: 1,
    data: { query, dailyKey, dailyQuantity: new Map([["2024-09-20", 1]]) } as unknown as ExplorerData,
  }));

afterEach(() => {
  request.mockReset();
});

describe("explorerDataCache", () => {
  it("같은 쿼리는 진행 중 요청을 공유하고, 끝나면 캐시에서 바로 준다", async () => {
    respond();
    const cache = await importCache();
    const query = makeQuery();

    const [first, second] = await Promise.all([
      cache.fetchExplorerData(query, "v1"),
      cache.fetchExplorerData(query, "v1"),
    ]);

    expect(request).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(cache.getCachedExplorerData(cache.toExplorerDataKey(query, "v1"))).toBe(first);
  });

  it("버전이 다르면 다시 계산한다", async () => {
    respond();
    const cache = await importCache();
    await cache.fetchExplorerData(makeQuery(), "v1");
    await cache.fetchExplorerData(makeQuery(), "v2");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("스트립 필터가 같으면 막대 Map 참조를 공유한다", async () => {
    respond();
    const cache = await importCache();
    const a = await cache.fetchExplorerData(makeQuery({ view: "rank" }), "v1");
    const b = await cache.fetchExplorerData(makeQuery({ view: "table" }), "v1");
    expect(b.dailyQuantity).toBe(a.dailyQuantity);
  });

  it("실패는 캐시하지 않고 미리 계산 실패는 삼킨다", async () => {
    request.mockRejectedValueOnce(new Error("워커 실패"));
    const cache = await importCache();
    const query = makeQuery();

    cache.prefetchExplorerData(query, "v1");
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    /** 실패한 요청이 진행 중 목록에서 빠질 때까지 한 틱 기다린다 */
    await new Promise((resolve) => setTimeout(resolve, 0));
    respond();
    await expect(cache.fetchExplorerData(query, "v1")).resolves.toBeDefined();
    expect(request).toHaveBeenCalledTimes(2);
  });
});
