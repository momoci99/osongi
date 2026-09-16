import { Box, Container, Skeleton, Stack, Typography } from "@mui/material";
import ExplorerHeader from "../components/AnalysisExplorer/ExplorerHeader";
import TemplateBar from "../components/AnalysisExplorer/TemplateBar";
import SeasonStrip from "../components/AnalysisExplorer/SeasonStrip";
import ExplorerControls from "../components/AnalysisExplorer/Controls";
import ExplorerView from "../components/AnalysisExplorer/views";
import ExplorerSummary from "../components/AnalysisExplorer/Summary";
import useAnalysisDataset from "../hooks/useAnalysisDataset";
import useAnalysisQuery from "../hooks/useAnalysisQuery";
import usePageMeta from "../hooks/usePageMeta";
import isInSeason from "../utils/isInSeason";
import { PAGE_META } from "../const/Seo";
import { EXPLORER_LAYOUT } from "../const/AnalysisLayout";
import { runAnalysisQuery, shiftTimeByYears } from "../utils/analysisQuery/runQuery";
import { selectByPlaceAndGrade } from "../utils/analysisQuery/rows";
import { sumQuantityByDate } from "../utils/analysisQuery/seasonWindow";
import type { GradeRow } from "../utils/analysisQuery/types";

type ExplorerContentProps = {
  rows: GradeRow[];
  availableYears: number[];
  latestDate: string | null;
};

/** 데이터가 준비된 뒤의 탐색기 본문 */
const ExplorerContent = ({ rows, availableYears, latestDate }: ExplorerContentProps) => {
  const context = {
    availableYears,
    inSeason: latestDate ? isInSeason(latestDate) : false,
  };
  const { query, activeTemplateId, setQuery, updateQuery, applyTemplate } = useAnalysisQuery(context);

  const result = runAnalysisQuery(rows, query);
  const comparison =
    query.compare === "prevYear"
      ? runAnalysisQuery(rows, { ...query, compare: "none", time: shiftTimeByYears(query.time, -1) })
      : null;
  const scopedRows = selectByPlaceAndGrade(rows, query);
  const dailyQuantity = sumQuantityByDate(scopedRows);
  const recordCount = new Set(rows.map((row) => `${row.date}|${row.union}`)).size;
  const scopeUnionCount = new Set(
    selectByPlaceAndGrade(rows, { ...query, grades: [] }).map((row) => row.union),
  ).size;

  return (
    <Stack gap={EXPLORER_LAYOUT.SECTION_GAP}>
      <ExplorerHeader availableYears={availableYears} recordCount={recordCount} latestDate={latestDate} />
      <TemplateBar activeId={activeTemplateId} onSelect={applyTemplate} />
      <SeasonStrip
        years={availableYears}
        dailyQuantity={dailyQuantity}
        time={query.time}
        latestDate={latestDate}
        onTimeChange={(time) => updateQuery({ time })}
      />
      <ExplorerControls query={query} onQueryChange={setQuery} />
      <Box
        sx={{
          display: "grid",
          gap: EXPLORER_LAYOUT.SECTION_GAP,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            [EXPLORER_LAYOUT.ASIDE_BREAKPOINT]: `minmax(0, 1fr) ${EXPLORER_LAYOUT.ASIDE_WIDTH}px`,
          },
          alignItems: "start",
        }}
      >
        <Box sx={{ order: { xs: 2, [EXPLORER_LAYOUT.ASIDE_BREAKPOINT]: 1 }, minWidth: 0 }}>
          <ExplorerView query={query} result={result} comparison={comparison} onQueryChange={setQuery} />
        </Box>
        <Box
          component="aside"
          sx={{
            order: { xs: 1, [EXPLORER_LAYOUT.ASIDE_BREAKPOINT]: 2 },
            position: { [EXPLORER_LAYOUT.ASIDE_BREAKPOINT]: "sticky" },
            top: EXPLORER_LAYOUT.STICKY_TOP,
          }}
        >
          <ExplorerSummary query={query} result={result} scopeUnionCount={scopeUnionCount} />
        </Box>
      </Box>
    </Stack>
  );
};

/** 로딩 중 골격 */
const ExplorerSkeleton = () => (
  <Stack gap={EXPLORER_LAYOUT.SECTION_GAP}>
    <Skeleton variant="text" width={220} height={44} />
    <Skeleton variant="rounded" height={64} />
    <Skeleton variant="rounded" height={132} />
    <Skeleton variant="rounded" height={148} />
    <Skeleton variant="rounded" height={EXPLORER_LAYOUT.VIEW_MIN_HEIGHT} />
  </Stack>
);

/** 데이터 분석 탐색기 페이지 */
const AnalysisExplorer = () => {
  usePageMeta(PAGE_META.dataAnalysis);
  const { rows, availableYears, latestDate, loading, error } = useAnalysisDataset();

  return (
    <Box component="main" sx={{ minWidth: 0, bgcolor: "surface.base" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        {error ? (
          <Typography color="error">데이터를 불러오지 못했습니다: {error}</Typography>
        ) : loading ? (
          <ExplorerSkeleton />
        ) : (
          <ExplorerContent rows={rows} availableYears={availableYears} latestDate={latestDate} />
        )}
      </Container>
    </Box>
  );
};

export default AnalysisExplorer;
