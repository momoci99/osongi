import { KILOGRAMS_PER_TON, KRW_TEN_THOUSAND_UNIT, WON_PER_EOK } from "../../const/Units";
import type {
  AnalysisAxis,
  AnalysisGranularity,
  AnalysisMetric,
  AnalysisTime,
} from "./types";

/** 값과 단위를 분리한 표시 형식 — 좁은 폭에서 단위만 줄바꿈되지 않게 */
export type FormattedValue = { value: string; unit: string };

/** 퍼센트 환산 */
const PERCENT = 100;

/** 소수 한 자리 한국어 숫자 */
const decimal1 = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 1 미만 눈금용 — 불필요한 0을 붙이지 않는다 */
const compactDecimal = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 });

/** 정수 한국어 숫자 */
const integer = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

/** 단가(원/kg) → 만원/kg */
export const formatUnitPrice = (won: number): FormattedValue => ({
  value: decimal1.format(won / KRW_TEN_THOUSAND_UNIT),
  unit: "만원/kg",
});

/** 수량(kg) → 1톤 미만은 kg, 이상은 톤 */
export const formatQuantity = (kg: number): FormattedValue =>
  kg < KILOGRAMS_PER_TON
    ? { value: decimal1.format(kg), unit: "kg" }
    : { value: decimal1.format(kg / KILOGRAMS_PER_TON), unit: "톤" };

/** 금액(원) → 1억 미만은 만원, 이상은 억원 */
export const formatAmount = (won: number): FormattedValue =>
  won < WON_PER_EOK
    ? { value: integer.format(won / KRW_TEN_THOUSAND_UNIT), unit: "만원" }
    : { value: decimal1.format(won / WON_PER_EOK), unit: "억원" };

/** 비율(0~1) → % */
export const formatShare = (ratio: number): FormattedValue => ({
  value: decimal1.format(ratio * PERCENT),
  unit: "%",
});

/** 지표에 맞는 포맷 */
export const formatMetricValue = (
  metric: AnalysisMetric,
  value: number | null,
): FormattedValue => {
  if (value === null) return { value: "–", unit: "" };
  switch (metric) {
    case "unitPrice":
      return formatUnitPrice(value);
    case "amount":
      return formatAmount(value);
    case "gradeShare":
      return formatShare(value);
    default:
      return formatQuantity(value);
  }
};

/** 한 줄 문자열 (툴팁·표 셀용) */
export const formatMetricText = (metric: AnalysisMetric, value: number | null): string => {
  const formatted = formatMetricValue(metric, value);
  return formatted.unit ? `${formatted.value}${formatted.unit}` : formatted.value;
};

/** 정수 천 단위 구분 */
export const formatInteger = (value: number): string => integer.format(value);

/** 연도 목록이 빈틈 없이 이어지는지 */
const isContiguous = (years: number[]): boolean =>
  years.every((year, index) => index === 0 || year === years[index - 1] + 1);

/** YYYY-MM-DD → YYYY.MM.DD */
const dotDate = (date: string): string => date.replaceAll("-", ".");

/** 시간 범위 한 줄 설명 */
export const describeTime = (time: AnalysisTime): string => {
  if (time.kind === "range") return `${dotDate(time.start)} – ${dotDate(time.end)}`;

  const { years } = time;
  if (years.length === 0) return "선택 없음";
  if (years.length === 1) return `${years[0]} 시즌`;
  if (isContiguous(years)) {
    return `${years[0]}–${years[years.length - 1]} · ${years.length}개 시즌`;
  }
  return `${years.join(", ")} · ${years.length}개 시즌`;
};

/** x축 값 표시 — 축 종류와 집계 단위에 맞춘다 */
export const formatAxisValue = (
  axis: AnalysisAxis,
  x: string | number,
  granularity: AnalysisGranularity,
): string => {
  const weekSuffix = granularity === "week" ? "~" : "";
  switch (axis) {
    case "year":
      return `${x}`;
    case "seasonDay":
      return `${x}일차${weekSuffix}`;
    case "monthDay": {
      const [month, day] = String(x).split("-").map(Number);
      return `${month}/${day}${weekSuffix}`;
    }
    default:
      return `${dotDate(String(x))}${weekSuffix}`;
  }
};

/** 축 눈금용 짧은 숫자 (단위 포함) */
export const formatAxisTick = (metric: AnalysisMetric, value: number): string => {
  switch (metric) {
    case "unitPrice":
      return `${integer.format(value / KRW_TEN_THOUSAND_UNIT)}만`;
    case "amount":
      return value >= WON_PER_EOK
        ? `${decimal1.format(value / WON_PER_EOK)}억`
        : `${integer.format(value / KRW_TEN_THOUSAND_UNIT)}만`;
    case "gradeShare":
      return `${integer.format(value * PERCENT)}%`;
    default:
      if (value >= KILOGRAMS_PER_TON) return `${decimal1.format(value / KILOGRAMS_PER_TON)}t`;
      return value > 0 && value < 1 ? `${compactDecimal.format(value)}kg` : `${integer.format(value)}kg`;
  }
};
