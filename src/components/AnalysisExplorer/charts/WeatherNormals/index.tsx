import { useState, type ReactNode } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import FilterChip from "../../Controls/FilterChip";
import LegendSwatch from "../WeatherChart/LegendSwatch";
import MonthlyStripsChart from "./MonthlyStripsChart";
import CumulativeRainChart from "./CumulativeRainChart";
import { CUMULATIVE_RAIN_CHART } from "../../../../const/AnalysisLayout";
import { WEATHER_NORMAL } from "../../../../const/Weather";
import type { StationWeatherFile } from "../../../../utils/weather/publicWeather";
import {
  buildCumulativeRain,
  buildMonthlyStrips,
  seasonDaysByYear,
} from "../../../../utils/weather/weatherNormals";

type WeatherNormalsProps = {
  files: StationWeatherFile[];
  /** 고를 수 있는 시즌 (V1 에 그린 시즌, 최근 순) */
  years: number[];
};

const GUTTER = { xs: 1.75, sm: 2.25 };

/** 소제목 */
const SubTitle = ({ children }: { children: ReactNode }) => (
  <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "text.primary", mb: 1 }}>{children}</Typography>
);

/** 캡션 한 줄 */
const Caption = ({ children }: { children: ReactNode }) => (
  <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", lineHeight: 1.6 }}>{children}</Typography>
);

/**
 * 평년과 비교 (V2) — 고른 시즌의 날씨를 수집한 전 시즌 기록 위에 놓는다.
 * 순위·범위 사실만 보여주고 풍흉 해석은 하지 않는다 (기획서 7-1).
 */
const WeatherNormals = ({ files, years }: WeatherNormalsProps) => {
  const theme = useTheme();
  const [pickedYear, setPickedYear] = useState<number | null>(null);
  if (years.length === 0) return null;

  /** 조합이 바뀌어 고른 시즌이 빠지면 최근 시즌으로 */
  const selectedYear = pickedYear !== null && years.includes(pickedYear) ? pickedYear : years[0];
  const byYear = seasonDaysByYear(files);
  const strips = buildMonthlyStrips(byYear, selectedYear);
  const cumulative = buildCumulativeRain(byYear, selectedYear);
  const recordYears = [...byYear.keys()];
  const recordRange = `${Math.min(...recordYears)}~${Math.max(...recordYears)}`;
  const { weather } = theme.palette.chart;

  return (
    <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid", borderColor: "surface.border" }}>
      <Box sx={{ px: GUTTER, pb: 1.5 }}>
        <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>평년과 비교</Typography>
        <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mt: 0.25 }}>
          고른 시즌의 날씨가 {recordRange}년 기록 가운데 어디쯤인지
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
          {years.map((year) => (
            <FilterChip key={year} selected={year === selectedYear} onClick={() => setPickedYear(year)}>
              {year} 시즌
            </FilterChip>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: GUTTER, pt: 1 }}>
        <SubTitle>달마다 역대 몇 번째인가</SubTitle>
        <MonthlyStripsChart strips={strips} selectedYear={selectedYear} />
        <Box sx={{ pt: 1, display: "grid", gap: 0.25 }}>
          <Caption>
            점 하나가 한 해입니다. 진한 점이 {selectedYear} 시즌, 세로 눈금이 역대 중앙값입니다. 순위는 {recordRange}년
            중 그 달 기록이 있는 해끼리 셉니다 (점에 올리면 전체 해 수). 빈 점은 진행 중인 달이라 순위를 매기지
            않았습니다.
          </Caption>
          <Caption>
            줄마다 눈금 범위가 달라 달끼리 크기를 비교하는 용도는 아닙니다. 관측일이{" "}
            {Math.round(WEATHER_NORMAL.MIN_COVERAGE * 100)}%에 못 미치는 달은 뺐습니다.
          </Caption>
        </Box>
      </Box>

      <Box sx={{ pt: 3 }}>
        <Box sx={{ px: GUTTER }}>
          <SubTitle>7월부터 쌓인 비</SubTitle>
        </Box>
        <CumulativeRainChart model={cumulative} selectedYear={selectedYear} />
        <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: 0.75, px: GUTTER, pt: 1.25 }}>
          <LegendSwatch color={weather.rain} label={`${selectedYear} 시즌`} variant="line" />
          <LegendSwatch color={theme.palette.text.secondary} label="역대 중앙값" variant="dashed" />
          <LegendSwatch
            color={weather.rain}
            label={`역대 범위 (${cumulative.bandYears}개 시즌)`}
            variant="band"
            opacity={CUMULATIVE_RAIN_CHART.BAND_OPACITY[theme.palette.mode] * 2}
          />
        </Box>
        <Box sx={{ px: GUTTER, pt: 1 }}>
          <Caption>
            띠는 {selectedYear} 시즌을 뺀 나머지 시즌들의 최소~최대입니다. 날씨 기록만 나란히 놓은 것으로, 송이
            작황을 판정하지 않습니다.
          </Caption>
        </Box>
      </Box>
    </Box>
  );
};

export default WeatherNormals;
