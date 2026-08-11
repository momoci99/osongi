import { Container, Skeleton, Typography } from "@mui/material";
import { Navigate, useParams } from "react-router";
import useRegionManifest from "../hooks/useRegionManifest";
import usePageMeta from "../hooks/usePageMeta";
import { regionPageMeta, unionPageMeta } from "../const/Seo";
import {
  REGION_ROUTE_PREFIX,
  isRegionName,
  isUnionOfRegion,
  regionPath,
  unionPath,
} from "../const/Regions";
import { toScopeMetaFacts } from "../utils/regionNarrative";
import ScopeHeader from "../components/Region/ScopeHeader";
import ScopeKpiRow from "../components/Region/ScopeKpiRow";
import ScopeGradeTable from "../components/Region/ScopeGradeTable";
import ScopeYearlyChart from "../components/Region/ScopeYearlyChart";
import ScopeRankList from "../components/Region/ScopeRankList";
import type {
  RegionManifest,
  ScopeLinkItem,
  ScopeStats,
} from "../types/region";

/** 지역 페이지는 소속 조합, 조합 페이지는 같은 지역의 다른 조합을 링크한다 */
const buildLinkItems = (
  manifest: RegionManifest,
  region: string,
  currentUnion: string | undefined
): ScopeLinkItem[] => {
  const unionNames = manifest.regions[region]?.unions ?? [];

  return unionNames
    .filter((name) => name !== currentUnion)
    .map((name) => {
      const stats = manifest.unions[name];
      return {
        name,
        path: unionPath(region, name),
        region,
        avgPricePerKg: stats?.season?.avgPricePerKg ?? null,
        totalQuantityKg: stats?.season?.totalQuantityKg ?? null,
      };
    })
    .sort((a, b) => (b.totalQuantityKg ?? 0) - (a.totalQuantityKg ?? 0));
};

/** 조합 페이지에서만 비교 기준을 준다. 지역 페이지는 비교 대상이 자기 자신이라 무의미 */
const compareBaseline = (
  stats: ScopeStats,
  isUnion: boolean
): number | null | undefined => (isUnion ? stats.season?.avgPricePerKg : undefined);

type ScopeBodyProps = {
  stats: ScopeStats;
  manifest: RegionManifest;
  union: string | undefined;
};

const ScopeBody = ({ stats, manifest, union }: ScopeBodyProps) => {
  const isUnion = union !== undefined;
  const linkItems = buildLinkItems(manifest, stats.region, union);
  const latestDaily = stats.latestDaily;

  return (
    <>
      <ScopeHeader stats={stats} latestDate={manifest.latestDate} />
      <ScopeKpiRow
        stats={stats}
        unionCount={isUnion ? undefined : (manifest.regions[stats.region]?.unions.length ?? 0)}
      />

      <ScopeGradeTable
        grades={stats.grades}
        caption={`${stats.latestSeasonYear} 시즌 등급별 시세`}
        emptyMessage={`${stats.latestSeasonYear} 시즌 등급별 집계가 아직 없습니다.`}
      />

      {latestDaily && latestDaily.grades.length > 0 && (
        <ScopeGradeTable
          grades={latestDaily.grades}
          caption={`최신 공판일 시세 (${latestDaily.date})`}
          emptyMessage="최신 공판일 거래가 없습니다."
        />
      )}

      {stats.yearly.length > 0 && (
        <ScopeYearlyChart yearly={stats.yearly} scopeName={stats.name} />
      )}

      <ScopeRankList
        title={
          isUnion
            ? `${stats.region}의 다른 조합 시세`
            : `${stats.region} 조합별 시세`
        }
        caption={
          isUnion
            ? `${stats.latestSeasonYear} 시즌 · ${stats.name} 대비 단가 차이`
            : `${stats.latestSeasonYear} 시즌 물량순`
        }
        items={linkItems}
        emptyMessage="연결된 조합 페이지가 없습니다."
        compareToPricePerKg={compareBaseline(stats, isUnion)}
      />
    </>
  );
};

/** 지역(/region/경북) · 조합(/region/경북/봉화) 상세 페이지 */
const RegionDetail = () => {
  const { region, union } = useParams();
  const { manifest, error } = useRegionManifest();

  const validRegion = isRegionName(region);
  const validUnion = union === undefined || isUnionOfRegion(region, union);
  const stats: ScopeStats | null =
    manifest && validRegion && validUnion
      ? union
        ? (manifest.unions[union] ?? null)
        : (manifest.regions[region] ?? null)
      : null;

  const path =
    validRegion && region
      ? union
        ? unionPath(region, union)
        : regionPath(region)
      : REGION_ROUTE_PREFIX;
  const facts = stats ? toScopeMetaFacts(stats) : undefined;

  usePageMeta(
    union && validUnion && region
      ? unionPageMeta(region, union, path, facts)
      : regionPageMeta(region ?? "전국", path, facts)
  );

  /** 존재하지 않는 지역·조합은 허브 페이지로 흘려보낸다 */
  if (!validRegion || !validUnion) {
    return <Navigate to={REGION_ROUTE_PREFIX} replace />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ pt: 3, pb: 4 }}>
        <Typography variant="body1" color="error">
          시세 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </Typography>
      </Container>
    );
  }

  if (!manifest) {
    return (
      <Container maxWidth="lg" sx={{ pt: 3, pb: 4 }}>
        <Skeleton variant="text" width={220} height={44} />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="rounded" height={120} sx={{ mt: 2 }} />
        <Skeleton variant="rounded" height={220} sx={{ mt: 2 }} />
      </Container>
    );
  }

  if (!stats) {
    return <Navigate to={REGION_ROUTE_PREFIX} replace />;
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
      <ScopeBody stats={stats} manifest={manifest} union={union} />
    </Container>
  );
};

export default RegionDetail;
