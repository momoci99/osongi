import { Grid } from "@mui/material";
import ScopeKpiCard from "./ScopeKpiCard";
import { GradeKeyToKorean } from "../../const/Common";
import { KILOGRAMS_PER_TON } from "../../const/Units";
import type { ScopeStats } from "../../types/region";

type ScopeKpiRowProps = {
  stats: ScopeStats;
  /** 지역 페이지에서만 전달. 소속 조합 수 */
  unionCount?: number;
};

const NO_DATA = "집계 없음";

const gradeLabel = (gradeKey: string): string =>
  GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey;

/** 최신 시즌 핵심 지표 4칸 */
const ScopeKpiRow = ({ stats, unionCount }: ScopeKpiRowProps) => {
  const season = stats.season;
  const seasonCaption = `${stats.latestSeasonYear} 시즌`;
  const isRegionPage = unionCount !== undefined;
  const rank = stats.quantityRank;

  return (
    <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ alignItems: "stretch" }}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <ScopeKpiCard
          title="평균 단가"
          value={season ? season.avgPricePerKg.toLocaleString("ko-KR") : NO_DATA}
          unit={season ? "원" : undefined}
          caption={`${seasonCaption} · kg당`}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <ScopeKpiCard
          title="공판량"
          value={
            season
              ? (season.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1)
              : NO_DATA
          }
          unit={season ? "톤" : undefined}
          caption={seasonCaption}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <ScopeKpiCard
          title="최고 단가"
          value={stats.peak ? stats.peak.priceWon.toLocaleString("ko-KR") : NO_DATA}
          unit={stats.peak ? "원" : undefined}
          caption={
            stats.peak
              ? `${stats.peak.date} · ${gradeLabel(stats.peak.gradeKey)}`
              : seasonCaption
          }
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <ScopeKpiCard
          title={isRegionPage ? "소속 조합" : "물량 순위"}
          value={
            isRegionPage
              ? String(unionCount)
              : rank
                ? String(rank.rank)
                : NO_DATA
          }
          unit={isRegionPage ? "곳" : rank ? "위" : undefined}
          /** 허브의 조합 수(21)와 어긋나 보이지 않도록 모집단을 밝힌다 */
          caption={
            !isRegionPage && rank
              ? `${seasonCaption} 집계 ${rank.of}개 조합 중`
              : seasonCaption
          }
        />
      </Grid>
    </Grid>
  );
};

export default ScopeKpiRow;
