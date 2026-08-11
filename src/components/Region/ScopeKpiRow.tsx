import { Grid } from "@mui/material";
import DashboardKpiCard from "../Dashboard/DashboardKpiCard";
import { GradeKeyToKorean } from "../../const/Common";
import { KILOGRAMS_PER_TON } from "../../const/Units";
import type { ScopeStats } from "../../types/region";

type ScopeKpiRowProps = {
  stats: ScopeStats;
  /** 지역 페이지에서만 전달. 소속 조합 수 */
  unionCount?: number;
};

const gradeLabel = (gradeKey: string): string =>
  GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey;

/** 최신 시즌 핵심 지표 4칸 */
const ScopeKpiRow = ({ stats, unionCount }: ScopeKpiRowProps) => {
  const season = stats.season;
  const seasonCaption = `${stats.latestSeasonYear} 시즌`;

  return (
    <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ alignItems: "stretch" }}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <DashboardKpiCard
          title="평균 단가"
          content={
            season ? `${season.avgPricePerKg.toLocaleString()}원` : "집계 없음"
          }
          caption={`${seasonCaption} · kg당`}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <DashboardKpiCard
          title="공판량"
          content={
            season
              ? `${(season.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1)}톤`
              : "집계 없음"
          }
          caption={seasonCaption}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <DashboardKpiCard
          title="최고 단가"
          content={
            stats.peak ? `${stats.peak.priceWon.toLocaleString()}원` : "집계 없음"
          }
          caption={
            stats.peak
              ? `${stats.peak.date} · ${gradeLabel(stats.peak.gradeKey)}`
              : seasonCaption
          }
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <DashboardKpiCard
          title={unionCount === undefined ? "전국 물량 순위" : "소속 조합"}
          content={
            unionCount === undefined
              ? stats.quantityRank
                ? `${stats.quantityRank.rank}위`
                : "집계 없음"
              : `${unionCount}곳`
          }
          caption={
            unionCount === undefined && stats.quantityRank
              ? `${seasonCaption} · ${stats.quantityRank.of}개 조합 중`
              : seasonCaption
          }
        />
      </Grid>
    </Grid>
  );
};

export default ScopeKpiRow;
