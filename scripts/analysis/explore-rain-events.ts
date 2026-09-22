#!/usr/bin/env node
/*
  H9·H10 이벤트 분석 (기획서 9-5) — 채취 현장 경험에서 나온 가설
  - H9: 폭우 뒤 1~5일 상위 등급 비율이 급락하는가
  - H10: 비 그친 뒤 며칠 후 공판량이 늘어나는가

  v1(사전 고정): 반응일과 비교군을 전 연도 합산으로 비교 → 연도별 물량·등급 수준 차이가 섞이는 설계 결함
  v2(결과 확인 후 수정): 조합·연도 안에서 반응일 − 비교군 차이를 내고, 그 차이들의 평균을 검정. 통과 기준은 v1 과 동일

  실행: npx tsx scripts/analysis/explore-rain-events.ts
*/
import { UNION_WEATHER_STATION, WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import {
  anomaly,
  climatology,
  laggedWindowSum,
  quantile,
  welchTest,
  type Series,
} from "../../src/utils/weather/seriesStats";
import {
  auctionQuantitySeries,
  LAST_COMPLETE_YEAR,
  rainSeries,
  upperGradeShareSeries,
  windowIndexOf,
  yearRange,
} from "./lib/analysisData";

const ALL_YEARS = yearRange(WEATHER_FIRST_YEAR, LAST_COMPLETE_YEAR);
const TRAIN_YEARS = yearRange(WEATHER_FIRST_YEAR, 2022);
const HOLDOUT_YEARS = yearRange(2023, 2025);
const MIN_DAILY_QUANTITY_KG = 15;
const MIN_NORMAL_YEARS = 3;

/** H9 설정 (기획서 9-5) */
const HEAVY = { windowDays: 3, quantiles: [0.9, 0.95], responseDays: 5, from: windowIndexOf("0801"), to: windowIndexOf("1031") };
const H9_CRITERIA = { trainDiff: -0.02, holdoutDiff: -0.01, alpha: 0.05 };

/** H10 설정 (기획서 9-5) */
const STOP = { rainMm: 10, dryMm: 1, maxK: 10, candidateK: [2, 3, 4, 5, 6, 7] };
const H10_CRITERIA = { trainDiff: 0.1, holdoutDiff: 0.05, alpha: 0.05 / STOP.candidateK.length };

const unions = Object.keys(UNION_WEATHER_STATION);
const pct = (v: number) => `${(v * 100).toFixed(2)}%p`;
const fmt = (v: number | null | undefined, digits = 3) => (v === null || v === undefined ? "—" : v.toFixed(digits));

/** 조합 일별 값의 학습 연도 평년 편차 */
const anomaliesByYear = (series: (y: number) => Series, years: number[]): Map<number, Series> => {
  const normal = climatology(TRAIN_YEARS.map(series), MIN_NORMAL_YEARS);
  return new Map(years.map((y) => [y, anomaly(series(y), normal)]));
};

/** 지점별 폭우 기준 — 학습 연도 08~10월 3일 누적 강수 분위수 */
const heavyThreshold = (stationId: number, q: number): number => {
  const sums = TRAIN_YEARS.flatMap((y) =>
    laggedWindowSum(rainSeries(stationId, y), HEAVY.windowDays, 0)
      .slice(HEAVY.from, HEAVY.to + 1)
      .filter((v): v is number => v !== null),
  );
  return quantile(sums, q) ?? Infinity;
};

/** 폭우 후 1~responseDays 일 여부 */
const afterHeavyMask = (rain: Series, threshold: number): boolean[] => {
  const sums = laggedWindowSum(rain, HEAVY.windowDays, 0);
  const mask = rain.map(() => false);
  sums.forEach((sum, event) => {
    if (sum === null || sum < threshold) return;
    for (let d = 1; d <= HEAVY.responseDays && event + d < mask.length; d++) mask[event + d] = true;
  });
  return mask;
};

/** 조합·연도별 (반응 평균 − 비교군 평균) 들을 모아 0 과 비교 (가중치: 반응일 수) */
const withinTest = (diffs: { diff: number; weight: number }[]) => {
  const expanded = diffs.flatMap(({ diff, weight }) => Array<number>(weight).fill(diff));
  const zeros = expanded.map(() => 0);
  const test = welchTest(expanded, zeros);
  const units = diffs.length;
  const positive = diffs.filter((d) => d.diff > 0).length;
  // 반응일 가중 평균, p 는 조합·연도 단위 표본 수로 보수적으로 다시 계산
  const mean = expanded.reduce((a, b) => a + b, 0) / Math.max(1, expanded.length);
  const unitMeanTest = welchTest(diffs.map((d) => d.diff), diffs.map(() => 0));
  return { mean, p: unitMeanTest?.p ?? null, units, positive, pooledP: test?.p ?? null };
};

const meanOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

const h9 = (years: number[], q: number) => {
  const post: number[] = [];
  const other: number[] = [];
  const within: { diff: number; weight: number }[] = [];
  const byYear = new Map<number, { post: number[]; other: number[] }>();
  for (const union of unions) {
    const { stationId } = UNION_WEATHER_STATION[union];
    const threshold = heavyThreshold(stationId, q);
    const grade = anomaliesByYear((y) => upperGradeShareSeries(union, y, MIN_DAILY_QUANTITY_KG), years);
    for (const y of years) {
      const mask = afterHeavyMask(rainSeries(stationId, y), threshold);
      const bucket = byYear.get(y) ?? { post: [], other: [] };
      const unitPost: number[] = [];
      const unitOther: number[] = [];
      grade.get(y)!.forEach((v, i) => {
        if (v === null) return;
        (mask[i] ? post : other).push(v);
        (mask[i] ? bucket.post : bucket.other).push(v);
        (mask[i] ? unitPost : unitOther).push(v);
      });
      if (unitPost.length && unitOther.length) within.push({ diff: meanOf(unitPost) - meanOf(unitOther), weight: unitPost.length });
      byYear.set(y, bucket);
    }
  }
  return { test: welchTest(post, other), byYear, within: withinTest(within) };
};

/**
 * 비 그친 뒤 경과일 k.
 * 마지막 10mm 이상 강수일 i 의 다음날이 무강수면 k = d − i. 조건 불충족이면 null,
 * 11일 이상 지났으면 비교군(Infinity).
 */
const daysSinceStop = (rain: Series): (number | null)[] =>
  rain.map((_, d) => {
    for (let i = d - 1; i >= 0; i--) {
      const r = rain[i];
      if (r === null) return null;
      if (r >= STOP.rainMm) {
        const k = d - i;
        if (k > STOP.maxK) return Infinity;
        const next = rain[i + 1];
        return next !== null && next < STOP.dryMm ? k : null;
      }
      if (d - i > STOP.maxK) return Infinity;
    }
    return null;
  });

const h10 = (years: number[]) => {
  const groups = new Map<number, number[]>();
  const baseline: number[] = [];
  const byYear = new Map<number, Map<number | "base", number[]>>();
  const withinByK = new Map<number, { diff: number; weight: number }[]>();
  for (const union of unions) {
    const { stationId } = UNION_WEATHER_STATION[union];
    const quantity = anomaliesByYear((y) => auctionQuantitySeries(union, y).map((q) => (q === null ? null : Math.log1p(q))), years);
    for (const y of years) {
      const rain = rainSeries(stationId, y);
      const ks = daysSinceStop(rain);
      const yearGroups = byYear.get(y) ?? new Map<number | "base", number[]>();
      const unitGroups = new Map<number | "base", number[]>();
      quantity.get(y)!.forEach((v, d) => {
        const k = ks[d];
        const today = rain[d];
        if (v === null || k === null || today === null || today >= STOP.dryMm) return;
        const key = k === Infinity ? "base" : k;
        if (key === "base") baseline.push(v);
        else groups.set(key, [...(groups.get(key) ?? []), v]);
        yearGroups.set(key, [...(yearGroups.get(key) ?? []), v]);
        unitGroups.set(key, [...(unitGroups.get(key) ?? []), v]);
      });
      const unitBase = unitGroups.get("base") ?? [];
      for (let k = 1; k <= STOP.maxK; k++) {
        const group = unitGroups.get(k) ?? [];
        if (group.length && unitBase.length) {
          withinByK.set(k, [...(withinByK.get(k) ?? []), { diff: meanOf(group) - meanOf(unitBase), weight: group.length }]);
        }
      }
      byYear.set(y, yearGroups);
    }
  }
  return { groups, baseline, byYear, withinByK };
};

const main = () => {
  console.log("# H9 폭우 → 상위 등급 비율\n");
  for (const q of HEAVY.quantiles) {
    const train = h9(TRAIN_YEARS, q);
    const holdout = h9(HOLDOUT_YEARS, q);
    const all = h9(ALL_YEARS, q);
    const negativeYears = [...all.byYear.values()].filter((b) => {
      const t = welchTest(b.post, b.other);
      return t !== null && t.diff < 0;
    }).length;
    const pass =
      train.test !== null && train.test.diff <= H9_CRITERIA.trainDiff && train.test.p < H9_CRITERIA.alpha &&
      holdout.test !== null && holdout.test.diff <= H9_CRITERIA.holdoutDiff;
    console.log(`## 상위 ${Math.round((1 - q) * 100)}% 폭우`);
    console.log(`- 학습: 차이 ${train.test ? pct(train.test.diff) : "—"} (폭우 후 n ${train.test?.nA}, 그 외 n ${train.test?.nB}, p ${fmt(train.test?.p, 4)})`);
    console.log(`- 홀드아웃: 차이 ${holdout.test ? pct(holdout.test.diff) : "—"} (n ${holdout.test?.nA} / ${holdout.test?.nB})`);
    console.log(`- 연도별 음수: ${negativeYears}/${all.byYear.size}`);
    console.log(`- 판정: ${pass ? "✅ 통과" : "❌ 미통과"}${q === HEAVY.quantiles[0] ? "" : " (민감도)"}\n`);
  }

  console.log("# H10 비 그친 뒤 k일째 → 공판량 (log 편차, 비교군 대비)\n");
  const train = h10(TRAIN_YEARS);
  const holdout = h10(HOLDOUT_YEARS);
  console.log("| k | 학습 차이 | 학습 n | 학습 p | 홀드아웃 차이 | 홀드아웃 n |");
  console.log("|---|---|---|---|---|---|");
  const trainResults = new Map<number, ReturnType<typeof welchTest>>();
  for (let k = 1; k <= STOP.maxK; k++) {
    const t = welchTest(train.groups.get(k) ?? [], train.baseline);
    const h = welchTest(holdout.groups.get(k) ?? [], holdout.baseline);
    trainResults.set(k, t);
    console.log(`| ${k} | ${fmt(t?.diff)} | ${t?.nA ?? 0} | ${fmt(t?.p, 4)} | ${fmt(h?.diff)} | ${h?.nA ?? 0} |`);
  }
  console.log(`\n- 비교군(11일 이상 경과) n: 학습 ${train.baseline.length}, 홀드아웃 ${holdout.baseline.length}`);

  const bestK = [...STOP.candidateK].sort((a, b) => (trainResults.get(b)?.diff ?? -Infinity) - (trainResults.get(a)?.diff ?? -Infinity))[0];
  const best = trainResults.get(bestK);
  const holdoutBest = welchTest(holdout.groups.get(bestK) ?? [], holdout.baseline);
  const pass =
    best !== null && best !== undefined && best.diff >= H10_CRITERIA.trainDiff && best.p < H10_CRITERIA.alpha &&
    holdoutBest !== null && holdoutBest.diff >= H10_CRITERIA.holdoutDiff;
  console.log(`- 최대 k=${bestK}: 학습 ${fmt(best?.diff)}, 홀드아웃 ${fmt(holdoutBest?.diff)}`);
  console.log(`- 판정 (v1): ${pass ? "✅ 통과" : "❌ 미통과"}`);

  console.log("\n# v2 — 조합·연도 안에서 비교 (결과 확인 후 설계 수정)\n");
  for (const q of HEAVY.quantiles) {
    const train = h9(TRAIN_YEARS, q).within;
    const hold = h9(HOLDOUT_YEARS, q).within;
    const passV2 = train.mean <= H9_CRITERIA.trainDiff && (train.p ?? 1) < H9_CRITERIA.alpha && hold.mean <= H9_CRITERIA.holdoutDiff;
    console.log(`## H9 상위 ${Math.round((1 - q) * 100)}% 폭우: 학습 ${pct(train.mean)} (조합·연도 ${train.units}, 양수 ${train.positive}, p ${fmt(train.p, 4)}) / 홀드아웃 ${pct(hold.mean)} (${hold.units}, 양수 ${hold.positive}) → ${passV2 ? "✅" : "❌"}`);
  }
  const v2Train = h10(TRAIN_YEARS).withinByK;
  const v2Hold = h10(HOLDOUT_YEARS).withinByK;
  console.log("\n## H10\n");
  console.log("| k | 학습 차이 | 조합·연도 | 양수 | p | 홀드아웃 차이 | 조합·연도 | 양수 |");
  console.log("|---|---|---|---|---|---|---|---|");
  const v2Results = new Map<number, ReturnType<typeof withinTest>>();
  for (let k = 1; k <= STOP.maxK; k++) {
    const t = withinTest(v2Train.get(k) ?? []);
    const h = withinTest(v2Hold.get(k) ?? []);
    v2Results.set(k, t);
    console.log(`| ${k} | ${fmt(t.mean)} | ${t.units} | ${t.positive} | ${fmt(t.p, 4)} | ${fmt(h.mean)} | ${h.units} | ${h.positive} |`);
  }
  const bestV2 = [...STOP.candidateK].sort((a, b) => (v2Results.get(b)?.mean ?? -Infinity) - (v2Results.get(a)?.mean ?? -Infinity))[0];
  const t = v2Results.get(bestV2)!;
  const h = withinTest(v2Hold.get(bestV2) ?? []);
  const passV2 = t.mean >= H10_CRITERIA.trainDiff && (t.p ?? 1) < H10_CRITERIA.alpha && h.mean >= H10_CRITERIA.holdoutDiff;
  console.log(`\n- 최대 k=${bestV2}: 학습 ${fmt(t.mean)}, 홀드아웃 ${fmt(h.mean)} → ${passV2 ? "✅ 통과" : "❌ 미통과"}`);
};

main();
