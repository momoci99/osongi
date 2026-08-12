import { useState } from "react";
import { Box, Container, Grid, Skeleton, Typography } from "@mui/material";
import useRegionManifest from "../hooks/useRegionManifest";
import usePageMeta from "../hooks/usePageMeta";
import { PAGE_META } from "../const/Seo";
import { ALL_REGIONS_FILTER, unionPath } from "../const/Regions";
import { SCOPE_HERO } from "../const/RegionLayout";
import { KILOGRAMS_PER_TON } from "../const/Units";
import ScopeHero from "../components/Region/ScopeHero";
import ScopeStatPanel, {
  type ScopeStat,
} from "../components/Region/ScopeStatPanel";
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

/** 상단 설명 문단. 14px 본문이 넓게 흐르면 줄이 길어 다음 줄을 놓친다 */
const HERO_TEXT_SX = {
  color: "text.secondary",
  fontSize: "0.9375rem",
  lineHeight: 1.8,
  maxWidth: SCOPE_HERO.TEXT_MAX_WIDTH,
  /** 마지막 줄에 글자 한둘만 남는 고아 줄을 막는다 */
  textWrap: "pretty",
} as const;

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

/**
 * 허브 상단 지표.
 * 이전에는 최고 단가가 칩 한 줄로 떠 있어 다른 요소와 연결되지 않았다.
 */
const summaryStats = (manifest: RegionManifest): ScopeStat[] => {
  const top = topPricedUnion(manifest);
  const season = `${manifest.latestSeasonYear} 시즌`;

  return [
    {
      label: "최고 단가 조합",
      value: top?.season
        ? top.season.avgPricePerKg.toLocaleString("ko-KR")
        : "집계 없음",
      unit: top?.season ? "원/kg" : undefined,
      caption: top ? `${top.region} ${top.name} · ${season}` : season,
    },
    {
      label: "전체 공판량",
      value: totalQuantityTon(manifest).toFixed(1),
      unit: "톤",
      caption: season,
    },
    {
      label: "최신 공판일",
      value: manifest.latestDate,
      /** 출처는 페이지 푸터에 있다. 여기서는 값과 붙지 않을 길이로 줄인다 */
      caption: "공판 실적 기준",
    },
  ];
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
      <ScopeHero stats={<ScopeStatPanel stats={summaryStats(manifest)} />}>
        <Box component="header">
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
          <Typography sx={HERO_TEXT_SX}>
            강원·경북·경남 {regions.length}개 지역과 {totalUnions}개 산림조합의 송이버섯
            공판 시세입니다. 각 페이지에서 {manifest.latestSeasonYear} 시즌 등급별 단가와
            공판량, 연도별 추이를 볼 수 있습니다.
          </Typography>
          <Typography sx={{ ...HERO_TEXT_SX, mt: 1 }}>
            산림조합중앙회가 공개한 공판 실적을 시즌(9~11월) 중 약 1시간 주기로
            수집해 정리합니다. 표시 가격은 실제 거래가가 아닌 참고 정보입니다.
          </Typography>
        </Box>
      </ScopeHero>

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
        metric={sortKey}
        toolbar={
          /** 필터와 정렬은 같은 성격의 컨트롤이라 한 줄에서 좌우로 맞물린다 */
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
              mb: 1.5,
            }}
          >
            <RegionFilterChips
              regions={regions.map((region) => region.name)}
              value={regionFilter}
              onChange={setRegionFilter}
            />
            <UnionSortToggle value={sortKey} onChange={setSortKey} />
          </Box>
        }
      />
    </Container>
  );
};

export default RegionIndex;
