import { useDeferredValue, useEffect } from "react";
import { Box, Container, Skeleton, Stack, Typography } from "@mui/material";
import ExplorerHeader from "../components/AnalysisExplorer/ExplorerHeader";
import TemplateBar from "../components/AnalysisExplorer/TemplateBar";
import SeasonStrip from "../components/AnalysisExplorer/SeasonStrip";
import ExplorerControls from "../components/AnalysisExplorer/Controls";
import ExplorerView from "../components/AnalysisExplorer/views";
import ExplorerSummary from "../components/AnalysisExplorer/Summary";
import { requestRawCsv, useExplorerData, useExplorerMeta, usePrefetchExplorerData } from "../hooks/useAnalysisEngine";
import { ANALYSIS_TEMPLATES, buildTemplateQuery } from "../utils/analysisQuery/templates";
import { prefetchExplorerData } from "../workers/explorerDataCache";
import useAnalysisQuery from "../hooks/useAnalysisQuery";
import usePageMeta from "../hooks/usePageMeta";
import isInSeason from "../utils/isInSeason";
import { PAGE_META } from "../const/Seo";
import { EXPLORER_DATA_CACHE, EXPLORER_LAYOUT } from "../const/AnalysisLayout";
import type { ExplorerMeta } from "../utils/analysisQuery/explorerData";

/** 첫 결과가 오기 전 시즌 스트립용 빈 값 */
const EMPTY_DAILY_QUANTITY = new Map<string, number>();

type ExplorerContentProps = {
  meta: ExplorerMeta;
  version: string;
};

/** 결과 영역 골격 */
const ResultSkeleton = () => (
  <>
    <Skeleton variant="rounded" height={EXPLORER_LAYOUT.VIEW_MIN_HEIGHT} />
    <Skeleton variant="rounded" height={EXPLORER_LAYOUT.VIEW_MIN_HEIGHT / 2} />
  </>
);

/** 데이터셋 요약이 준비된 뒤의 탐색기 본문 */
const ExplorerContent = ({ meta, version }: ExplorerContentProps) => {
  const context = {
    availableYears: meta.availableYears,
    inSeason: meta.latestDate ? isInSeason(meta.latestDate) : false,
  };
  /** 시즌 중이면 최신 공판 연도의 시즌은 아직 진행 중이다 */
  const ongoingYear = context.inSeason && meta.latestDate ? Number(meta.latestDate.slice(0, 4)) : null;
  const { query, activeTemplateId, setQuery, updateQuery, applyTemplate } = useAnalysisQuery(context);
  /**
   * 선택 표시(템플릿·탭·칩)는 누른 프레임에, 결과(스트립·차트·요약)는 다음 프레임에 그린다.
   * 연속 클릭 중에는 중간 결과 렌더를 건너뛴다.
   */
  const resultQuery = useDeferredValue(query);
  const { data, pending: computing, error } = useExplorerData(resultQuery, version, true);
  /** 워커 계산 중이거나, 연속 조작으로 결과 렌더가 선택을 아직 못 따라온 상태 */
  const pending = computing || query !== resultQuery;
  const prefetch = usePrefetchExplorerData(version);

  useEffect(
    function prefetchTemplatesWhenIdle() {
      /** 첫 클릭부터 즉시 반영되도록 템플릿 결과를 유휴 시간에 미리 계산한다 */
      const templateContext = { availableYears: meta.availableYears, inSeason: context.inSeason };
      const run = () => {
        for (const template of ANALYSIS_TEMPLATES) prefetchExplorerData(template.build(templateContext), version);
      };
      if (typeof requestIdleCallback === "function") {
        const handle = requestIdleCallback(run);
        return () => cancelIdleCallback(handle);
      }
      const timer = setTimeout(run, EXPLORER_DATA_CACHE.IDLE_FALLBACK_MS);
      return () => clearTimeout(timer);
    },
    [meta.availableYears, context.inSeason, version],
  );

  return (
    /** 한글이 음절 중간에서 끊기지 않게 어절 단위로 줄바꿈한다 */
    <Stack gap={EXPLORER_LAYOUT.SECTION_GAP} sx={{ wordBreak: "keep-all" }}>
      <ExplorerHeader availableYears={meta.availableYears} recordCount={meta.recordCount} latestDate={meta.latestDate} />
      <TemplateBar
        activeId={activeTemplateId}
        onSelect={applyTemplate}
        onPrefetch={(id) => prefetch(buildTemplateQuery(id, context))}
      />
      <SeasonStrip
        years={meta.availableYears}
        dailyQuantity={data?.dailyQuantity ?? EMPTY_DAILY_QUANTITY}
        time={resultQuery.time}
        latestDate={meta.latestDate}
        onTimeChange={(time) => updateQuery({ time })}
      />
      <ExplorerControls query={query} onQueryChange={setQuery} onPrefetch={prefetch} />
      {error ? <Typography color="error">결과를 계산하지 못했습니다: {error}</Typography> : null}
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
        {data ? (
          <>
            {/** 좁은 화면에서도 차트가 먼저 — 요약이 위에 있으면 차트가 한 화면 넘게 밀린다 */}
            <Box sx={{ minWidth: 0 }}>
              <ExplorerView
                data={data}
                pending={pending}
                selectedQuery={query}
                onQueryChange={setQuery}
                requestRawCsv={() => requestRawCsv(data.query, version)}
                ongoingYear={ongoingYear}
              />
            </Box>
            <Box component="aside" sx={{ position: { [EXPLORER_LAYOUT.ASIDE_BREAKPOINT]: "sticky" }, top: EXPLORER_LAYOUT.STICKY_TOP }}>
              <ExplorerSummary
                query={data.query}
                result={data.result}
                scopeUnionCount={data.scopeUnionCount}
                pending={pending}
                revision={data}
              />
            </Box>
          </>
        ) : (
          <ResultSkeleton />
        )}
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
  const { meta, version, loading, error } = useExplorerMeta();

  return (
    <Box component="main" sx={{ minWidth: 0, bgcolor: "surface.base" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        {error ? (
          <Typography color="error">데이터를 불러오지 못했습니다: {error}</Typography>
        ) : loading || !meta ? (
          <ExplorerSkeleton />
        ) : (
          <ExplorerContent meta={meta} version={version} />
        )}
      </Container>
    </Box>
  );
};

export default AnalysisExplorer;
