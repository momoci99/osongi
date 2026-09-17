import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import Heatmap from "../charts/Heatmap";
import RankChart from "../charts/RankChart";
import CompositionChart from "../charts/CompositionChart";
import { runAnalysisQuery, shiftTimeByYears } from "../../../utils/analysisQuery/runQuery";
import { buildRankModel } from "../../../utils/analysisQuery/rankModel";
import { makeQuery, makeRow } from "../../../utils/analysisQuery/__tests__/fixtures";

const withTheme = (node: React.ReactNode) => render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);

const rows = [
  makeRow("2024-09-20", { union: "양양", region: "강원", grade: "grade1", quantity: 1 }),
  makeRow("2024-09-21", { union: "봉화", region: "경북", grade: "gradeBelow", quantity: 3 }),
  makeRow("2023-09-20", { union: "양양", region: "강원", grade: "grade1", quantity: 2 }),
];

describe("Heatmap", () => {
  it("시즌 수를 알리고 빈칸 안내를 붙인다", () => {
    const query = makeQuery({
      view: "heatmap",
      groupBy: "year",
      metric: "quantity",
      time: { kind: "seasons", years: [2023, 2024] },
    });
    withTheme(<Heatmap query={query} result={runAnalysisQuery(rows, query)} onSelectSeason={vi.fn()} />);

    expect(screen.getByRole("img", { name: "시즌 2개 히트맵" })).toBeInTheDocument();
    expect(screen.getByText(/빈칸은 공판 없음/)).toBeInTheDocument();
  });
});

describe("RankChart", () => {
  it("전년 비교가 있으면 전년 표식 안내를 보여준다", () => {
    const query = makeQuery({
      view: "rank",
      groupBy: "union",
      granularity: "season",
      compare: "prevYear",
      time: { kind: "seasons", years: [2024] },
    });
    const comparison = runAnalysisQuery(rows, { ...query, time: shiftTimeByYears(query.time, -1) });
    withTheme(
      <RankChart query={query} items={buildRankModel(runAnalysisQuery(rows, query), query, comparison)} showChange />,
    );

    expect(screen.getByRole("img", { name: "조합별 단가 순위, 2개" })).toBeInTheDocument();
    expect(screen.getByText(/전년 같은 기간 값/)).toBeInTheDocument();
  });
});

describe("CompositionChart", () => {
  it("실제 등장한 등급만 범례에 올린다", () => {
    const query = makeQuery({
      view: "composition",
      groupBy: "grade",
      metric: "gradeShare",
      granularity: "season",
      time: { kind: "seasons", years: [2024] },
    });
    withTheme(<CompositionChart query={query} result={runAnalysisQuery(rows, query)} />);

    expect(screen.getByText("1등품")).toBeInTheDocument();
    expect(screen.getByText("등외품")).toBeInTheDocument();
    expect(screen.queryByText("2등품")).not.toBeInTheDocument();
  });
});
