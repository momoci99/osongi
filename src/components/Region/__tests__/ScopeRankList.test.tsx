import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import ScopeRankList from "../ScopeRankList";
import type { ScopeLinkItem } from "../../../types/region";

const items: ScopeLinkItem[] = [
  {
    name: "울진",
    path: "/region/경북/울진",
    region: "경북",
    avgPricePerKg: 270000,
    totalQuantityKg: 30000,
  },
  {
    name: "봉화",
    path: "/region/경북/봉화",
    region: "경북",
    avgPricePerKg: 300000,
    totalQuantityKg: 12000,
  },
  {
    name: "영천",
    path: "/region/경북/영천",
    region: "경북",
    avgPricePerKg: null,
    totalQuantityKg: null,
  },
];

const renderList = (props: Partial<Parameters<typeof ScopeRankList>[0]> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <ScopeRankList
          title="산림조합"
          items={items}
          emptyMessage="조합 데이터가 없습니다."
          {...props}
        />
      </MemoryRouter>
    </ThemeProvider>
  );

describe("ScopeRankList", () => {
  it("단위를 열 머리글로 한 번만 선언한다", () => {
    renderList();

    const nav = within(screen.getByRole("navigation", { name: "산림조합" }));
    expect(nav.getByText("원/kg")).toBeInTheDocument();
    expect(nav.getByText("톤")).toBeInTheDocument();
    expect(nav.getByText("공판량 비중")).toBeInTheDocument();
  });

  it("집계가 있는 행에만 순위를 매긴다", () => {
    renderList();

    const rows = screen.getAllByRole("link");
    expect(rows[0]).toHaveTextContent("1울진");
    expect(rows[1]).toHaveTextContent("2봉화");
    /** 집계 없는 조합은 순위 자리를 비운다 */
    expect(rows[2]).toHaveTextContent("–영천");
    expect(rows[2]).toHaveTextContent("집계 없음");
  });

  it("톤 값은 숫자만 남기고 단위를 반복하지 않는다", () => {
    renderList();

    expect(screen.getByText("30.0")).toBeInTheDocument();
    expect(screen.getByText("270,000")).toBeInTheDocument();
  });

  it("기준 단가를 주면 차이 배지를 붙인다", () => {
    renderList({ compareToPricePerKg: 300000 });

    /** 울진 270,000원은 기준 대비 10% 낮다 */
    expect(screen.getByText("10%", { exact: false })).toBeInTheDocument();
  });

  it("항목이 없으면 빈 메시지를 보여준다", () => {
    renderList({ items: [] });

    expect(screen.getByText("조합 데이터가 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("showRegion 을 켜면 지역명을 함께 노출한다", () => {
    renderList({ showRegion: true });

    expect(screen.getByText("조합 · 지역")).toBeInTheDocument();
    expect(screen.getAllByText("경북").length).toBeGreaterThan(0);
  });
});
