import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import RegionSummaryCard from "../RegionSummaryCard";
import { buildSparkPaths } from "../../../utils/d3/sparkPath";
import { makeScopeStats } from "../../../test-fixtures/region";
import type { RegionScopeStats } from "../../../types/region";

const region: RegionScopeStats = {
  ...makeScopeStats({ name: "경북", region: "경북", quantityRank: undefined }),
  unions: ["봉화", "울진"],
};

const renderCard = (overrides: Partial<RegionScopeStats> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <RegionSummaryCard region={{ ...region, ...overrides }} />
      </MemoryRouter>
    </ThemeProvider>
  );

describe("RegionSummaryCard", () => {
  it("지역 페이지로 연결하고 조합 수와 지표를 보여준다", () => {
    renderCard();

    expect(screen.getByRole("link")).toHaveAttribute("href", "/region/경북");
    expect(screen.getByText("산림조합 2곳")).toBeInTheDocument();
    expect(screen.getByText("300,000")).toBeInTheDocument();
    expect(screen.getByText("공판량 12.0톤")).toBeInTheDocument();
  });

  it("최신 시즌 집계가 없으면 단위 없이 집계 없음만 보여준다", () => {
    renderCard({ season: null });

    expect(screen.getByText("집계 없음")).toBeInTheDocument();
    expect(screen.queryByText("원/kg")).not.toBeInTheDocument();
  });

  it("연도 범위 라벨을 붙인다", () => {
    renderCard();

    /** 2023–2025 */
    expect(screen.getByText("2023–25 단가")).toBeInTheDocument();
  });
});

describe("buildSparkPaths", () => {
  it("점이 두 개 미만이면 그리지 않는다", () => {
    expect(buildSparkPaths([])).toBeNull();
    expect(buildSparkPaths([100])).toBeNull();
  });

  it("값이 모두 같아도 스케일이 무너지지 않는다", () => {
    const paths = buildSparkPaths([100, 100, 100]);

    expect(paths).not.toBeNull();
    expect(paths?.line).not.toContain("NaN");
    expect(paths?.area).not.toContain("NaN");
  });
});
