import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import WeatherNormals from "../charts/WeatherNormals";
import WeatherSummary from "../charts/WeatherNormals/WeatherSummary";
import useWeatherNormals from "../charts/WeatherNormals/useWeatherNormals";
import type { StationWeatherFile, WeatherYearValues } from "../../../utils/weather/publicWeather";

const withTheme = (node: React.ReactNode) => render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);

const yearValues = (value: number): WeatherYearValues => {
  const filled = Array<number>(153).fill(value);
  return { avgTa: filled, minTa: filled, maxTa: filled, sumRn: filled, avgRhm: filled, avgTs: filled };
};

const file: StationWeatherFile = {
  stationId: 271,
  generatedAt: "",
  startMonthDay: "07-01",
  years: { "2022": yearValues(1), "2023": yearValues(2), "2024": yearValues(3) },
};

/** 요약 띠(시즌 선택)와 평년 비교를 날씨 뷰처럼 함께 그린다 */
const Harness = ({ years }: { years: number[] }) => {
  const { model, selectYear } = useWeatherNormals([file], years);
  if (!model) return null;
  return (
    <>
      <WeatherSummary model={model} years={years} onSelectYear={selectYear} quantity={1500} />
      <WeatherNormals model={model} />
    </>
  );
};

describe("WeatherNormals", () => {
  it("기록 기간을 밝히고 최근 시즌을 기본으로 두 차트를 그린다", () => {
    withTheme(<Harness years={[2024, 2023]} />);

    expect(screen.getByText(/2022~2024년 기록 가운데/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /2024 시즌의 달별/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /2024 시즌 7월부터의 누적 강수/ })).toBeInTheDocument();
    expect(screen.getByText("역대 범위 (2개 시즌)")).toBeInTheDocument();
  });

  it("요약 띠에 시즌 공판량과 누적 강수 순위를 보여준다", () => {
    withTheme(<Harness years={[2024, 2023]} />);

    expect(screen.getByText("1.5")).toBeInTheDocument();
    expect(screen.getByText("톤")).toBeInTheDocument();
    expect(screen.getByText("7월부터 쌓인 비")).toBeInTheDocument();
    expect(screen.getByText(/3년 중 가장 많음/)).toBeInTheDocument();
  });

  it("시즌 칩으로 비교 대상을 바꾼다", () => {
    withTheme(<Harness years={[2024, 2023]} />);
    fireEvent.click(screen.getByRole("button", { name: "2023 시즌" }));

    expect(screen.getByRole("img", { name: /2023 시즌의 달별/ })).toBeInTheDocument();
  });

  it("고를 시즌이 없으면 그리지 않는다", () => {
    const { container } = withTheme(<Harness years={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
