import { Box, Container, Divider, Skeleton, Typography, useTheme } from "@mui/material";
import useRegionManifest from "../hooks/useRegionManifest";
import usePageMeta from "../hooks/usePageMeta";
import { PAGE_META } from "../const/Seo";
import { regionPath, unionPath } from "../const/Regions";
import ScopeLinkGrid, {
  type ScopeLinkItem,
} from "../components/Region/ScopeLinkGrid";
import type { RegionManifest } from "../types/region";

/** 지역 카드: 최신 시즌 지표를 붙여 허브가 얇은 페이지가 되지 않게 한다 */
const buildRegionItems = (manifest: RegionManifest): ScopeLinkItem[] =>
  Object.values(manifest.regions)
    .map((region) => ({
      name: `${region.name} (조합 ${region.unions.length}곳)`,
      path: regionPath(region.name),
      avgPricePerKg: region.season?.avgPricePerKg ?? null,
      totalQuantityKg: region.season?.totalQuantityKg ?? null,
    }))
    .sort((a, b) => (b.totalQuantityKg ?? 0) - (a.totalQuantityKg ?? 0));

/** 전국 조합을 물량순으로 나열 */
const buildUnionItems = (manifest: RegionManifest): ScopeLinkItem[] =>
  Object.values(manifest.unions)
    .map((union) => ({
      name: `${union.region} ${union.name}`,
      path: unionPath(union.region, union.name),
      avgPricePerKg: union.season?.avgPricePerKg ?? null,
      totalQuantityKg: union.season?.totalQuantityKg ?? null,
    }))
    .sort((a, b) => (b.totalQuantityKg ?? 0) - (a.totalQuantityKg ?? 0));

/** /region — 지역·조합 페이지 허브 */
const RegionIndex = () => {
  usePageMeta(PAGE_META.regionIndex);
  const theme = useTheme();
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

  const unionItems = buildUnionItems(manifest);

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 4 }}>
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
            color: theme.palette.text.secondary,
            lineHeight: 1.75,
            maxWidth: "68ch",
          }}
        >
          강원·경북·경남 {Object.keys(manifest.regions).length}개 지역과{" "}
          {unionItems.length}개 산림조합의 송이버섯 공판 시세를 지역별로 나눠
          제공합니다. 각 페이지에서 {manifest.latestSeasonYear} 시즌 등급별 평균
          단가와 공판량, 연도별 추이를 확인할 수 있습니다. 최신 공판 데이터는{" "}
          {manifest.latestDate} 기준입니다.
        </Typography>
      </Box>

      <ScopeLinkGrid
        title="지역"
        items={buildRegionItems(manifest)}
        emptyMessage="지역 데이터가 없습니다."
      />

      <Divider sx={{ my: 3 }} />

      <ScopeLinkGrid
        title="산림조합 (최신 시즌 물량순)"
        items={unionItems}
        emptyMessage="조합 데이터가 없습니다."
      />
    </Container>
  );
};

export default RegionIndex;
