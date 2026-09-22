import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import ChangeBadge from "../ChangeBadge";

const renderBadge = (changePercent: number) =>
  render(
    <ThemeProvider theme={theme}>
      <ChangeBadge changePercent={changePercent} />
    </ThemeProvider>,
  );

describe("ChangeBadge", () => {
  it("상승은 ▲와 소수 첫째 자리로 표기한다", () => {
    renderBadge(0.84);
    expect(screen.getByText("▲ 0.8%")).toBeInTheDocument();
  });

  it("하락은 ▼와 절댓값으로 표기한다", () => {
    renderBadge(-16.12);
    expect(screen.getByText("▼ 16.1%")).toBeInTheDocument();
  });

  it("변동 없음은 —로 표기한다", () => {
    renderBadge(0);
    expect(screen.getByText("— 0.0%")).toBeInTheDocument();
  });
});
