import * as d3 from "d3";
import type { Axis, NumberValue, ScaleTime } from "d3";

const createEvenlySpacedTicks = (dates: Date[], maxTicks: number): Date[] => {
  if (dates.length <= maxTicks) {
    return dates;
  }

  const selectedTicks: Date[] = [];
  const lastIndex = dates.length - 1;

  for (let index = 0; index < maxTicks; index += 1) {
    const targetIndex = Math.round((index * lastIndex) / (maxTicks - 1));
    const date = dates[targetIndex];

    if (!selectedTicks.some((tick) => tick.getTime() === date.getTime())) {
      selectedTicks.push(date);
    }
  }

  const lastDate = dates[lastIndex];

  if (
    selectedTicks.length === 0 ||
    selectedTicks[selectedTicks.length - 1].getTime() !== lastDate.getTime()
  ) {
    selectedTicks.push(lastDate);
  }

  return selectedTicks;
};

const createIntervalTicks = (
  interval: d3.CountableTimeInterval,
  start: Date,
  end: Date
): Date[] => {
  const ticks = interval.range(start, d3.timeDay.offset(end, 1));

  if (ticks.length === 0) {
    return [start, end];
  }

  if (ticks[0].getTime() !== start.getTime()) {
    ticks.unshift(start);
  }

  return ticks;
};

/**
 * 날짜 범위에 따라 적절한 시간축 tick 값을 선택합니다.
 */
export const buildTimeAxis = (
  xScale: ScaleTime<number, number>,
  uniqueDates: Date[]
): Axis<Date | NumberValue> => {
  const sortedDates = [...uniqueDates].sort((a, b) => a.getTime() - b.getTime());

  if (sortedDates.length === 0) {
    return d3.axisBottom(xScale);
  }

  const start = sortedDates[0];
  const end = sortedDates[sortedDates.length - 1];
  const dateCount = sortedDates.length;

  let tickValues: Date[];

  if (dateCount <= 7) {
    tickValues = sortedDates;
  } else if (dateCount <= 31) {
    tickValues = createEvenlySpacedTicks(sortedDates, 8);
  } else if (dateCount <= 92) {
    tickValues = createIntervalTicks(d3.timeWeek, start, end);
  } else {
    const monthInterval = dateCount > 200
      ? d3.timeMonth.every(2) ?? d3.timeMonth
      : d3.timeMonth.every(1) ?? d3.timeMonth;

    tickValues = createIntervalTicks(monthInterval, start, end);
  }

  return d3
    .axisBottom<Date | NumberValue>(xScale)
    .tickValues(tickValues)
    .tickFormat((value) => d3.timeFormat("%m/%d")(value as Date));
};
