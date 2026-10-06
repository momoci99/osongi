import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import DashboardCharts from "../DashboardCharts";

describe("DashboardCharts", () => {
  it("제목에 범위 이름을 붙이고, 거래가 없으면 빈 축 대신 안내한다", () => {
    render(
      <ThemeProvider theme={theme}>
        <DashboardCharts
          scopeLabel="청송 조합"
          gradeBreakdown={[]}
          weeklyData={[]}
          latestDate="2026-10-05"
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("청송 조합 등급별 수량(kg) — 2026-10-05")).toBeInTheDocument();
    expect(screen.getByText("청송 조합 7일간 등급별 가격·수량 변동")).toBeInTheDocument();
    expect(screen.getAllByText("청송 조합의 최신 공판일 거래가 없습니다.")).toHaveLength(2);
    expect(screen.getByText("청송 조합의 최근 7일 거래가 없습니다.")).toBeInTheDocument();
  });
});
