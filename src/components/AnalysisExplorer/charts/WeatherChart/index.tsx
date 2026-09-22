import { useState } from "react";
import { Box, Skeleton, Typography, useTheme } from "@mui/material";
import FilterChip from "../../Controls/FilterChip";
import { chartTooltipSx } from "../chartTooltip";
import useDrawWeatherChart from "./useDrawWeatherChart";
import useStationWeather from "../../../../hooks/useStationWeather";
import {
  EXPLORER_LAYOUT,
  WEATHER_CHART,
} from "../../../../const/AnalysisLayout";
import { RAIN_LAG_HINT } from "../../../../const/Weather";
import {
  buildSeasonWeather,
  stationsForUnions,
  type ScopeStation,
} from "../../../../utils/weather/seasonWeather";
import { buildWeatherChartModel } from "../../../../utils/weather/weatherChartModel";
import type { AnalysisResultCore } from "../../../../utils/analysisQuery/types";

type WeatherChartProps = {
  result: AnalysisResultCore;
};

type LegendSwatchProps = {
  color: string;
  label: string;
  variant: "bar" | "band" | "line";
  opacity?: number;
};

/** 범례 항목 — 색 표본은 마크 모양을 따르고 글자는 텍스트 색 */
const LegendSwatch = ({
  color,
  label,
  variant,
  opacity = 1,
}: LegendSwatchProps) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <Box
        component="span"
        sx={{
          width: variant === "bar" ? 8 : 16,
          height: variant === "line" ? 0 : 10,
          borderTop: variant === "line" ? `2px solid ${color}` : "none",
          bgcolor: variant === "line" ? "transparent" : color,
          /** 범례 표본은 작아 차트 밴드와 같은 불투명도면 거의 안 보인다 — 두 배로 */
          opacity:
            variant === "band"
              ? WEATHER_CHART.TEMPERATURE_BAND_OPACITY[theme.palette.mode] * 2
              : opacity,
          borderRadius: "2px",
        }}
      />
      <Typography
        component="span"
        sx={{ fontSize: "0.75rem", fontWeight: 500, color: "text.secondary" }}
      >
        {label}
      </Typography>
    </Box>
  );
};

/** 관측소 출처 문구 — 대체 지점은 어느 조합 대신인지 밝힌다 */
const describeStations = (stations: ScopeStation[]): string => {
  const names = stations.map((s) =>
    s.isSubstitute
      ? `${s.stationName}(${s.unions.join("·")} 인근)`
      : s.stationName,
  );
  return stations.length === 1
    ? `기상청 ASOS ${names[0]} 관측소`
    : `기상청 ASOS 관측소 ${stations.length}곳 평균 — ${names.join(", ")}`;
};

/** 캡션 한 줄 */
const Note = ({ children }: { children: React.ReactNode }) => (
  <Typography
    sx={{ fontSize: "0.75rem", color: "text.disabled", lineHeight: 1.6 }}
  >
    {children}
  </Typography>
);

type WeatherChartBodyProps = WeatherChartProps & {
  stations: ScopeStation[];
};

/** 관측소가 정해진 뒤의 차트 본체 */
const WeatherChartBody = ({ result, stations }: WeatherChartBodyProps) => {
  const theme = useTheme();
  const [showShiftedRain, setShowShiftedRain] = useState(false);
  const { files, loading, error } = useStationWeather(
    stations.map((s) => s.stationId),
  );

  const model = files
    ? buildWeatherChartModel(
        result.series,
        (dates) => buildSeasonWeather(files, dates),
        showShiftedRain,
      )
    : null;
  const { containerRef, svgRef, tooltipRef } = useDrawWeatherChart({
    model,
    showShiftedRain,
    theme,
  });
  const { weather, weight } = theme.palette.chart;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
          px: { xs: 1.75, sm: 2.25 },
          pb: 1.5,
        }}
      >
        <FilterChip
          selected={showShiftedRain}
          onClick={() => setShowShiftedRain((on) => !on)}
          dotColor={weather.rain}
        >
          비를 {RAIN_LAG_HINT.LAG_DAYS}일 뒤로 옮겨 보기
        </FilterChip>
        <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>
          참고용
        </Typography>
      </Box>

      {/** 폭 측정 컨테이너는 항상 마운트한다 — 로딩 뒤에 붙이면 ResizeObserver 가 붙지 않는다 */}
      <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
        {error ? (
          <Box sx={{ px: { xs: 1.75, sm: 2.25 }, py: 2 }}>
            <Typography color="error" sx={{ fontSize: "0.8125rem" }}>
              기상 자료를 불러오지 못했습니다: {error.message}
            </Typography>
          </Box>
        ) : loading || !model ? (
          <Box sx={{ px: { xs: 1, sm: 1.5 } }}>
            <Skeleton
              variant="rounded"
              height={EXPLORER_LAYOUT.VIEW_MIN_HEIGHT}
            />
          </Box>
        ) : null}
        <svg
          ref={svgRef}
          role="img"
          aria-label={
            model
              ? `시즌 ${model.panels.length}개의 일 공판량·강수·기온`
              : "기상 자료 불러오는 중"
          }
          style={{ display: model && !error ? "block" : "none" }}
        />
        <Box ref={tooltipRef} sx={chartTooltipSx} aria-hidden />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          columnGap: 2,
          rowGap: 0.75,
          px: { xs: 1.75, sm: 2.25 },
          pt: 1.25,
        }}
      >
        <LegendSwatch color={weight.main} label="일 공판량" variant="bar" />
        <LegendSwatch color={weather.rain} label="일 강수량" variant="bar" />
        {showShiftedRain ? (
          <LegendSwatch
            color={weather.rain}
            label={`${RAIN_LAG_HINT.LAG_DAYS}일 전 강수`}
            variant="bar"
            opacity={WEATHER_CHART.SHIFTED_RAIN_OPACITY}
          />
        ) : null}
        <LegendSwatch
          color={weather.temperature}
          label="최저~최고 기온"
          variant="band"
        />
        <LegendSwatch color={weather.ground} label="지면온도" variant="line" />
      </Box>

      <Box
        sx={{
          px: { xs: 1.75, sm: 2.25 },
          pt: 1.25,
          display: "grid",
          gap: 0.25,
        }}
      >
        <Note>{describeStations(stations)} · 공공누리 제1유형</Note>
        <Note>
          관측소는 읍·면 평지에 있어 산지 송이 발생지의 기온·지면온도와 차이가
          있습니다.
        </Note>
        {showShiftedRain ? (
          <Note>
            흐린 막대는 {RAIN_LAG_HINT.LAG_DAYS}일 전 비입니다. 지난 시즌들에서
            비가 온 뒤 약 3주 후 공판량이 늘어나는 약한 경향이 있었지만, 해마다
            달라 예측에 쓰기는 어렵습니다.
          </Note>
        ) : null}
        {model && model.hiddenYears.length > 0 ? (
          <Note>
            최근 {WEATHER_CHART.MAX_PANELS}개 시즌만 표시합니다 —{" "}
            {model.hiddenYears.join(", ")} 시즌은 빼고 그렸습니다.
          </Note>
        ) : null}
      </Box>
    </Box>
  );
};

/**
 * 날씨 뷰 — 시즌별 공판량과 강수·기온을 같은 날짜축에 세로로 나열.
 * 관측소 유무로 본체를 나눠, 본체는 항상 차트 컨테이너와 함께 마운트되게 한다.
 */
const WeatherChart = ({ result }: WeatherChartProps) => {
  const stations = stationsForUnions(result.includedUnions);
  if (stations.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Note>선택한 조합에 대응하는 기상 관측소가 없습니다.</Note>
      </Box>
    );
  }
  return <WeatherChartBody result={result} stations={stations} />;
};

export default WeatherChart;
