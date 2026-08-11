import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import ScopeLinkGrid, { type ScopeLinkItem } from "../ScopeLinkGrid";

const items: ScopeLinkItem[] = [
  {
    name: "봉화",
    path: "/region/경북/봉화",
    avgPricePerKg: 300000,
    totalQuantityKg: 12000,
  },
  {
    name: "울진",
    path: "/region/경북/울진",
    avgPricePerKg: null,
    totalQuantityKg: null,
  },
];

const renderGrid = (
  list: ScopeLinkItem[] = items,
  compareToPricePerKg?: number | null
) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <ScopeLinkGrid
          title="경북 조합별 시세"
          items={list}
          emptyMessage="연결된 조합 페이지가 없습니다."
          compareToPricePerKg={compareToPricePerKg}
        />
      </MemoryRouter>
    </ThemeProvider>
  );

describe("ScopeLinkGrid", () => {
  it("각 항목을 상세 페이지 링크로 만든다", () => {
    renderGrid();

    expect(screen.getByRole("link", { name: /봉화/ })).toHaveAttribute(
      "href",
      "/region/경북/봉화"
    );
  });

  it("크롤러가 따라갈 수 있도록 nav 랜드마크로 감싼다", () => {
    renderGrid();

    expect(
      screen.getByRole("navigation", { name: "경북 조합별 시세" })
    ).toBeInTheDocument();
  });

  it("평균 단가와 톤 환산 물량을 함께 보여준다", () => {
    renderGrid();

    expect(screen.getByText("평균 300,000원/kg")).toBeInTheDocument();
    expect(screen.getByText("12.0톤")).toBeInTheDocument();
  });

  it("집계가 없는 항목은 대체 문구를 보여준다", () => {
    renderGrid();

    expect(screen.getByText("최신 시즌 집계 없음")).toBeInTheDocument();
  });

  it("기준 단가를 주면 항목마다 차이를 배지로 붙인다", () => {
    renderGrid(items, 250000);

    /** 봉화 300,000원은 기준 250,000원보다 20% 높다 */
    expect(screen.getByText(/▲ 20%/)).toBeInTheDocument();
  });

  it("차이가 미미하면 배지를 붙이지 않는다", () => {
    renderGrid(items, 300500);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("기준 단가가 없으면 배지를 붙이지 않는다", () => {
    renderGrid();

    expect(screen.queryByText(/▲|▼/)).not.toBeInTheDocument();
  });

  it("항목이 없으면 빈 상태 문구만 남는다", () => {
    renderGrid([]);

    expect(screen.getByText("연결된 조합 페이지가 없습니다.")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
