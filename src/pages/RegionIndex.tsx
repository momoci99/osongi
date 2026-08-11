import { Box, Chip, Container, Divider, Skeleton, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";
import useRegionManifest from "../hooks/useRegionManifest";
import usePageMeta from "../hooks/usePageMeta";
import { PAGE_META } from "../const/Seo";
import { regionPath, unionPath } from "../const/Regions";
import ScopeLinkGrid, {
  type ScopeLinkItem,
} from "../components/Region/ScopeLinkGrid";
import type { RegionManifest, ScopeStats } from "../types/region";

/** 지역 카드: 조합 수와 최신 시즌 지표를 붙여 허브가 얇은 페이지가 되지 않게 한다 */
const buildRegionItems = (manifest: RegionManifest): ScopeLinkItem[] =>
  Object.values(manifest.regions)
    .map((region) => ({
      name: region.name,
      note: `산림조합 ${region.unions.length}곳`,
      path: regionPath(region.name),
      region: region.name,
      avgPricePerKg: region.season?.avgPricePerKg ?? null,
      totalQuantityKg: region.season?.totalQuantityKg ?? null,
    }))
    .sort((a, b) => (b.totalQuantityKg ?? 0) - (a.totalQuantityKg ?? 0));

const toUnionItem = (union: ScopeStats): ScopeLinkItem => ({
  name: union.name,
  note: union.region,
  path: unionPath(union.region, union.name),
  region: union.region,
  avgPricePerKg: union.season?.avgPricePerKg ?? null,
  totalQuantityKg: union.season?.totalQuantityKg ?? null,
});

/** 집계가 있는 조합만 물량순으로. 집계 없는 조합은 목록 끝을 어지럽히므로 분리한다 */
const splitUnions = (manifest: RegionManifest) => {
  const all = Object.values(manifest.unions);
  const recorded = all
    .filter((union) => union.season !== null)
    .sort(
      (a, b) => (b.season?.totalQuantityKg ?? 0) - (a.season?.totalQuantityKg ?? 0)
    )
    .map(toUnionItem);
  const unrecorded = all.filter((union) => union.season === null).map(toUnionItem);

  return { recorded, unrecorded, total: all.length };
};

/** 최신 시즌 최고 평균 단가 조합. 허브 상단에 한 줄로 걸어 둔다 */
const topPricedUnion = (manifest: RegionManifest): ScopeStats | null => {
  let best: ScopeStats | null = null;
  for (const union of Object.values(manifest.unions)) {
    const price = union.season?.avgPricePerKg;
    if (price === undefined) continue;
    if (best === null || price > (best.season?.avgPricePerKg ?? 0)) best = union;
  }
  return best;
};

type HighlightProps = { union: ScopeStats };

const TopPriceHighlight = ({ union }: HighlightProps) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 1,
      mt: 2,
    }}
  >
    <Chip label="최신 시즌 최고 단가" size="small" color="primary" variant="outlined" />
    <Typography
      component={RouterLink}
      to={unionPath(union.region, union.name)}
      variant="body2"
      sx={{ fontWeight: 600, color: "text.primary", textDecoration: "none" }}
    >
      {union.region} {union.name}
    </Typography>
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      kg당 {union.season?.avgPricePerKg.toLocaleString("ko-KR")}원
    </Typography>
  </Box>
);

type UnrecordedListProps = { items: ScopeLinkItem[] };

/** 최신 시즌 집계가 없는 조합은 카드 대신 얇은 링크 줄로 */
const UnrecordedUnions = ({ items }: UnrecordedListProps) => (
  <Box component="nav" aria-label="최신 시즌 집계 없는 조합" sx={{ mt: 1 }}>
    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.75 }}>
      최신 시즌 집계 없음
    </Typography>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
      {items.map((item) => (
        <Typography
          key={item.path}
          component={RouterLink}
          to={item.path}
          variant="body2"
          sx={{
            color: "text.secondary",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {item.note} {item.name}
        </Typography>
      ))}
    </Box>
  </Box>
);

/** /region — 지역·조합 페이지 허브 */
const RegionIndex = () => {
  usePageMeta(PAGE_META.regionIndex);
  const { manifest, error } = useRegionManifest();

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

  const { recorded, unrecorded, total } = splitUnions(manifest);
  const topUnion = topPricedUnion(manifest);

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
          sx={{ color: "text.secondary", lineHeight: 1.75, maxWidth: "68ch" }}
        >
          강원·경북·경남 {Object.keys(manifest.regions).length}개 지역과 {total}개
          산림조합의 송이버섯 공판 시세를 지역별로 나눠 제공합니다. 각 페이지에서{" "}
          {manifest.latestSeasonYear} 시즌 등급별 평균 단가와 공판량, 연도별 추이를
          확인할 수 있습니다. 최신 공판 데이터는 {manifest.latestDate} 기준입니다.
        </Typography>
        {topUnion ? <TopPriceHighlight union={topUnion} /> : null}
      </Box>

      <ScopeLinkGrid
        title="지역"
        items={buildRegionItems(manifest)}
        emptyMessage="지역 데이터가 없습니다."
        emphasized
      />

      <Divider sx={{ my: 3 }} />

      <ScopeLinkGrid
        title="산림조합 (최신 시즌 물량순)"
        items={recorded}
        emptyMessage="조합 데이터가 없습니다."
      />

      {unrecorded.length > 0 ? <UnrecordedUnions items={unrecorded} /> : null}
    </Container>
  );
};

export default RegionIndex;
