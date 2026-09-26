import type { ReactNode } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import LegendSwatch from "../WeatherChart/LegendSwatch";
import MonthlyStripsChart from "./MonthlyStripsChart";
import CumulativeRainChart from "./CumulativeRainChart";
import { CUMULATIVE_RAIN_CHART, WEATHER_NORMALS_LAYOUT } from "../../../../const/AnalysisLayout";
import { WEATHER_NORMAL } from "../../../../const/Weather";
import type { WeatherNormalsModel } from "./useWeatherNormals";

type WeatherNormalsProps = {
  model: WeatherNormalsModel;
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
 * 넓으면 점 줄·누적 강수를 좌우 두 칸, 좁으면 위아래로 둔다.
 * 순위·범위 사실만 보여주고 풍흉 해석은 하지 않는다 (기획서 7-1).
 */
const WeatherNormals = ({ model }: WeatherNormalsProps) => {
  const theme = useTheme();
  const { selectedYear, strips, cumulative, recordRange } = model;
  const { weather } = theme.palette.chart;

  return (
    <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid", borderColor: "surface.border" }}>
      <Box sx={{ px: GUTTER, pb: 1.5 }}>
        <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>평년과 비교 · {selectedYear} 시즌</Typography>
        <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mt: 0.25 }}>
          고른 시즌의 날씨가 {recordRange}년 기록 가운데 어디쯤인지 — 기준 시즌은 위 요약에서 바꿉니다
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${WEATHER_NORMALS_LAYOUT.COLUMN_MIN_WIDTH}px, 1fr))`,
          alignItems: "start",
          rowGap: 3,
        }}
      >
        <Box sx={{ px: GUTTER, pt: 1, minWidth: 0 }}>
          <SubTitle>달마다 역대 몇 번째인가</SubTitle>
          <MonthlyStripsChart strips={strips} selectedYear={selectedYear} />
          <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: 0.75, pt: 1.25 }}>
            <LegendSwatch color={theme.palette.text.primary} label={`${selectedYear} 시즌`} variant="dot" />
            <LegendSwatch color={theme.palette.text.primary} label="진행 중인 달 (순위 없음)" variant="ring" />
            <LegendSwatch color={theme.palette.text.secondary} label="다른 해" variant="dot" opacity={0.4} />
            <LegendSwatch color={theme.palette.text.secondary} label="역대 중앙값" variant="tick" />
          </Box>
          <Box sx={{ pt: 1 }}>
            <Caption>
              순위는 {recordRange}년 중 그 달 기록이 있는 해끼리 셉니다. 줄마다 눈금 범위(양 끝 값)가 달라 달끼리
              크기를 비교하지는 않습니다. 관측일이 {Math.round(WEATHER_NORMAL.MIN_COVERAGE * 100)}%에 못 미치는 달은
              뺐습니다.
            </Caption>
          </Box>
        </Box>

        <Box sx={{ pt: 1, minWidth: 0 }}>
          <Box sx={{ px: GUTTER }}>
            <SubTitle>7월부터 쌓인 비 (mm)</SubTitle>
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
    </Box>
  );
};

export default WeatherNormals;
