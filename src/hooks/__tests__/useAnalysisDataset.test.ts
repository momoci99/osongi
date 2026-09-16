import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { makeRecord } from "../../utils/analysisQuery/__tests__/fixtures";

const toArray = vi.fn();
const loaderState = { isInitialized: true, lastUpdated: "v1" };

vi.mock("../../utils/database", () => ({
  db: { auctionData: { toArray: () => toArray() } },
}));

vi.mock("../useAuctionData", () => ({
  useDataLoader: () => loaderState,
}));

/** 모듈 스코프 캐시를 비우기 위해 매번 새로 불러온다 */
const importHook = async () => {
  vi.resetModules();
  return (await import("../useAnalysisDataset")).default;
};

const records = [
  makeRecord("2024-09-19", { grade1Quantity: 1, grade1UnitPrice: 100 }),
  makeRecord("2025-09-22", { grade1Quantity: 2, grade1UnitPrice: 200 }),
  makeRecord("2025-09-23"),
];

afterEach(() => {
  toArray.mockReset();
  loaderState.isInitialized = true;
  loaderState.lastUpdated = "v1";
});

describe("useAnalysisDataset", () => {
  it("IndexedDB 전체를 롱 포맷으로 읽고 연도·최신일을 계산한다", async () => {
    toArray.mockResolvedValue(records);
    const useAnalysisDataset = await importHook();
    const { result } = renderHook(() => useAnalysisDataset());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows).toHaveLength(2);
    expect(result.current.availableYears).toEqual([2024, 2025]);
    expect(result.current.latestDate).toBe("2025-09-22");
  });

  it("같은 버전이면 다시 읽지 않는다", async () => {
    toArray.mockResolvedValue(records);
    const useAnalysisDataset = await importHook();

    const first = renderHook(() => useAnalysisDataset());
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    const second = renderHook(() => useAnalysisDataset());
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(toArray).toHaveBeenCalledTimes(1);
  });

  it("데이터 로더 초기화 전에는 읽지 않는다", async () => {
    loaderState.isInitialized = false;
    const useAnalysisDataset = await importHook();
    const { result } = renderHook(() => useAnalysisDataset());

    expect(result.current.loading).toBe(true);
    expect(toArray).not.toHaveBeenCalled();
  });

  it("읽기 실패 시 오류를 노출한다", async () => {
    toArray.mockRejectedValue(new Error("IDB 실패"));
    const useAnalysisDataset = await importHook();
    const { result } = renderHook(() => useAnalysisDataset());

    await waitFor(() => expect(result.current.error).toBe("IDB 실패"));
    expect(result.current.rows).toEqual([]);
  });
});
