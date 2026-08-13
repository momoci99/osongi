import { describe, expect, it } from "vitest";
import { createAppTheme } from "../theme";

/** WCAG 상대 휘도 */
const luminance = (hex: string): number => {
  const channels = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (a: string, b: string): number => {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
};

describe("createAppTheme", () => {
  describe("표면 계단", () => {
    it("다크에서 테두리가 카드와 구분된다", () => {
      const { surface } = createAppTheme("dark").palette;

      /**
       * 이전 팔레트는 1.10이라 카드 경계가 배경에 녹아 화면이 한 덩어리로 읽혔다.
       * 다크 저휘도 구간은 배경끼리의 명암비를 올리기 어려우므로 계층은 테두리가 만든다.
       */
      expect(contrast(surface.border, surface.raised)).toBeGreaterThan(1.4);
    });

    it("다크에서 카드가 바닥보다 밝다", () => {
      const { surface } = createAppTheme("dark").palette;

      expect(luminance(surface.raised)).toBeGreaterThan(luminance(surface.base));
      expect(luminance(surface.overlay)).toBeGreaterThan(
        luminance(surface.raised)
      );
    });

    it("라이트에서도 카드가 바닥보다 밝다", () => {
      const { surface } = createAppTheme("light").palette;

      /** 이전에는 바닥(#FAFAF9)이 카드(#F7F6F4)보다 밝아 계단이 뒤집혀 있었다 */
      expect(luminance(surface.raised)).toBeGreaterThan(luminance(surface.base));
    });

    it("background·divider 가 surface 토큰과 같은 값을 쓴다", () => {
      const { surface, background, divider } = createAppTheme("dark").palette;

      expect(background.default).toBe(surface.base);
      expect(background.paper).toBe(surface.raised);
      expect(divider).toBe(surface.border);
    });
  });

  describe("본문 대비", () => {
    it.each(["light", "dark"] as const)("%s 본문이 AA를 넘는다", (mode) => {
      const { surface, text } = createAppTheme(mode).palette;

      expect(contrast(text.primary, surface.raised)).toBeGreaterThan(4.5);
      expect(contrast(text.secondary, surface.raised)).toBeGreaterThan(4.5);
    });
  });

  describe("브랜드 색", () => {
    it("초록 위 글자가 읽힌다", () => {
      for (const mode of ["light", "dark"] as const) {
        const { primary } = createAppTheme(mode).palette;
        expect(contrast(primary.contrastText, primary.main)).toBeGreaterThan(4.5);
      }
    });

    it("accent 가 경북 지역색(H28)과 겹치지 않는다", () => {
      const { secondary } = createAppTheme("dark").palette;

      /** 지역 도트 근처에서 accent 를 쓰면 경북색으로 오독된다 */
      expect(secondary.main).not.toBe(createAppTheme("dark").palette.chart.up);
    });
  });
});
