import { FIRE_SEASON_CUTOFF_MONTH } from "../../const/Wildfire";
import type { ForestFire } from "./forestFireApi";

/** 공식 발표로 API 를 보정한 대형 산불 (data/wildfire/major-fire-overrides.json) */
export type MajorFireOverride = {
  id: string;
  label: string;
  startDate: string;
  /** 이 산불로 대체할 API 기록 (같은 날·같은 발화 시군) */
  replacesApi: { startDate: string; province: string; county: string }[];
  /** 피해 시군. 시군별 면적이 공식 발표되지 않았으면 null */
  areas: { province: string; county: string; damageHa: number | null }[];
  totalHa: number;
  source: string;
  sourceUrl: string;
  note?: string;
};

/** 조합 하나에 붙는 산불 표식 */
export type UnionFireMark = {
  eventId: string;
  label: string;
  startDate: string;
  /** 영향이 처음 나타나는 송이 시즌 */
  seasonYear: number;
  /** 이 조합 시군의 피해 (ha). 모르면 null */
  damageHa: number | null;
  /** 산불 전체 피해 (ha) — 여러 시군에 걸친 산불 */
  totalHa: number;
  /** 피해 시군 목록 */
  counties: string[];
  source: string;
};

export type UnionFireFile = {
  generatedAt: string;
  minDamageHa: number;
  unions: Record<string, UnionFireMark[]>;
};

/** 조합이 속한 도·조합명 */
export type UnionLocation = { region: string; union: string };

/** "용인 처인" 처럼 구가 붙은 시군명에서 시군만 */
const countyOf = (county: string) => county.split(" ")[0];

const sameCounty = (a: { province: string; county: string }, b: { province: string; county: string }) =>
  a.province === b.province && countyOf(a.county) === countyOf(b.county);

export const seasonYearOf = (startDate: string): number => {
  const year = Number(startDate.slice(0, 4));
  return Number(startDate.slice(5, 7)) >= FIRE_SEASON_CUTOFF_MONTH ? year + 1 : year;
};

const isReplaced = (fire: ForestFire, overrides: MajorFireOverride[]) =>
  overrides.some((o) => o.replacesApi.some((r) => r.startDate === fire.startDate && sameCounty(r, fire)));

/**
 * 산불 원본 + 공식 보정표 → 조합별 대형 산불 표식.
 * 도·시군이 조합 소재지와 같은 산불만, 피해가 minHa 이상인 것만 남긴다.
 */
export const buildUnionFireMarks = (
  fires: ForestFire[],
  overrides: MajorFireOverride[],
  unions: UnionLocation[],
  minHa: number,
): Record<string, UnionFireMark[]> => {
  const result: Record<string, UnionFireMark[]> = {};
  const push = (union: string, mark: UnionFireMark) => (result[union] ??= []).push(mark);

  for (const { region, union } of unions) {
    const location = { province: region, county: union };
    for (const fire of fires) {
      if (fire.damageHa < minHa || !sameCounty(fire, location) || isReplaced(fire, overrides)) continue;
      push(union, {
        eventId: `${fire.startDate}-${union}`,
        label: `${union} 산불`,
        startDate: fire.startDate,
        seasonYear: seasonYearOf(fire.startDate),
        damageHa: fire.damageHa,
        totalHa: fire.damageHa,
        counties: [union],
        source: "산림청 산불발생통계",
      });
    }
    for (const override of overrides) {
      const area = override.areas.find((a) => sameCounty(a, location));
      if (!area || override.totalHa < minHa) continue;
      push(union, {
        eventId: override.id,
        label: override.label,
        startDate: override.startDate,
        seasonYear: seasonYearOf(override.startDate),
        damageHa: area.damageHa,
        totalHa: override.totalHa,
        counties: override.areas.map((a) => countyOf(a.county)),
        source: override.source,
      });
    }
  }
  for (const marks of Object.values(result)) marks.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return result;
};

/** 여러 조합의 표식을 산불 단위로 묶은 것 (지역 페이지용) */
export type FireEvent = Omit<UnionFireMark, "damageHa"> & {
  /** 이 범위(지역·조합) 안 조합별 피해 */
  affected: { union: string; damageHa: number | null }[];
};

export const groupFireEvents = (marksByUnion: Record<string, UnionFireMark[]>, unions: string[]): FireEvent[] => {
  const events = new Map<string, FireEvent>();
  for (const union of unions) {
    for (const { damageHa, ...mark } of marksByUnion[union] ?? []) {
      const event = events.get(mark.eventId) ?? { ...mark, affected: [] };
      event.affected.push({ union, damageHa });
      events.set(mark.eventId, event);
    }
  }
  return [...events.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
};

const formatHa = (ha: number) => Math.round(ha).toLocaleString("ko-KR");

/**
 * 산불 한 줄 설명의 피해 부분.
 * 조합별 면적을 알면 조합별로, 모르면 산불 전체 합계를 시군 목록과 함께 쓴다.
 */
export const describeFireDamage = (event: FireEvent): string => {
  const known = event.affected.filter((a): a is { union: string; damageHa: number } => a.damageHa !== null);
  if (known.length === event.affected.length) {
    return `${known.map((a) => `${a.union} ${formatHa(a.damageHa)}`).join(" · ")}ha`;
  }
  return `${event.counties.join("·")} 합계 ${formatHa(event.totalHa)}ha`;
};

/** "2022.03" */
export const formatFireMonth = (startDate: string) => `${startDate.slice(0, 4)}.${startDate.slice(5, 7)}`;
