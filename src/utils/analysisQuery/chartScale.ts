import { LINE_CHART, SEASON_STRIP } from "../../const/AnalysisLayout";
import { toSeasonDay } from "./rows";
import { seasonWindowStart, toWindowOffset } from "./seasonWindow";
import type { AnalysisAxis, AnalysisGranularity } from "./types";

/**
 * x축 눈금
 * - pinned: 도메인 밖이어도 안쪽 끝으로 당겨 그린다 (시즌 연도 라벨 전용 — 날짜 라벨은 당기면 다른 날을 가리킨다)
 * - fine: 굵은 눈금이 부족할 때만 쓰는 보충 눈금
 */
export type AxisTick = { position: number; label: string; major: boolean; pinned?: boolean; fine?: boolean };

/** x 값 ↔ 연속 위치 매핑 */
export type ChartXMapping = {
  toPosition: (x: string | number) => number;
  domain: [number, number];
  ticks: (segmentWidthPx: number) => AxisTick[];
  /** 달력 기간 축에서 시즌 경계 (구분선용) */
  boundaries: number[];
  /** 선을 끊는 위치 간격 */
  gapBreak: number;
};

/** 월 첫날 MM-DD 목록 (시즌 창 안쪽) */
const MONTH_STARTS = ["10-01", "11-01"];

/** 보름 눈금 MM-DD 목록 */
const MID_MONTHS = ["09-15", "10-15", "11-15"];

/** 보충 눈금을 두는 날짜 (일) — 시즌 초처럼 구간이 짧을 때만 쓰인다 */
const FINE_TICK_DAYS = [5, 10, 20, 25];

/** 시즌 창 안쪽 보충 눈금 MM-DD 목록 */
const FINE_MONTH_DAYS = ["09", "10", "11"].flatMap((month) =>
  FINE_TICK_DAYS.map((day) => `${month}-${String(day).padStart(2, "0")}`),
);

/** MM-DD → "M/D" */
const monthDayLabel = (monthDay: string): string =>
  `${Number(monthDay.slice(0, 2))}/${Number(monthDay.slice(3))}`;

/** 선을 끊는 공백 기준 */
const gapBreakFor = (granularity: AnalysisGranularity): number =>
  granularity === "week" ? LINE_CHART.GAP_BREAK_DAYS_WEEK : LINE_CHART.GAP_BREAK_DAYS;

/** 숫자 목록의 [최소, 최대] */
const extent = (values: number[]): [number, number] =>
  values.length === 0 ? [0, 1] : [Math.min(...values), Math.max(...values)];

/** 시즌 창 기준 월일 → 오프셋 (윤년 무관한 기준 연도 사용) */
const monthDayOffset = (monthDay: string): number => toWindowOffset(`2001-${monthDay}`);

/**
 * 달력 날짜 축 — 여러 시즌에 걸치면 비시즌을 접어 시즌 창만 이어 붙인다.
 * 위치 = 시즌 순번 × (창 길이 + 간격) + 창 내 오프셋
 */
const buildDateMapping = (values: string[], granularity: AnalysisGranularity): ChartXMapping => {
  const years = [...new Set(values.map((value) => Number(value.slice(0, 4))))].sort((a, b) => a - b);
  const span = SEASON_STRIP.WINDOW_DAYS + LINE_CHART.SEASON_GAP_DAYS;
  const yearIndex = new Map(years.map((year, index) => [year, index]));
  const toPosition = (x: string | number) => {
    const date = String(x);
    return (yearIndex.get(Number(date.slice(0, 4))) ?? 0) * span + toWindowOffset(date);
  };
  const positions = values.map(toPosition);
  const multiSeason = years.length > 1;

  return {
    toPosition,
    domain: extent(positions),
    boundaries: years.slice(1).map((_, index) => (index + 1) * span - LINE_CHART.SEASON_GAP_DAYS / 2),
    gapBreak: gapBreakFor(granularity),
    ticks: (segmentWidthPx) =>
      years.flatMap((year, index) => {
        const base = index * span;
        const toTick = (monthDay: string, fine = false): AxisTick => ({
          position: base + toSeasonDay(`${year}-${monthDay}`, seasonWindowStart(year)) - 1,
          label: monthDayLabel(monthDay),
          major: false,
          fine,
        });
        if (!multiSeason) {
          return [
            ...["09-01", ...MONTH_STARTS, ...MID_MONTHS].map((monthDay) => toTick(monthDay)),
            ...FINE_MONTH_DAYS.map((monthDay) => toTick(monthDay, true)),
          ];
        }
        const yearTick: AxisTick = { position: base, label: String(year), major: true, pinned: true };
        const showMonths = segmentWidthPx >= LINE_CHART.MONTH_TICK_MIN_SEGMENT_WIDTH;
        return [yearTick, ...(showMonths ? MONTH_STARTS.map((monthDay) => toTick(monthDay)) : [])];
      }),
  };
};

/** 월일 축 — 모든 연도를 같은 시즌 창에 겹친다 */
const buildMonthDayMapping = (values: string[], granularity: AnalysisGranularity): ChartXMapping => {
  const toPosition = (x: string | number) => monthDayOffset(String(x));
  return {
    toPosition,
    domain: extent(values.map(toPosition)),
    boundaries: [],
    gapBreak: gapBreakFor(granularity),
    ticks: () => [
      ...["09-01", ...MONTH_STARTS, ...MID_MONTHS].map((monthDay) => ({
        position: monthDayOffset(monthDay),
        label: monthDayLabel(monthDay),
        major: monthDay.endsWith("-01"),
      })),
      ...FINE_MONTH_DAYS.map((monthDay) => ({
        position: monthDayOffset(monthDay),
        label: monthDayLabel(monthDay),
        major: false,
        fine: true,
      })),
    ],
  };
};

/** 숫자 축 (시즌 일차·연도) */
const buildNumericMapping = (
  values: number[],
  axis: AnalysisAxis,
  granularity: AnalysisGranularity,
): ChartXMapping => {
  const domain = extent(values);
  return {
    toPosition: (x) => Number(x),
    domain,
    boundaries: [],
    gapBreak: axis === "year" ? Number.POSITIVE_INFINITY : gapBreakFor(granularity),
    ticks: () => {
      if (axis === "year") {
        return values.map((year) => ({ position: year, label: String(year), major: false }));
      }
      const ticks: AxisTick[] = [{ position: 1, label: "1일차", major: true }];
      for (let day = LINE_CHART.SEASON_DAY_TICK_STEP; day <= domain[1]; day += LINE_CHART.SEASON_DAY_TICK_STEP) {
        ticks.push({ position: day, label: `${day}일차`, major: false });
      }
      return ticks;
    },
  };
};

/**
 * 도메인 안에 그릴 눈금 후보.
 * 시즌 연도 라벨(pinned)은 데이터 시작이 창 시작보다 늦어도 잘리지 않게 안쪽 끝으로 당기고,
 * 시즌 초처럼 구간이 짧아 굵은 눈금이 모자랄 때만 보충 눈금을 섞는다.
 */
export const ticksInDomain = (ticks: AxisTick[], [start, end]: [number, number]): AxisTick[] => {
  const inDomain = ticks
    .map((tick) => (tick.pinned ? { ...tick, position: Math.min(Math.max(tick.position, start), end) } : tick))
    .filter((tick) => tick.position >= start && tick.position <= end);
  const coarse = inDomain.filter((tick) => !tick.fine);
  return coarse.length >= LINE_CHART.MIN_X_TICKS ? coarse : inDomain;
};

/** 축 종류별 x 매핑을 만든다 */
export const buildXMapping = (
  axis: AnalysisAxis,
  xValues: (string | number)[],
  granularity: AnalysisGranularity,
): ChartXMapping => {
  const unique = [...new Set(xValues)];
  if (axis === "date") return buildDateMapping(unique.map(String), granularity);
  if (axis === "monthDay") return buildMonthDayMapping(unique.map(String), granularity);
  return buildNumericMapping(unique.map(Number), axis, granularity);
};

/** 연속 위치 포인트 */
export type PositionedPoint = { position: number };

/**
 * 공백이 기준보다 긴 곳에서 포인트를 끊어 선분 목록으로 나눈다.
 * 누계처럼 끊기면 안 되는 지표는 기준을 무한대로 넘긴다.
 */
export const splitByGap = <T extends PositionedPoint>(points: T[], gapBreak: number): T[][] => {
  const segments: T[][] = [];
  let current: T[] = [];
  for (const point of points) {
    const previous = current[current.length - 1];
    if (previous && point.position - previous.position > gapBreak) {
      segments.push(current);
      current = [];
    }
    current.push(point);
  }
  if (current.length > 0) segments.push(current);
  return segments;
};

/**
 * 직접 라벨 세로 위치를 최소 간격으로 밀어낸다 (입력 순서 유지).
 * 아래로 밀다 플롯 바닥(maxY)을 넘으면 거꾸로 위로 다시 민다.
 */
export const spreadLabels = (ys: number[], minGap: number, maxY = Number.POSITIVE_INFINITY): number[] => {
  const order = ys.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < order.length; i += 1) {
    order[i].y = Math.max(order[i].y, order[i - 1].y + minGap);
  }
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const limit = i === order.length - 1 ? maxY : order[i + 1].y - minGap;
    order[i].y = Math.min(order[i].y, limit);
  }
  const result = new Array<number>(ys.length);
  for (const item of order) result[item.index] = item.y;
  return result;
};
