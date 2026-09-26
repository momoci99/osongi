import { Box, Typography } from "@mui/material";
import FilterChip from "../../Controls/FilterChip";
import SummaryBand from "../../Summary/SummaryBand";
import SummaryTile from "../../Summary/SummaryTile";
import { formatQuantity } from "../../../../utils/analysisQuery/format";
import { describeRank, NORMAL_METRICS, type NormalMetricKey } from "../../../../utils/weather/weatherNormals";
import { latestCumulativeRain, latestMonthFact, type MonthFact } from "../../../../utils/weather/weatherSummary";
import type { WeatherNormalsModel } from "./useWeatherNormals";

type WeatherSummaryProps = {
  model: WeatherNormalsModel;
  /** 고를 수 있는 시즌 (최근 순) */
  years: number[];
  onSelectYear: (year: number) => void;
  /** 선택 시즌 공판량 합 (kg) */
  quantity: number;
};

/** MM-DD → "9.25" */
const shortDate = (monthDay: string): string => `${Number(monthDay.slice(0, 2))}.${Number(monthDay.slice(3))}`;

/** 기온류 달 요약 칸 */
const MonthTile = ({ fact, label }: { fact: MonthFact | null; label: string }) => {
  if (!fact) return <SummaryTile label={label} value="–" />;
  const caption = fact.rank
    ? describeRank(fact.rank, fact.key)
    : fact.partialUntil
      ? `${shortDate(fact.partialUntil.slice(5))}까지 · 달이 끝나면 순위`
      : undefined;
  return (
    <SummaryTile
      label={`${fact.month}월 ${label}`}
      value={fact.value.toFixed(1)}
      unit={NORMAL_METRICS[fact.key].unit}
      caption={caption}
    />
  );
};

const MONTH_METRICS: { key: NormalMetricKey; label: string }[] = [
  { key: "avgTa", label: "평균기온" },
  { key: "groundTemp", label: "평균 지면온도" },
];

/** 날씨 뷰 요약 띠 — 고른 시즌의 공판량과 날씨가 역대 기록 가운데 어디쯤인지 */
const WeatherSummary = ({ model, years, onSelectYear, quantity }: WeatherSummaryProps) => {
  const rain = latestCumulativeRain(model.cumulative);
  const formatted = formatQuantity(quantity);

  return (
    <SummaryBand
      header={
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mb: 1.5 }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary", mr: 0.5 }}>
            기준 시즌
          </Typography>
          {years.map((year) => (
            <FilterChip key={year} selected={year === model.selectedYear} onClick={() => onSelectYear(year)}>
              {year} 시즌
            </FilterChip>
          ))}
          <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", ml: 0.5 }}>
            순위는 {model.recordRange}년 기록 기준
          </Typography>
        </Box>
      }
    >
      <SummaryTile label="시즌 공판량" value={formatted.value} unit={formatted.unit} emphasis />
      <SummaryTile
        label="7월부터 쌓인 비"
        value={rain ? Math.round(rain.value).toLocaleString("ko-KR") : "–"}
        unit={rain ? "mm" : undefined}
        caption={
          rain
            ? [`${shortDate(rain.monthDay)}까지`, rain.rank ? describeRank(rain.rank, "rain") : null]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
      />
      {MONTH_METRICS.map((metric) => (
        <MonthTile key={metric.key} fact={latestMonthFact(model.strips, metric.key)} label={metric.label} />
      ))}
    </SummaryBand>
  );
};

export default WeatherSummary;
