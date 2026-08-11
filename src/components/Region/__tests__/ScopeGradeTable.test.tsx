import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import ScopeGradeTable from "../ScopeGradeTable";
import type { GradeStat } from "../../../types/region";

const grades: GradeStat[] = [
  { gradeKey: "grade1", quantityKg: 2500, avgUnitPriceWon: 500000 },
  { gradeKey: "grade2", quantityKg: 7500, avgUnitPriceWon: 260000 },
];

const renderTable = (props: Partial<{ grades: GradeStat[] }> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ScopeGradeTable
        grades={props.grades ?? grades}
        caption="2025 시즌 등급별 시세"
        emptyMessage="집계가 없습니다."
      />
    </ThemeProvider>
  );

describe("ScopeGradeTable", () => {
  it("소제목을 h2로 노출한다", () => {
    renderTable();

    expect(
      screen.getByRole("heading", { level: 2, name: "2025 시즌 등급별 시세" })
    ).toBeInTheDocument();
  });

  it("등급 키를 한글 등급명으로 바꿔 보여준다", () => {
    renderTable();

    expect(screen.getByText("1등품")).toBeInTheDocument();
    expect(screen.getByText("2등품")).toBeInTheDocument();
  });

  it("단가·물량을 천 단위로 끊어 보여준다", () => {
    renderTable();

    const row = screen.getByText("1등품").closest("tr");
    expect(within(row!).getByText("500,000")).toBeInTheDocument();
    expect(within(row!).getByText("2,500")).toBeInTheDocument();
  });

  it("전체 물량 대비 비중을 계산한다", () => {
    renderTable();

    const row = screen.getByText("1등품").closest("tr");
    expect(within(row!).getByText("25.0%")).toBeInTheDocument();
  });

  it("등급이 없으면 안내 문구를 대신 보여준다", () => {
    renderTable({ grades: [] });

    expect(screen.getByText("집계가 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
