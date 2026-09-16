import { useState } from "react";
import { Box, Button, Collapse, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExplorerPanel from "../ExplorerPanel";
import PivotTable from "./PivotTable";
import SeasonSummaryTable from "./SeasonSummaryTable";
import LineChart from "../charts/LineChart";
import { EXPLORER_LAYOUT } from "../../../const/AnalysisLayout";
import { buildSeasonSummaries } from "../../../utils/analysisQuery/seasonTables";
import { GROUP_BY_LABELS, METRIC_LABELS, VIEW_LABELS } from "../../../utils/analysisQuery/labels";
import type { AnalysisQuery, AnalysisResult, AnalysisView } from "../../../utils/analysisQuery/types";

type ExplorerViewProps = {
  query: AnalysisQuery;
  result: AnalysisResult;
};

/** 차트가 구현된 뷰 */
const CHART_VIEWS: AnalysisView[] = ["overlay", "timeline"];

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

type ChartWithTableProps = ExplorerViewProps;

/** 차트 + 접히는 상세 표 */
const ChartWithTable = ({ query, result }: ChartWithTableProps) => {
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <>
      <LineChart query={query} result={result} />
      <Box sx={{ px: { xs: 1, sm: 1.5 }, pt: 1.5, pb: tableOpen ? 0 : 1 }}>
        <Button
          size="small"
          color="inherit"
          onClick={() => setTableOpen((open) => !open)}
          endIcon={
            <ExpandMoreIcon
              fontSize="small"
              sx={{ transform: tableOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            />
          }
          aria-expanded={tableOpen}
          sx={{ color: "text.secondary", fontWeight: 600 }}
        >
          {tableOpen ? "표 접기" : "표로 보기"}
        </Button>
      </Box>
      <Collapse in={tableOpen} unmountOnExit>
        <Box sx={{ borderTop: "1px solid", borderColor: "surface.border", mt: 1 }}>
          <PivotTable query={query} result={result} />
        </Box>
      </Collapse>
    </>
  );
};

/** 메인 뷰 영역 — 현재 뷰에 맞는 차트·표를 고른다 */
const ExplorerView = ({ query, result }: ExplorerViewProps) => {
  const isEmpty = result.rows.length === 0;
  const hasChart = CHART_VIEWS.includes(query.view);
  const isChartPending = !hasChart && query.view !== "table";

  const renderBody = () => {
    if (isEmpty) return <EmptyResult />;
    if (hasChart) return <ChartWithTable query={query} result={result} />;
    return (
      <>
        {isChartPending ? (
          <Typography sx={{ px: { xs: 1.75, sm: 2.25 }, pb: 1.5, fontSize: "0.8125rem", color: "text.secondary" }}>
            이 뷰의 차트는 준비 중입니다. 같은 집계 결과를 표로 먼저 보여 드립니다.
          </Typography>
        ) : null}
        {isSeasonSummary(query) ? (
          <SeasonSummaryTable summaries={buildSeasonSummaries(result.rows)} />
        ) : (
          <PivotTable query={query} result={result} />
        )}
      </>
    );
  };

  return (
    <ExplorerPanel title={VIEW_LABELS[query.view]} caption={describeView(query)} flush>
      {renderBody()}
    </ExplorerPanel>
  );
};

export default ExplorerView;
