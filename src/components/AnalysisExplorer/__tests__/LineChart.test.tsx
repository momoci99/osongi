import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import LineChart from "../charts/LineChart";
import { buildTooltipContent, renderTooltipHtml } from "../charts/lineTooltip";
import { resolveSeriesColor } from "../charts/seriesColor";
import { buildLineChartModel } from "../../../utils/analysisQuery/lineChartModel";
import { runAnalysisQuery } from "../../../utils/analysisQuery/runQuery";
import { makeQuery, makeRow } from "../../../utils/analysisQuery/__tests__/fixtures";

const rows = [
  makeRow("2020-09-18", { unitPrice: 300_000 }),
  makeRow("2021-09-06", { unitPrice: 400_000 }),
  makeRow("2022-09-07", { unitPrice: 500_000 }),
  makeRow("2023-09-11", { unitPrice: 600_000 }),
];

const overlayQuery = makeQuery({
  view: "overlay",
  align: "seasonDay",
  groupBy: "year",
  compare: "normal",
  time: { kind: "seasons", years: [2023] },
});

describe("buildTooltipContent", () => {
  it("시즌 일차 축이면 실제 날짜와 평년 한 줄을 붙인다", () => {
    const result = runAnalysisQuery(rows, overlayQuery);
    const model = buildLineChartModel(result, overlayQuery);
    const series = model.series[0];
    const content = buildTooltipContent({
      axis: result.axis,
      query: overlayQuery,
      hits: [{ series, point: series.points[0], color: "#000" }],
      band: model.band?.[0],
      seasonStarts: result.seasonStarts,
    });

    expect(content?.title).toBe("1일차");
    expect(content?.rows[0]).toMatchObject({ label: "2023", value: "60.0만원/kg", detail: "9/11 · 1건" });
    expect(content?.normal).toBe("평년 40.0만원/kg · 범위 35.0–45.0만원/kg · 3시즌");
  });

  it("툴팁 HTML은 라벨을 이스케이프한다", () => {
    const html = renderTooltipHtml({
      title: "<b>",
      rows: [{ key: "a", label: "a&b", color: "#fff", value: "1", detail: "", lowSample: true }],
      normal: null,
    });
    expect(html).toContain("&#60;b&#62;");
    expect(html).toContain("a&#38;b");
    expect(html).toContain("tt-low");
  });

  it("강조 중인 시리즈 행을 표시하고 색 표본에 선 진하기를 입힌다", () => {
    const result = runAnalysisQuery(rows, overlayQuery);
    const model = buildLineChartModel(result, overlayQuery);
    const series = model.series[0];
    const content = buildTooltipContent({
      axis: result.axis,
      query: overlayQuery,
      hits: [{ series, point: series.points[0], color: "#000" }],
      band: undefined,
      seasonStarts: result.seasonStarts,
      activeKey: series.key,
    });

    expect(content?.rows[0]).toMatchObject({ active: true, opacity: series.opacity });
    expect(renderTooltipHtml(content!)).toContain("tt-active");
  });
});

describe("resolveSeriesColor", () => {
  it("역할과 대상에 따라 색을 고른다", () => {
    expect(resolveSeriesColor({ colorKey: "2025", role: "focus" }, "year", theme)).toBe(theme.palette.primary.main);
    expect(resolveSeriesColor({ colorKey: "grade2", role: "entity" }, "grade", theme)).toBe(theme.palette.chart.grade2);
    expect(resolveSeriesColor({ colorKey: "봉화", role: "entity" }, "union", theme)).toMatch(/^#/);
  });
});

describe("LineChart", () => {
  it("시리즈와 평년 범례를 그린다", () => {
    render(
      <ThemeProvider theme={theme}>
        <LineChart query={overlayQuery} result={runAnalysisQuery(rows, overlayQuery)} />
      </ThemeProvider>,
    );

    expect(screen.getByRole("img", { name: "단가 선 차트, 시리즈 1개" })).toBeInTheDocument();
    expect(screen.getByText("평년 중앙값")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });
});
