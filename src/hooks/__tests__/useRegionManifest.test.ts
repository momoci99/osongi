import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { makeRegionManifest } from "../../test-fixtures/region";

/**
 * 매니페스트 캐시가 모듈 스코프에 있어 테스트끼리 새어나간다.
 * 매번 모듈을 새로 불러 캐시가 빈 상태에서 시작하게 한다.
 */
const importHook = async () => {
  vi.resetModules();
  return (await import("../useRegionManifest")).default;
};

const manifest = makeRegionManifest();

const mockFetchOk = () =>
  vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => manifest,
  });

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetchOk());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useRegionManifest", () => {
  it("매니페스트를 받아 상태로 넘긴다", async () => {
    const useRegionManifest = await importHook();
    const { result } = renderHook(() => useRegionManifest());

    expect(result.current.manifest).toBeNull();
    await waitFor(() => expect(result.current.manifest).toEqual(manifest));
    expect(result.current.error).toBeNull();
  });

  it("여러 컴포넌트가 써도 한 번만 요청한다", async () => {
    const useRegionManifest = await importHook();
    const first = renderHook(() => useRegionManifest());
    const second = renderHook(() => useRegionManifest());

    await waitFor(() => expect(first.result.current.manifest).not.toBeNull());
    await waitFor(() => expect(second.result.current.manifest).not.toBeNull());

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("응답이 실패하면 error를 채운다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })
    );
    const useRegionManifest = await importHook();
    const { result } = renderHook(() => useRegionManifest());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toContain("404");
    expect(result.current.manifest).toBeNull();
  });

  it("실패한 요청은 캐시하지 않아 다시 시도할 수 있다", async () => {
    const failingFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValue({ ok: true, status: 200, json: async () => manifest });
    vi.stubGlobal("fetch", failingFetch);

    const useRegionManifest = await importHook();
    const failed = renderHook(() => useRegionManifest());
    await waitFor(() => expect(failed.result.current.error).not.toBeNull());

    const retried = renderHook(() => useRegionManifest());
    await waitFor(() => expect(retried.result.current.manifest).toEqual(manifest));
    expect(failingFetch).toHaveBeenCalledTimes(2);
  });
});
