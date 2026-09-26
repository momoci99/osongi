import { useState } from "react";
import type { StationWeatherFile } from "../../../../utils/weather/publicWeather";
import {
  buildCumulativeRain,
  buildMonthlyStrips,
  seasonDaysByYear,
  type CumulativeRainModel,
  type MetricStrips,
} from "../../../../utils/weather/weatherNormals";

export type WeatherNormalsModel = {
  selectedYear: number;
  strips: MetricStrips[];
  cumulative: CumulativeRainModel;
  /** 수집 기록 기간 (예: "2013~2026") */
  recordRange: string;
};

/**
 * 평년 비교 대상 시즌과 모델.
 * 요약 띠와 평년 비교 차트가 같은 시즌을 보도록 한곳에서 고른다.
 */
const useWeatherNormals = (files: StationWeatherFile[] | null, years: number[]) => {
  const [pickedYear, setPickedYear] = useState<number | null>(null);
  if (!files || years.length === 0) return { model: null, selectYear: setPickedYear };

  /** 조합이 바뀌어 고른 시즌이 빠지면 최근 시즌으로 */
  const selectedYear = pickedYear !== null && years.includes(pickedYear) ? pickedYear : years[0];
  const byYear = seasonDaysByYear(files);
  const recordYears = [...byYear.keys()];
  const model: WeatherNormalsModel = {
    selectedYear,
    strips: buildMonthlyStrips(byYear, selectedYear),
    cumulative: buildCumulativeRain(byYear, selectedYear),
    recordRange: `${Math.min(...recordYears)}~${Math.max(...recordYears)}`,
  };
  return { model, selectYear: setPickedYear };
};

export default useWeatherNormals;
