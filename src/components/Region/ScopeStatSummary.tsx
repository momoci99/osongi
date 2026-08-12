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

/** 지역·조합 페이지 상단에 세우는 최신 시즌 핵심 지표 */
const buildStats = (stats: ScopeStats, unionCount?: number): ScopeStat[] => {
  const season = stats.season;
  const seasonCaption = `${stats.latestSeasonYear} 시즌`;
  const isRegionPage = unionCount !== undefined;
  const rank = stats.quantityRank;

  return [
    {
      label: "평균 단가",
      value: season ? season.avgPricePerKg.toLocaleString("ko-KR") : NO_DATA,
      unit: season ? "원/kg" : undefined,
      caption: seasonCaption,
    },
    {
      label: "공판량",
      value: season
        ? (season.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1)
        : NO_DATA,
      unit: season ? "톤" : undefined,
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
