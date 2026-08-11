import { useState } from "react";
import { Box, Container, Grid, Skeleton, Typography } from "@mui/material";
import useRegionManifest from "../hooks/useRegionManifest";
import usePageMeta from "../hooks/usePageMeta";
import { PAGE_META } from "../const/Seo";
import { ALL_REGIONS_FILTER, unionPath } from "../const/Regions";
import { KILOGRAMS_PER_TON } from "../const/Units";
import ScopeKpiCard from "../components/Region/ScopeKpiCard";
import ScopeSectionHeading from "../components/Region/ScopeSectionHeading";
import ScopeRankList from "../components/Region/ScopeRankList";
import RegionSummaryCard from "../components/Region/RegionSummaryCard";
import RegionFilterChips from "../components/Region/RegionFilterChips";
import UnionSortToggle from "../components/Region/UnionSortToggle";
import type {
  RegionManifest,
  RegionScopeStats,
  ScopeLinkItem,
  ScopeStats,
  UnionSortKey,
} from "../types/region";

/** 물량 많은 지역이 먼저 */
const sortedRegions = (manifest: RegionManifest): RegionScopeStats[] =>
  Object.values(manifest.regions).sort(
    (a, b) => (b.season?.totalQuantityKg ?? 0) - (a.season?.totalQuantityKg ?? 0)
  );

const toUnionItem = (union: ScopeStats): ScopeLinkItem => ({
  name: union.name,
  path: unionPath(union.region, union.name),
  region: union.region,
  avgPricePerKg: union.season?.avgPricePerKg ?? null,
  totalQuantityKg: union.season?.totalQuantityKg ?? null,
});

const sortValue = (item: ScopeLinkItem, key: UnionSortKey): number | null =>
  key === "quantity" ? item.totalQuantityKg : item.avgPricePerKg;

/**
 * 선택한 정렬 기준으로 내림차순.
 * 최신 시즌 집계가 없는 조합은 순위를 다투지 않으므로 항상 목록 끝에 둔다.
 */
const sortUnions = (
  items: ScopeLinkItem[],
  key: UnionSortKey
): ScopeLinkItem[] =>
  [...items].sort((a, b) => {
    const left = sortValue(a, key);
    const right = sortValue(b, key);
    if (left === null && right === null) return a.name.localeCompare(b.name, "ko");
    if (left === null) return 1;
    if (right === null) return -1;
    return right - left;
  });

const buildUnionItems = (
  manifest: RegionManifest,
  region: string,
  key: UnionSortKey
): ScopeLinkItem[] => {
  const items = Object.values(manifest.unions)
    .filter((union) => region === ALL_REGIONS_FILTER || union.region === region)
    .map(toUnionItem);

  return sortUnions(items, key);
};

/** 최신 시즌 최고 평균 단가 조합 */
const topPricedUnion = (manifest: RegionManifest): ScopeStats | null => {
  let best: ScopeStats | null = null;
  for (const union of Object.values(manifest.unions)) {
    const price = union.season?.avgPricePerKg;
    if (price === undefined) continue;
    if (best === null || price > (best.season?.avgPricePerKg ?? 0)) best = union;
  }
  return best;
};

/** 지역 합계. 조합 합계를 쓰면 지역 직판분이 빠진다 */
const totalQuantityTon = (manifest: RegionManifest): number =>
  Object.values(manifest.regions).reduce(
    (sum, region) => sum + (region.season?.totalQuantityKg ?? 0),
    0
  ) / KILOGRAMS_PER_TON;

type SummaryKpiRowProps = { manifest: RegionManifest };

/**
 * 허브 상단 지표.
 * 이전에는 최고 단가가 칩 한 줄로 떠 있어 다른 요소와 연결되지 않았다.
 */
const SummaryKpiRow = ({ manifest }: SummaryKpiRowProps) => {
  const top = topPricedUnion(manifest);
  const season = `${manifest.latestSeasonYear} 시즌`;

  return (
    <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ alignItems: "stretch" }}>
      <Grid size={{ xs: 6, sm: 4 }}>
        <ScopeKpiCard
          title="최신 시즌 최고 단가"
          value={
            top?.season ? top.season.avgPricePerKg.toLocaleString("ko-KR") : "집계 없음"
          }
          unit={top?.season ? "원" : undefined}
          caption={top ? `${top.region} ${top.name} · kg당` : season}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4 }}>
        <ScopeKpiCard
          title="전체 공판량"
          value={totalQuantityTon(manifest).toFixed(1)}
          unit="톤"
          caption={season}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <ScopeKpiCard
          title="최신 공판일"
          value={manifest.latestDate}
          caption="산림조합중앙회 공판 실적 기준"
        />
      </Grid>
    </Grid>
  );
};

/** /region — 지역·조합 페이지 허브 */
const RegionIndex = () => {
  usePageMeta(PAGE_META.regionIndex);
  const { manifest, error } = useRegionManifest();
  const [regionFilter, setRegionFilter] = useState<string>(ALL_REGIONS_FILTER);
  const [sortKey, setSortKey] = useState<UnionSortKey>("quantity");

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
        <Skeleton variant="text" width={260} height={44} />
        <Skeleton variant="rounded" height={140} sx={{ mt: 2 }} />
        <Skeleton variant="rounded" height={240} sx={{ mt: 2 }} />
      </Container>
    );
  }

  const regions = sortedRegions(manifest);
  const unionItems = buildUnionItems(manifest, regionFilter, sortKey);
  const totalUnions = Object.keys(manifest.unions).length;

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 6 }}>
      <Box component="header" sx={{ mb: 3 }}>
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.5rem", sm: "1.875rem" },
            mb: 1,
          }}
        >
          지역별 송이 시세
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            lineHeight: 1.75,
            maxWidth: "68ch",
            /** 마지막 줄에 글자 한둘만 남는 고아 줄을 막는다 */
            textWrap: "pretty",
          }}
        >
          강원·경북·경남 {regions.length}개 지역과 {totalUnions}개 산림조합의 송이버섯
          공판 시세입니다. 각 페이지에서 {manifest.latestSeasonYear} 시즌 등급별 단가와
          공판량, 연도별 추이를 볼 수 있습니다.
        </Typography>
      </Box>

      <SummaryKpiRow manifest={manifest} />

      <ScopeSectionHeading title="지역" caption="최신 시즌 물량순" />
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ alignItems: "stretch" }}>
        {regions.map((region) => (
          <Grid key={region.name} size={{ xs: 12, sm: 4 }}>
            <RegionSummaryCard region={region} />
          </Grid>
        ))}
      </Grid>

      <ScopeRankList
        title="산림조합"
        caption={`${manifest.latestSeasonYear} 시즌 · ${unionItems.length}개 조합`}
        items={unionItems}
        emptyMessage="조합 데이터가 없습니다."
        showRegion
        action={<UnionSortToggle value={sortKey} onChange={setSortKey} />}
        toolbar={
          <RegionFilterChips
            regions={regions.map((region) => region.name)}
            value={regionFilter}
            onChange={setRegionFilter}
          />
        }
      />
    </Container>
  );
};

export default RegionIndex;
