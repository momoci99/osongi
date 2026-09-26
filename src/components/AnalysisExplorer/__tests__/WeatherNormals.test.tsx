import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import WeatherNormals from "../charts/WeatherNormals";
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

describe("WeatherNormals", () => {
  it("기록 기간을 밝히고 최근 시즌을 기본으로 두 차트를 그린다", () => {
    withTheme(<WeatherNormals files={[file]} years={[2024, 2023]} />);

    expect(screen.getByText(/2022~2024년 기록/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /2024 시즌의 달별/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /2024 시즌 7월부터의 누적 강수/ })).toBeInTheDocument();
    expect(screen.getByText("역대 범위 (2개 시즌)")).toBeInTheDocument();
  });

  it("시즌 칩으로 비교 대상을 바꾼다", () => {
    withTheme(<WeatherNormals files={[file]} years={[2024, 2023]} />);
    fireEvent.click(screen.getByRole("button", { name: "2023 시즌" }));

    expect(screen.getByRole("img", { name: /2023 시즌의 달별/ })).toBeInTheDocument();
  });

  it("고를 시즌이 없으면 그리지 않는다", () => {
    const { container } = withTheme(<WeatherNormals files={[file]} years={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
