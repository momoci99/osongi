import { Box, Typography } from "@mui/material";
import ExplorerPanel from "../ExplorerPanel";
import PivotTable from "./PivotTable";
import SeasonSummaryTable from "./SeasonSummaryTable";
import { EXPLORER_LAYOUT } from "../../../const/AnalysisLayout";
import { buildSeasonSummaries } from "../../../utils/analysisQuery/seasonTables";
import { GROUP_BY_LABELS, METRIC_LABELS, VIEW_LABELS } from "../../../utils/analysisQuery/labels";
import type { AnalysisQuery, AnalysisResult } from "../../../utils/analysisQuery/types";

type ExplorerViewProps = {
  query: AnalysisQuery;
  result: AnalysisResult;
};

/** 시즌 요약 표를 쓰는 조합인지 */
const isSeasonSummary = (query: AnalysisQuery): boolean =>
  query.view === "table" && query.granularity === "season" && query.groupBy === "year";

/** 뷰 제목 옆 설명 */
const describeView = (query: AnalysisQuery): string =>
  isSeasonSummary(query)
    ? "시즌별 개시·피크·총량"
    : `${METRIC_LABELS[query.metric]} · ${GROUP_BY_LABELS[query.groupBy]}`;

/** 결과가 비었을 때 */
const EmptyResult = () => (
  <Box
    sx={{
      minHeight: EXPLORER_LAYOUT.VIEW_MIN_HEIGHT / 2,
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      px: 3,
    }}
  >
    <Box>
      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>조건에 맞는 공판 기록이 없습니다</Typography>
      <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
        기간을 넓히거나 지역·등급 필터를 줄여 보세요.
      </Typography>
    </Box>
  </Box>
);

/** 메인 뷰 영역 — 현재 뷰에 맞는 차트·표를 고른다 */
const ExplorerView = ({ query, result }: ExplorerViewProps) => {
  const isEmpty = result.rows.length === 0;
  const isChartPending = query.view !== "table";

  return (
    <ExplorerPanel title={VIEW_LABELS[query.view]} caption={describeView(query)} flush>
      {isEmpty ? (
        <EmptyResult />
      ) : (
        <>
          {isChartPending ? (
            <Typography
              sx={{
                px: { xs: 1.75, sm: 2.25 },
                pb: 1.5,
                fontSize: "0.8125rem",
                color: "text.secondary",
              }}
            >
              이 뷰의 차트는 준비 중입니다. 같은 집계 결과를 표로 먼저 보여 드립니다.
            </Typography>
          ) : null}
          {isSeasonSummary(query) ? (
            <SeasonSummaryTable summaries={buildSeasonSummaries(result.rows)} />
          ) : (
            <PivotTable query={query} result={result} />
          )}
        </>
      )}
    </ExplorerPanel>
  );
};

export default ExplorerView;
