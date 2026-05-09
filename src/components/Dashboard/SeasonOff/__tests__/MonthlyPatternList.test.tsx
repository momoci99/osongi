import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MonthlyPatternList from "../MonthlyPatternList";
import type { MonthlyPattern } from "../../../../types/seasonOff";

const createPattern = (month: number, avgPriceWon: number, avgQuantityKg: number): MonthlyPattern => ({
  month,
  avgPriceWon,
  avgQuantityKg,
  yearCount: 1,
});

describe("MonthlyPatternList", () => {
  it("월 이름을 렌더링한다", () => {
    const patterns = [
      createPattern(9, 120000, 5000),
      createPattern(10, 150000, 8000),
    ];

    render(<MonthlyPatternList patterns={patterns} />);

    expect(screen.getByText("9월")).toBeInTheDocument();
    expect(screen.getByText("10월")).toBeInTheDocument();
  });

  it("빈 배열이면 월 목록이 표시되지 않는다", () => {
    render(<MonthlyPatternList patterns={[]} />);

    expect(screen.queryByText("9월")).not.toBeInTheDocument();
  });

  it("여러 패턴을 모두 렌더링한다", () => {
    const patterns = [
      createPattern(9,  120000, 4000),
      createPattern(10, 150000, 8000),
      createPattern(11, 90000,  2000),
    ];

    render(<MonthlyPatternList patterns={patterns} />);

    expect(screen.getByText("9월")).toBeInTheDocument();
    expect(screen.getByText("10월")).toBeInTheDocument();
    expect(screen.getByText("11월")).toBeInTheDocument();
  });

  it("제목 '시즌 내 월별 패턴'을 렌더링한다", () => {
    render(<MonthlyPatternList patterns={[createPattern(10, 100000, 5000)]} />);

    expect(screen.getByText("시즌 내 월별 패턴")).toBeInTheDocument();
  });

  it("가격을 로케일 포맷으로 표시한다", () => {
    const patterns = [createPattern(10, 150000, 5000)];

    render(<MonthlyPatternList patterns={patterns} />);

    expect(screen.getByText(/150,000/)).toBeInTheDocument();
  });
});
