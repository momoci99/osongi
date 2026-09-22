#!/usr/bin/env node
/*
  지온 대리 지표 검증 (기획서 4-4)

  지중온도 관측 5개 지점에서 5cm 지중온도와 후보 대리 지표(지면온도·최저기온·평균기온)를 비교한다.
  판정 기준은 분석 전에 기획서 4-4 에 고정했다. 이 스크립트는 수치만 출력하고 판정은 기준표와 대조한다.

  실행: npx tsx scripts/analysis/validate-soil-proxy.ts
  입력: data/weather/raw (npm run collect-weather)
*/
import { SOIL_TEMP_STATION_IDS, WEATHER_FIRST_YEAR } from "../../src/const/Weather";
import {
  anomaly,
  climatology,
  firstIndexAtOrBelow,
  meanDifference,
  median,
  movingAverage,
  pearson,
  type Series,
} from "../../src/utils/weather/seriesStats";
import { LAST_COMPLETE_YEAR, weatherSeries, windowIndexOf, yearRange } from "./lib/analysisData";

/** 분석 구간: 08-01 ~ 10-31 */
const ANALYSIS_FROM = "0801";
const ANALYSIS_TO = "1031";
const TARGET_FIELD = "avgCm5Te";
const PROXY_FIELDS = ["avgTs", "minTa", "avgTa"] as const;
const THRESHOLDS_C = [18, 19, 20];
/** 판정 기준 (기획서 4-4) */
const CRITERIA = { rawR: 0.9, anomalyR: 0.7, medianDeltaDays: 3, within7Share: 0.9, withinDays: 7 };

type Field = typeof TARGET_FIELD | (typeof PROXY_FIELDS)[number];

const years = yearRange(WEATHER_FIRST_YEAR, LAST_COMPLETE_YEAR);
const FROM_INDEX = windowIndexOf(ANALYSIS_FROM);
const TO_INDEX = windowIndexOf(ANALYSIS_TO);
const loadSeries = (stationId: number, year: number, field: Field): Series => weatherSeries(stationId, year, field);

const inWindow = (series: Series): Series => series.map((v, i) => (i >= FROM_INDEX && i <= TO_INDEX ? v : null));

/** 지점·연도별 7일 이동평균 (분석 구간 밖은 결측) */
const smoothedByYear = (stationId: number, field: Field): Series[] =>
  years.map((year) => inWindow(movingAverage(loadSeries(stationId, year, field))));

const concat = (list: Series[]): Series => list.flat();
const fmt = (v: number | null | undefined, digits = 2) => (v === null || v === undefined ? "—" : v.toFixed(digits));

/** 전 지점 공통 오프셋 (대리 - 5cm) — 지온 미관측 지점에도 그대로 적용할 수 있어야 하므로 지점별로 맞추지 않는다 */
const pooledOffset = (field: Field): number => {
  const diffs = SOIL_TEMP_STATION_IDS.map((id) => meanDifference(concat(smoothedByYear(id, field)), concat(smoothedByYear(id, TARGET_FIELD))));
  const valid = diffs.filter((d): d is number => d !== null);
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

type StationResult = {
  stationId: number;
  rawR: number | null;
  anomalyR: number | null;
  medianDelta: number | null;
  within7: number;
  missingCrossings: number;
  pass: boolean;
};

const evaluate = (stationId: number, field: Field, offset: number, threshold: number): StationResult => {
  const target = smoothedByYear(stationId, TARGET_FIELD);
  const proxy = smoothedByYear(stationId, field);
  const targetNormal = climatology(target);
  const proxyNormal = climatology(proxy);

  const rawR = pearson(concat(proxy), concat(target))?.r ?? null;
  const anomalyR = pearson(concat(proxy.map((s) => anomaly(s, proxyNormal))), concat(target.map((s) => anomaly(s, targetNormal))))?.r ?? null;

  const deltas: number[] = [];
  let missingCrossings = 0;
  years.forEach((_, i) => {
    const t = firstIndexAtOrBelow(target[i], threshold, FROM_INDEX);
    const p = firstIndexAtOrBelow(proxy[i], threshold + offset, FROM_INDEX);
    if (t === null || p === null) missingCrossings++;
    else deltas.push(Math.abs(p - t));
  });

  const medianDelta = median(deltas);
  const within7 = deltas.length ? deltas.filter((d) => d <= CRITERIA.withinDays).length / deltas.length : 0;
  const pass =
    (rawR ?? 0) >= CRITERIA.rawR &&
    (anomalyR ?? 0) >= CRITERIA.anomalyR &&
    medianDelta !== null &&
    medianDelta <= CRITERIA.medianDeltaDays &&
    within7 >= CRITERIA.within7Share;

  return { stationId, rawR, anomalyR, medianDelta, within7, missingCrossings, pass };
};

const main = () => {
  console.log(`# 지온 대리 지표 검증 — ${WEATHER_FIRST_YEAR}~${LAST_COMPLETE_YEAR}, ${ANALYSIS_FROM}~${ANALYSIS_TO}, 7일 이동평균\n`);

  for (const field of PROXY_FIELDS) {
    const offset = pooledOffset(field);
    console.log(`## ${field} (공통 오프셋 ${fmt(offset)}°C)\n`);
    for (const threshold of THRESHOLDS_C) {
      const results = SOIL_TEMP_STATION_IDS.map((id) => evaluate(id, field, offset, threshold));
      const passCount = results.filter((r) => r.pass).length;
      console.log(`### 임계 ${threshold}°C — 통과 ${passCount}/${results.length}`);
      console.log("| 지점 | 원값 r | 편차 r | 통과일 |Δ| 중앙값 | ≤7일 비율 | 미통과 연도 | 판정 |");
      console.log("|---|---|---|---|---|---|---|");
      for (const r of results) {
        console.log(`| ${r.stationId} | ${fmt(r.rawR)} | ${fmt(r.anomalyR)} | ${fmt(r.medianDelta, 1)} | ${fmt(r.within7 * 100, 0)}% | ${r.missingCrossings} | ${r.pass ? "✅" : "❌"} |`);
      }
      console.log("");
    }
  }
};

main();
