import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useNarrowScreenGate from "../useNarrowScreenGate";

const KEY = "test-bypass";

/** matchMedia 결과를 고정한다 */
const mockViewport = (matches: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  );
};

describe("useNarrowScreenGate", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("넓은 화면에서는 안내를 띄우지 않는다", () => {
    mockViewport(true);
    const { result } = renderHook(() => useNarrowScreenGate(1024, KEY));
    expect(result.current.showNotice).toBe(false);
  });

  it("좁은 화면에서는 안내를 띄우고, 그래도 보기를 누르면 닫는다", () => {
    mockViewport(false);
    const { result } = renderHook(() => useNarrowScreenGate(1024, KEY));
    expect(result.current.showNotice).toBe(true);

    act(() => result.current.proceed());
    expect(result.current.showNotice).toBe(false);
  });

  it("그래도 보기 선택은 같은 세션에서 유지된다", () => {
    mockViewport(false);
    sessionStorage.setItem(KEY, "1");
    const { result } = renderHook(() => useNarrowScreenGate(1024, KEY));
    expect(result.current.showNotice).toBe(false);
  });
});
