import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import ScopeStatPanel, { type ScopeStat } from "../ScopeStatPanel";

const stats: ScopeStat[] = [
  {
    label: "평균 단가",
    value: "189,902",
    unit: "원/kg",
    caption: "2025 시즌",
  },
  { label: "공판량", value: "18.0", unit: "톤" },
  { label: "최신 공판일", value: "2025-11-12" },
];

const renderPanel = () =>
  render(
    <ThemeProvider theme={theme}>
      <ScopeStatPanel stats={stats} />
    </ThemeProvider>
  );

describe("ScopeStatPanel", () => {
  it("라벨과 값을 모두 노출한다", () => {
    renderPanel();

    expect(screen.getByText("평균 단가")).toBeInTheDocument();
    expect(screen.getByText("189,902")).toBeInTheDocument();
    expect(screen.getByText("2025-11-12")).toBeInTheDocument();
  });

  it("값과 단위를 별도 요소로 나눈다", () => {
    renderPanel();

    /** 한 문자열로 붙이면 좁은 폭에서 숫자와 단위가 끊긴다 */
    expect(screen.getByText("원/kg")).toBeInTheDocument();
    expect(screen.getByText("톤")).toBeInTheDocument();
  });

  it("보조 설명이 없는 지표는 캡션 없이 그린다", () => {
    renderPanel();

    expect(screen.getByText("2025 시즌")).toBeInTheDocument();
    expect(screen.queryAllByText("2025 시즌")).toHaveLength(1);
  });
});
