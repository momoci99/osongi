import { afterEach, describe, expect, it } from "vitest";
import { scaleFont, scaleLength, scaleMargin } from "../chartMargins";
import { LARGE_DISPLAY_FONT_SCALE } from "../../../const/Charts";

const setDisplay = (mode: "default" | "large") => {
  document.documentElement.dataset.display = mode;
};

afterEach(() => {
  delete document.documentElement.dataset.display;
});

describe("큰글씨 모드 차트 스케일", () => {
  it("기본 모드에서는 값을 그대로 둔다", () => {
    setDisplay("default");

    expect(scaleFont(11)).toBe(11);
    expect(scaleLength(112)).toBe(112);
    expect(scaleMargin({ top: 8, right: 8, bottom: 40, left: 60 })).toEqual({
      top: 8,
      right: 8,
      bottom: 40,
      left: 60,
    });
  });

  it("큰글씨 모드에서는 글자와 라벨 폭을 함께 키운다", () => {
    setDisplay("large");

    expect(scaleFont(10)).toBe(Math.round(10 * LARGE_DISPLAY_FONT_SCALE));
    expect(scaleLength(100)).toBe(Math.round(100 * LARGE_DISPLAY_FONT_SCALE));
  });

  it("라벨이 놓이는 왼쪽·아래 여백만 넓힌다", () => {
    setDisplay("large");

    expect(scaleMargin({ top: 8, right: 8, bottom: 40, left: 60 })).toEqual({
      top: 8,
      right: 8,
      bottom: Math.round(40 * LARGE_DISPLAY_FONT_SCALE),
      left: Math.round(60 * LARGE_DISPLAY_FONT_SCALE),
    });
  });
});
