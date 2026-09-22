import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import WeatherChart from "../charts/WeatherChart";
import { runAnalysisQuery } from "../../../utils/analysisQuery/runQuery";
import { makeQuery, makeRow } from "../../../utils/analysisQuery/__tests__/fixtures";
import type { StationWeatherFile } from "../../../utils/weather/publicWeather";

const withTheme = (node: React.ReactNode) => render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);

const query = makeQuery({
  view: "weather",
  groupBy: "year",
  metric: "quantity",
  granularity: "day",
  time: { kind: "seasons", years: [2024] },
});

const stationFile = (stationId: number): StationWeatherFile => {
  const filled = Array<number>(153).fill(10);
  return {
    stationId,
    generatedAt: "",
    startMonthDay: "07-01",
    years: { "2024": { avgTa: filled, minTa: filled, maxTa: filled, sumRn: filled, avgRhm: filled, avgTs: filled } },
  };
};

describe("WeatherChart", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const stationId = Number(url.match(/(\d+)\.json$/)?.[1]);
        return Promise.resolve(new Response(JSON.stringify(stationFile(stationId))));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("관측소 파일을 받아 시즌 패널을 그리고 출처를 밝힌다", async () => {
    const rows = [makeRow("2024-09-20", { union: "봉화", region: "경북", grade: "grade1", quantity: 3 })];
    withTheme(<WeatherChart result={runAnalysisQuery(rows, query)} />);

    expect(await screen.findByRole("img", { name: "시즌 1개의 일 공판량·강수·기온" })).toBeInTheDocument();
    expect(screen.getByText(/기상청 ASOS 봉화 관측소/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/weather/271.json");
  });

  it("대체 관측소는 어느 조합 인근인지 밝히고, 여러 곳이면 평균임을 알린다", async () => {
    const rows = [
      makeRow("2024-09-20", { union: "양양", region: "강원", grade: "grade1", quantity: 1 }),
      makeRow("2024-09-20", { union: "봉화", region: "경북", grade: "grade1", quantity: 1 }),
    ];
    withTheme(<WeatherChart result={runAnalysisQuery(rows, query)} />);

    expect(await screen.findByText(/관측소 2곳 평균 — 속초\(양양 인근\), 봉화/)).toBeInTheDocument();
  });

  it("옮긴 강수는 켰을 때만 범례·설명에 나온다", async () => {
    const rows = [makeRow("2024-09-20", { union: "봉화", region: "경북", grade: "grade1", quantity: 3 })];
    withTheme(<WeatherChart result={runAnalysisQuery(rows, query)} />);
    await screen.findByRole("img", { name: /시즌 1개/ });

    expect(screen.queryByText("22일 전 강수")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /비를 22일 뒤로 옮겨 보기/ }));
    expect(screen.getByText("22일 전 강수")).toBeInTheDocument();
    expect(screen.getByText(/예측에 쓰기는 어렵습니다/)).toBeInTheDocument();
  });
});
