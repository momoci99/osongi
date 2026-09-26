import type { CumulativeRainModel, MetricStrips, NormalMetricKey, NormalRank } from "./weatherNormals";

/** 한 지표의 최근 달 사실 */
export type MonthFact = {
  key: NormalMetricKey;
  month: number;
  value: number;
  rank: NormalRank | null;
  /** 진행 중인 달이면 마지막 관측일 */
  partialUntil: string | null;
};

/** 누적 강수의 마지막 관측일 사실 */
export type CumulativeRainFact = {
  /** MM-DD */
  monthDay: string;
  value: number;
  rank: NormalRank | null;
};

/**
 * 지표별로 순위가 매겨진 가장 최근 달을 고른다.
 * 순위가 있는 달이 없으면(첫 달이 진행 중) 진행 중인 달이라도 값만 보여준다.
 */
export const latestMonthFact = (strips: MetricStrips[], key: NormalMetricKey): MonthFact | null => {
  const months = strips.find((strip) => strip.key === key)?.months ?? [];
  const withValue = months.filter((month) => month.selected !== null);
  const ranked = withValue.filter((month) => month.rank !== null);
  const picked = ranked.at(-1) ?? withValue.at(-1);
  if (!picked?.selected) return null;
  return {
    key,
    month: picked.month,
    value: picked.selected.value,
    rank: picked.rank,
    partialUntil: picked.selected.partialUntil,
  };
};

/** 선택 시즌 누적 강수의 마지막 값 */
export const latestCumulativeRain = (model: CumulativeRainModel): CumulativeRainFact | null => {
  const last = model.days.filter((day) => day.selected !== null).at(-1);
  return last && last.selected !== null ? { monthDay: last.monthDay, value: last.selected, rank: last.rank } : null;
};
