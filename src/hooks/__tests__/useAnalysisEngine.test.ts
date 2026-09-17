import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { makeQuery, makeRecord } from "../../utils/analysisQuery/__tests__/fixtures";

const toArray = vi.fn();
const loaderState = { isInitialized: true, lastUpdated: "v1" };

vi.mock("../../utils/database", () => ({
  db: { auctionData: { toArray: () => toArray() } },
}));

vi.mock("../useAuctionData", () => ({
  useDataLoader: () => loaderState,
}));

/** 모듈 스코프 캐시(행·클라이언트)를 비우기 위해 매번 새로 불러온다 */
const importHooks = async () => {
  vi.resetModules();
  return import("../useAnalysisEngine");
};

const records = [
  makeRecord("2024-09-19", { grade1Quantity: 1, grade1UnitPrice: 100 }),
  makeRecord("2025-09-22", { grade1Quantity: 2, grade1UnitPrice: 200 }),
];

afterEach(() => {
  toArray.mockReset();
  loaderState.isInitialized = true;
  loaderState.lastUpdated = "v1";
});

describe("useExplorerMeta", () => {
  it("데이터셋 요약을 받는다", async () => {
    toArray.mockResolvedValue(records);
    const { useExplorerMeta } = await importHooks();
    const { result } = renderHook(() => useExplorerMeta());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.meta).toEqual({ availableYears: [2024, 2025], latestDate: "2025-09-22", recordCount: 2 });
  });

  it("데이터 로더 초기화 전에는 요청하지 않는다", async () => {
    loaderState.isInitialized = false;
    const { useExplorerMeta } = await importHooks();
    renderHook(() => useExplorerMeta());
    expect(toArray).not.toHaveBeenCalled();
  });

  it("읽기 실패 시 오류를 노출한다", async () => {
    toArray.mockRejectedValue(new Error("IDB 실패"));
    const { useExplorerMeta } = await importHooks();
    const { result } = renderHook(() => useExplorerMeta());
    await waitFor(() => expect(result.current.error).toBe("IDB 실패"));
  });
});

describe("useExplorerData", () => {
  it("계산 중에는 pending, 끝나면 결과와 쿼리를 함께 준다", async () => {
    toArray.mockResolvedValue(records);
    const { useExplorerData } = await importHooks();
    const query = makeQuery({ time: { kind: "seasons", years: [2025] } });
    const { result } = renderHook(() => useExplorerData(query, "v1", true));

    expect(result.current.pending).toBe(true);
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(result.current.data?.query).toEqual(query);
    expect(result.current.data?.result.rowCount).toBe(1);
  });

  it("쿼리가 바뀌면 직전 결과를 유지한 채 다시 pending", async () => {
    toArray.mockResolvedValue(records);
    const { useExplorerData } = await importHooks();
    const first = makeQuery({ time: { kind: "seasons", years: [2025] } });
    const { result, rerender } = renderHook(({ query }) => useExplorerData(query, "v1", true), {
      initialProps: { query: first },
    });
    await waitFor(() => expect(result.current.pending).toBe(false));

    rerender({ query: makeQuery({ time: { kind: "seasons", years: [2024] } }) });
    expect(result.current.pending).toBe(true);
    expect(result.current.data?.query).toEqual(first);
    await waitFor(() => expect(result.current.data?.query.time).toEqual({ kind: "seasons", years: [2024] }));
  });

  it("원본 CSV를 요청할 수 있다", async () => {
    toArray.mockResolvedValue(records);
    const { requestRawCsv } = await importHooks();
    const csv = await requestRawCsv(makeQuery({ time: { kind: "seasons", years: [2024] } }), "v1");
    expect(csv.split("\r\n")).toHaveLength(2);
  });
});
