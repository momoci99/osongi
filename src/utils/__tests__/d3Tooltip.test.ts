import { describe, it, expect, afterEach } from "vitest";
import { theme } from "../../theme";
import { createD3Tooltip, removeD3Tooltip } from "../d3Tooltip";

afterEach(() => {
  removeD3Tooltip();
});

describe("createD3Tooltip", () => {
  it("호버 전에는 숨긴 채 문서 맨 위에 둔다", () => {
    const node = createD3Tooltip(theme).node();

    expect(node?.style.opacity).toBe("0");
    expect(node?.style.top).toBe("0px");
    expect(node?.style.left).toBe("0px");
  });

  it("다시 만들면 이전 툴팁을 지워 하나만 남긴다", () => {
    createD3Tooltip(theme);
    createD3Tooltip(theme);

    expect(document.querySelectorAll(".d3-chart-tooltip")).toHaveLength(1);
  });
});
