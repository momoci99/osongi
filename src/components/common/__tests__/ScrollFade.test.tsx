import { describe, it, expect } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import ScrollFade from "../ScrollFade";
import { theme } from "../../../theme";

/** jsdom은 레이아웃을 계산하지 않아 스크롤 크기를 직접 심는다 */
const setScrollMetrics = (
  element: HTMLElement,
  metrics: { scrollLeft: number; clientWidth: number; scrollWidth: number },
) => {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(element, key, { value, configurable: true });
  }
  fireEvent.scroll(element);
};

const renderScrollFade = (props: { fadeStart?: boolean } = {}) => {
  const { container } = render(
    <ThemeProvider theme={theme}>
      <ScrollFade {...props}>
        <div>내용</div>
      </ScrollFade>
    </ThemeProvider>,
  );
  const scroller = container.firstElementChild?.firstElementChild as HTMLElement;
  const fade = (side: "left" | "right") => container.querySelector(`[data-scroll-fade="${side}"]`);
  return { scroller, fade };
};

describe("ScrollFade", () => {
  it("넘치지 않으면 페이드를 그리지 않는다", () => {
    const { scroller, fade } = renderScrollFade();
    setScrollMetrics(scroller, { scrollLeft: 0, clientWidth: 300, scrollWidth: 300 });

    expect(fade("left")).toBeNull();
    expect(fade("right")).toBeNull();
  });

  it("아직 볼 내용이 남은 쪽만 흐리게 한다", () => {
    const { scroller, fade } = renderScrollFade();
    setScrollMetrics(scroller, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    expect(fade("left")).toBeNull();
    expect(fade("right")).not.toBeNull();

    setScrollMetrics(scroller, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
    expect(fade("left")).not.toBeNull();

    setScrollMetrics(scroller, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
    expect(fade("right")).toBeNull();
  });

  it("fadeStart가 꺼지면 왼쪽은 흐리게 하지 않는다 — 고정 첫 열을 가리지 않게", () => {
    const { scroller, fade } = renderScrollFade({ fadeStart: false });
    setScrollMetrics(scroller, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });

    expect(fade("left")).toBeNull();
    expect(fade("right")).not.toBeNull();
  });
});
