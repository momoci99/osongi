import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import RegionBreakdownTable from "../RegionBreakdownTable";

const regionData = [
  { gradeKey: "grade1", quantityKg: 1.84, unitPriceWon: 844507.61 },
  { gradeKey: "grade3Stopped", quantityKg: 13.99, unitPriceWon: 532028.46 },
];

const dayComparison = {
  gradeChanges: [{ gradeKey: "grade1", changePercent: -16.12 }],
} as unknown as Parameters<typeof RegionBreakdownTable>[0]["dayComparison"];

const renderTable = (props: Partial<Parameters<typeof RegionBreakdownTable>[0]> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <RegionBreakdownTable
        myRegion="경북"
        regionData={regionData}
        dayComparison={dayComparison}
        {...props}
      />
    </ThemeProvider>,
  );

const rowOf = (text: string) => screen.getByText(text).closest("tr") as HTMLElement;

describe("RegionBreakdownTable", () => {
  it("단가는 소수점 없이 반올림해 보여준다", () => {
    renderTable();
    expect(within(rowOf("1등품")).getByText("844,508")).toBeInTheDocument();
  });

  it("괄호 등급명은 본 등급과 세부 구분을 나눠 보여준다", () => {
    renderTable();
    const row = rowOf("3등품");
    expect(within(row).getByText("생장정지품")).toBeInTheDocument();
  });

  it("좁은 화면용 수량 보조 텍스트를 등급 셀에 함께 렌더한다", () => {
    renderTable();
    expect(within(rowOf("1등품")).getByText("1.84kg")).toBeInTheDocument();
  });

  it("전일 대비 데이터가 없는 등급도 빈 셀로 열을 맞춘다", () => {
    renderTable();
    const cells = within(rowOf("3등품")).getAllByRole("cell");
    expect(cells).toHaveLength(4);
  });

  it("데이터가 없으면 안내 문구를 보여준다", () => {
    renderTable({ regionData: [] });
    expect(screen.getByText(/경북 지역의 거래 데이터가 없습니다/)).toBeInTheDocument();
  });
});
