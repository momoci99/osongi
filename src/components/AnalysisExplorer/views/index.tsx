import { useRef, useState } from "react";
import { Box, Button, Collapse, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExplorerPanel from "../ExplorerPanel";
import PivotTable from "./PivotTable";
import ExportMenu from "./ExportMenu";
import SeasonSummaryTable from "./SeasonSummaryTable";
import LineChart from "../charts/LineChart";
import Heatmap from "../charts/Heatmap";
import RankChart from "../charts/RankChart";
import CompositionChart from "../charts/CompositionChart";
import Relation from "../charts/Relation";
import Coverage from "../charts/Coverage";
import { EXPLORER_LAYOUT } from "../../../const/AnalysisLayout";
import { GROUP_BY_LABELS, METRIC_LABELS, VIEW_LABELS } from "../../../utils/analysisQuery/labels";
import { coerceQueryToView } from "../../../utils/analysisQuery/viewRules";
import { isSeasonSummaryQuery, type ExplorerData } from "../../../utils/analysisQuery/explorerData";
import type { AnalysisQuery, AnalysisView } from "../../../utils/analysisQuery/types";

type ExplorerViewProps = {
  /** 계산이 끝난 결과. 화면은 data.query 기준으로 그려 계산 중에도 결과와 어긋나지 않는다 */
  data: ExplorerData;
  pending: boolean;
  /** 히트맵 셀 클릭 등 차트에서 쿼리를 바꿀 때 */
  onQueryChange: (next: AnalysisQuery) => void;
  requestRawCsv: () => Promise<string>;
};

/** 차트가 있는 뷰 */
const CHART_VIEWS: AnalysisView[] = ["overlay", "timeline", "heatmap", "rank", "composition", "relation", "coverage"];

/** 뷰 제목 옆 설명 */
const describeView = (query: AnalysisQuery): string => {
  if (isSeasonSummaryQuery(query)) return "시즌별 개시·피크·총량";
  if (query.view === "coverage") return "조합별 시즌 공판일";
  if (query.view === "relation") {
    /** 등급이 섞이면 등급 구성 차이가 가격 차이로 보이므로 한 등급을 권한다 */
    return query.grades.length === 1 ? "공판량 × 단가 · 점 = 조합 하루" : "공판량 × 단가 · 한 등급만 고르면 더 정확합니다";
  }
  return `${METRIC_LABELS[query.metric]} · ${GROUP_BY_LABELS[query.groupBy]}`;
};

/** 결과가 비었을 때 */
const EmptyResult = () => (
  <Box sx={{ minHeight: EXPLORER_LAYOUT.VIEW_MIN_HEIGHT / 2, display: "grid", placeItems: "center", textAlign: "center", px: 3 }}>
    <Box>
      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>조건에 맞는 공판 기록이 없습니다</Typography>
      <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
        기간을 넓히거나 지역·등급 필터를 줄여 보세요.
      </Typography>
    </Box>
  </Box>
);

type ViewChartProps = Pick<ExplorerViewProps, "data" | "onQueryChange">;

/** 현재 뷰의 차트 */
const ViewChart = ({ data, onQueryChange }: ViewChartProps) => {
  const { query, result, comparison } = data;
  switch (query.view) {
    case "heatmap":
      return (
        <Heatmap
          query={query}
          result={result}
          onSelectSeason={(year) =>
            onQueryChange(coerceQueryToView({ ...query, time: { kind: "seasons", years: [year] } }, "timeline"))
          }
        />
      );
    case "rank":
      return <RankChart query={query} items={data.rankItems ?? []} showChange={comparison !== null} />;
    case "composition":
      return <CompositionChart query={query} result={result} />;
    case "relation":
      return data.relation ? <Relation query={query} model={data.relation} /> : null;
    case "coverage":
      return data.coverage ? <Coverage coverage={data.coverage} /> : null;
    default:
      return <LineChart query={query} result={result} comparison={comparison} />;
  }
};

/** 차트 + 접히는 상세 표 */
const ChartWithTable = ({ data, onQueryChange }: ViewChartProps) => {
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <>
      <ViewChart data={data} onQueryChange={onQueryChange} />
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
          <PivotTable query={data.query} result={data.result} />
        </Box>
      </Collapse>
    </>
  );
};

/** 메인 뷰 영역 — 현재 뷰에 맞는 차트·표를 고른다 */
const ExplorerView = ({ data, pending, onQueryChange, requestRawCsv }: ExplorerViewProps) => {
  const chartAreaRef = useRef<HTMLDivElement | null>(null);
  const { query, result } = data;

  const renderBody = () => {
    if (result.rowCount === 0) return <EmptyResult />;
    if (CHART_VIEWS.includes(query.view)) return <ChartWithTable data={data} onQueryChange={onQueryChange} />;
    return data.seasonSummaries ? (
      <SeasonSummaryTable summaries={data.seasonSummaries} />
    ) : (
      <PivotTable query={query} result={result} />
    );
  };

  return (
    <ExplorerPanel
      title={VIEW_LABELS[query.view]}
      caption={describeView(query)}
      action={<ExportMenu query={query} result={result} requestRawCsv={requestRawCsv} chartAreaRef={chartAreaRef} />}
      pending={pending}
      flush
    >
      <div ref={chartAreaRef}>{renderBody()}</div>
    </ExplorerPanel>
  );
};

export default ExplorerView;
