import ScopeStatPanel, { type ScopeStat } from "./ScopeStatPanel";
import { GradeKeyToKorean } from "../../const/Common";
import { KILOGRAMS_PER_TON } from "../../const/Units";
import type { ScopeStats } from "../../types/region";

type ScopeStatSummaryProps = {
  stats: ScopeStats;
  /** 지역 페이지에서만 전달. 소속 조합 수 */
  unionCount?: number;
};

const NO_DATA = "집계 없음";

const gradeLabel = (gradeKey: string): string =>
  GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey;

const unionCountStat = (unionCount: number, caption: string): ScopeStat => ({
  label: "소속 조합",
  value: String(unionCount),
  unit: "곳",
  caption,
});

/**
 * 최신 시즌 공판이 아직 없을 때의 지표.
 * "집계 없음"만 네 줄 늘어서면 읽을 게 없으므로 직전 기록 연도의 실적을 대신 세운다.
 */
const buildOffSeasonStats = (stats: ScopeStats, unionCount?: number): ScopeStat[] => {
  const lastYear = stats.yearly.at(-1);
  const lastCaption = lastYear ? `${lastYear.year} 시즌 · 직전 기록` : "";
  const seasonStat: ScopeStat = {
    label: `${stats.latestSeasonYear} 시즌`,
    value: NO_DATA,
    caption: "아직 공판 실적이 없습니다",
  };
  const unionStats =
    unionCount === undefined ? [] : [unionCountStat(unionCount, `${stats.latestSeasonYear} 시즌`)];
  if (!lastYear) return [seasonStat, ...unionStats];

  return [
    seasonStat,
    {
      label: "평균 단가",
      value: lastYear.avgPricePerKg.toLocaleString("ko-KR"),
      unit: "원/kg",
      caption: lastCaption,
    },
    {
      label: "공판량",
      value: (lastYear.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1),
      unit: "톤",
      caption: lastCaption,
    },
    ...unionStats,
  ];
};

/** 지역·조합 페이지 상단에 세우는 최신 시즌 핵심 지표 */
const buildStats = (stats: ScopeStats, unionCount?: number): ScopeStat[] => {
  const season = stats.season;
  if (!season) return buildOffSeasonStats(stats, unionCount);
  const seasonCaption = `${stats.latestSeasonYear} 시즌`;
  const isRegionPage = unionCount !== undefined;
  const rank = stats.quantityRank;

  return [
    {
      label: "평균 단가",
      value: season.avgPricePerKg.toLocaleString("ko-KR"),
      unit: "원/kg",
      caption: seasonCaption,
    },
    {
      label: "공판량",
      value: (season.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1),
      unit: "톤",
      caption: seasonCaption,
    },
    {
      label: "최고 단가",
      value: stats.peak ? stats.peak.priceWon.toLocaleString("ko-KR") : NO_DATA,
      unit: stats.peak ? "원" : undefined,
      caption: stats.peak
        ? `${stats.peak.date} · ${gradeLabel(stats.peak.gradeKey)}`
        : seasonCaption,
    },
    {
      label: isRegionPage ? "소속 조합" : "물량 순위",
      value: isRegionPage
        ? String(unionCount)
        : rank
          ? String(rank.rank)
          : NO_DATA,
      unit: isRegionPage ? "곳" : rank ? "위" : undefined,
      /** 허브의 조합 수(21)와 어긋나 보이지 않도록 모집단을 밝힌다 */
      caption:
        !isRegionPage && rank
          ? `${seasonCaption} 집계 ${rank.of}개 조합 중`
          : seasonCaption,
    },
  ];
};

const ScopeStatSummary = ({ stats, unionCount }: ScopeStatSummaryProps) => (
  <ScopeStatPanel stats={buildStats(stats, unionCount)} />
);

export default ScopeStatSummary;
