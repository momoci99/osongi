import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import ScopeHeader from "../ScopeHeader";
import { makeScopeStats } from "../../../test-fixtures/region";
import { buildScopeNarrative } from "../../../utils/regionNarrative";
import type { ScopeStats } from "../../../types/region";

const renderHeader = (stats: ScopeStats = makeScopeStats()) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <ScopeHeader stats={stats} latestDate="2025-11-12" />
      </MemoryRouter>
    </ThemeProvider>
  );

describe("ScopeHeader", () => {
  it("조합 페이지는 조합명을 H1로 쓴다", () => {
    renderHeader();

    expect(
      screen.getByRole("heading", { level: 1, name: "봉화 송이 시세" })
    ).toBeInTheDocument();
  });

  it("첫 요약 문단만 펼치고 나머지는 접는다", () => {
    const stats = makeScopeStats();
    const [lead, ...rest] = buildScopeNarrative(stats);
    renderHeader(stats);

    expect(screen.getByText(lead)).toBeInTheDocument();
    expect(screen.getByText("시즌 요약 자세히 보기")).toBeInTheDocument();
    /** 접혀 있어도 DOM 에는 남아야 색인 자산이 유지된다 */
    for (const paragraph of rest) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
  });

  it("접힌 문단은 details 안에 둔다", () => {
    const { container } = renderHeader();

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.hasAttribute("open")).toBe(false);
  });

  it("요약이 한 문단뿐이면 토글을 만들지 않는다", () => {
    const { container } = renderHeader(
      makeScopeStats({ peak: null, yearly: [], quantityRank: undefined })
    );

    expect(container.querySelector("details")).toBeNull();
  });

  it("조합 페이지는 지역 페이지로 가는 breadcrumb을 준다", () => {
    renderHeader();

    const crumbs = screen.getByRole("navigation", { name: "현재 위치" });
    expect(crumbs).toHaveTextContent("경북");
  });
});
