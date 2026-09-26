import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import ExplorerSummary from "../Summary";
import ExplorerView from "../views";
import { runAnalysisQuery } from "../../../utils/analysisQuery/runQuery";
import { computeExplorerData } from "../../../utils/analysisQuery/explorerData";
import { makeQuery, makeRow } from "../../../utils/analysisQuery/__tests__/fixtures";
import type { AnalysisQuery, GradeRow } from "../../../utils/analysisQuery/types";

const withTheme = (node: React.ReactNode) => render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);

const renderSummary = (rows: GradeRow[], query: AnalysisQuery) =>
  withTheme(
    <ExplorerSummary query={query} result={runAnalysisQuery(rows, query)} scopeUnionCount={21} />,
  );

describe("ExplorerSummary", () => {
  it("가중 단가·참여 조합·극값을 보여준다", () => {
    const rows = [
      makeRow("2023-09-11", { quantity: 1, unitPrice: 1_000_000, union: "양양" }),
      makeRow("2023-09-11", { quantity: 3, unitPrice: 200_000, union: "봉화", grade: "grade2" }),
    ];
    renderSummary(rows, makeQuery({ time: { kind: "seasons", years: [2023] } }));

    expect(screen.getByText("40.0")).toBeInTheDocument();
    expect(screen.getByText("/ 21곳")).toBeInTheDocument();
    expect(screen.getByText("09.11 · 양양 · 1등품")).toBeInTheDocument();
  });

  it("여러 시즌을 보면 극값 날짜에 연도를 붙인다", () => {
    const rows = [makeRow("2023-09-11", { union: "양양" }), makeRow("2024-09-19", { union: "봉화" })];
    renderSummary(rows, makeQuery({ time: { kind: "seasons", years: [2023, 2024] } }));

    expect(screen.getAllByText(/^20\d\d\.09\.\d\d · /).length).toBeGreaterThan(0);
  });

  it("공판일이 적으면 경고를 보여준다", () => {
    renderSummary([makeRow("2024-09-19")], makeQuery({ time: { kind: "seasons", years: [2024] } }));

    expect(screen.getByRole("alert")).toHaveTextContent("공판일이 1일뿐");
  });

  it("공판이 없으면 경고 대신 값을 비워 둔다", () => {
    renderSummary([], makeQuery({ time: { kind: "seasons", years: [2024] } }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getAllByText("–")).toHaveLength(3);
    expect(screen.queryByText("0.0")).not.toBeInTheDocument();
  });
});

describe("ExplorerView", () => {
  it("결과가 없으면 빈 상태를 안내한다", () => {
    const query = makeQuery({ view: "table" });
    withTheme(<ExplorerView data={computeExplorerData([], query)} selectedQuery={query} pending={false} onQueryChange={() => {}} requestRawCsv={async () => ""} ongoingYear={null} />);

    expect(screen.getByText("조건에 맞는 공판 기록이 없습니다")).toBeInTheDocument();
  });

  it("시즌별 표 조합이면 시즌 요약 표를 그린다", () => {
    const rows = [makeRow("2023-09-11"), makeRow("2024-09-19"), makeRow("2024-09-20")];
    const query = makeQuery({
      view: "table",
      time: { kind: "seasons", years: [2023, 2024] },
      groupBy: "year",
      granularity: "season",
      metric: "quantity",
    });
    withTheme(<ExplorerView data={computeExplorerData(rows, query)} selectedQuery={query} pending={false} onQueryChange={() => {}} requestRawCsv={async () => ""} ongoingYear={null} />);

    expect(screen.getByRole("columnheader", { name: "피크일" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2024" })).toBeInTheDocument();
  });

  it("시즌 요약 표는 진행 중 시즌을 표시하고 물량 열의 단위를 통일한다", () => {
    const rows = [
      makeRow("2023-09-11", { quantity: 2_000 }),
      makeRow("2024-09-19", { quantity: 300 }),
    ];
    const query = makeQuery({
      view: "table",
      time: { kind: "seasons", years: [2023, 2024] },
      groupBy: "year",
      granularity: "season",
      metric: "quantity",
    });
    withTheme(<ExplorerView data={computeExplorerData(rows, query)} selectedQuery={query} pending={false} onQueryChange={() => {}} requestRawCsv={async () => ""} ongoingYear={2024} />);

    expect(screen.getByRole("cell", { name: /^2024\s*진행 중$/ })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2023" })).toBeInTheDocument();
    expect(screen.queryAllByText("kg")).toHaveLength(0);
    expect(screen.getAllByText("0.3")).toHaveLength(2);
  });

  it("차트 뷰는 표를 접어 두고, 펼치면 평년 열이 붙은 피벗 표를 보여준다", () => {
    const rows = [
      makeRow("2020-09-18"),
      makeRow("2021-09-06"),
      makeRow("2022-09-07"),
      makeRow("2023-09-11"),
    ];
    const query = makeQuery({
      view: "overlay",
      time: { kind: "seasons", years: [2023] },
      align: "seasonDay",
      groupBy: "year",
      compare: "normal",
    });
    withTheme(<ExplorerView data={computeExplorerData(rows, query)} selectedQuery={query} pending={false} onQueryChange={() => {}} requestRawCsv={async () => ""} ongoingYear={null} />);

    expect(screen.queryByRole("columnheader", { name: "평년 중앙값" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "표로 보기" }));
    expect(screen.getByRole("columnheader", { name: "평년 중앙값" })).toBeInTheDocument();
    expect(screen.getByText("1일차")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "평년 범위 (P25–P75)" })).toBeInTheDocument();
  });

  it("선택을 바꾸면 결과를 기다리지 않고 제목부터 바뀐다", () => {
    const shown = makeQuery({ view: "table" });
    withTheme(
      <ExplorerView
        data={computeExplorerData([makeRow("2024-09-19")], shown)}
        selectedQuery={makeQuery({ view: "rank" })}
        pending
        onQueryChange={() => {}}
        requestRawCsv={async () => ""}
        ongoingYear={null}
      />,
    );

    expect(screen.getByRole("heading", { name: "순위" })).toBeInTheDocument();
  });

  it("계산 중이면 패널이 aria-busy와 진행 바를 가진다", () => {
    const query = makeQuery({ view: "table" });
    withTheme(
      <ExplorerView data={computeExplorerData([makeRow("2024-09-19")], query)} selectedQuery={query} pending onQueryChange={() => {}} requestRawCsv={async () => ""} ongoingYear={null} />,
    );

    expect(screen.getByRole("progressbar", { name: "결과 계산 중" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar").closest("section")).toHaveAttribute("aria-busy", "true");
  });
});
