import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import ScopeStatSummary from "../ScopeStatSummary";
import { makeScopeStats } from "../../../test-fixtures/region";

const renderSummary = (...args: Parameters<typeof makeScopeStats>) =>
  render(
    <ThemeProvider theme={theme}>
      <ScopeStatSummary stats={makeScopeStats(...args)} />
    </ThemeProvider>
  );

describe("ScopeStatSummary", () => {
  it("최신 시즌 실적이 있으면 시즌 지표를 보여준다", () => {
    renderSummary();

    expect(screen.getByText("300,000")).toBeInTheDocument();
    expect(screen.queryByText("집계 없음")).not.toBeInTheDocument();
  });

  it("최신 시즌 실적이 없으면 직전 기록 연도 실적으로 대신한다", () => {
    renderSummary({ latestSeasonYear: 2026, season: null, peak: null });

    /** "집계 없음"은 시즌 상태 한 줄에만 쓴다 */
    expect(screen.getAllByText("집계 없음")).toHaveLength(1);
    expect(screen.getByText("2026 시즌")).toBeInTheDocument();
    expect(screen.getByText("300,000")).toBeInTheDocument();
    expect(screen.getAllByText("2025 시즌 · 직전 기록")).toHaveLength(2);
  });
});
