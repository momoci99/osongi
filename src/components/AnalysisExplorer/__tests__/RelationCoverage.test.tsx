import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import Coverage from "../charts/Coverage";
import Relation from "../charts/Relation";
import { runAnalysisQuery } from "../../../utils/analysisQuery/runQuery";
import { buildRelationModel } from "../../../utils/analysisQuery/relationModel";
import { buildCoverage } from "../../../utils/analysisQuery/seasonTables";
import { makeQuery, makeRow } from "../../../utils/analysisQuery/__tests__/fixtures";

const rows = [
  makeRow("2023-09-10", { union: "양양" }),
  makeRow("2024-09-11", { union: "양양" }),
  makeRow("2024-09-12", { union: "강릉" }),
];

describe("Relation과 Coverage", () => {
  it("관계 점이 부족하면 기간 확장 안내를 표시한다", () => {
    const query = makeQuery({
      view: "relation",
      time: { kind: "seasons", years: [2023, 2024] },
    });

    render(
      <ThemeProvider theme={theme}>
        <Relation query={query} model={buildRelationModel(runAnalysisQuery(rows, query), query)} />
      </ThemeProvider>,
    );

    expect(screen.getByText("점이 3개뿐이라 관계를 판단하기 어렵습니다. 기간을 넓혀 보세요.")).toBeInTheDocument();
  });

  it("커버리지 범례와 빈칸 설명을 표시한다", () => {
    const query = makeQuery({
      view: "coverage",
      time: { kind: "seasons", years: [2023, 2024] },
    });

    render(
      <ThemeProvider theme={theme}>
        <Coverage coverage={buildCoverage(runAnalysisQuery(rows, query).rows)} />
      </ThemeProvider>,
    );

    expect(screen.getByText("공판일 적음 → 많음")).toBeInTheDocument();
    expect(screen.getByText("빈칸은 해당 시즌 공판 없음")).toBeInTheDocument();
  });
});
