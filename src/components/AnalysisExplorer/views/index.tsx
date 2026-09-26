import { useRef, useState, type ReactNode } from "react";
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
import WeatherChart from "../charts/WeatherChart";
import { EXPLORER_LAYOUT } from "../../../const/AnalysisLayout";
import { GROUP_BY_LABELS, METRIC_LABELS, VIEW_LABELS } from "../../../utils/analysisQuery/labels";
import { coerceQueryToView } from "../../../utils/analysisQuery/viewRules";
import { isSeasonSummaryQuery, type ExplorerData } from "../../../utils/analysisQuery/explorerData";
import type { AnalysisQuery, AnalysisView } from "../../../utils/analysisQuery/types";

type ExplorerViewProps = {
  /** 계산이 끝난 결과. 화면은 data.query 기준으로 그려 계산 중에도 결과와 어긋나지 않는다 */
  data: ExplorerData;
  pending: boolean;
  /** 방금 고른 조건 — 제목은 결과를 기다리지 않고 이것으로 바로 바꾼다 */
  selectedQuery: AnalysisQuery;
  /** 히트맵 셀 클릭 등 차트에서 쿼리를 바꿀 때 */
  onQueryChange: (next: AnalysisQuery) => void;
  requestRawCsv: () => Promise<string>;
  /** 아직 끝나지 않은 시즌 연도 (없으면 null) */
  ongoingYear: number | null;
  /** 머리글 아래 요약 띠 — 내보내기 이미지에는 넣지 않는다 */
  summary?: ReactNode;
  /** 머리글 자리의 뷰 탭 */
  tabs?: ReactNode;
};

/** 차트가 있는 뷰 */
const CHART_VIEWS: AnalysisView[] = [
  "overlay",
  "timeline",
  "heatmap",
  "rank",
  "composition",
  "relation",
  "coverage",
  "weather",
];

/** 선 차트 뷰 */
const LINE_VIEWS: AnalysisView[] = ["overlay", "timeline"];

/** 뷰 제목 옆 설명 */
const describeView = (query: AnalysisQuery): string => {
  if (isSeasonSummaryQuery(query)) return "시즌별 개시·피크·총량";
  if (query.view === "coverage") return "조합별 시즌 공판일";
  if (query.view === "weather") return "일 공판량 · 강수 · 기온 (기상청 ASOS)";
  if (query.view === "relation") {
    /** 등급이 섞이면 등급 구성 차이가 가격 차이로 보이므로 한 등급을 권한다 */
    return query.grades.length === 1
      ? "공판량 × 단가 · 점 = 조합 하루"
      : "공판량 × 단가 · 한 등급만 고르면 더 정확합니다";
  }
  /** 단가 선 차트 눈금은 "140만"처럼 짧게 쓰므로 단위를 제목에서 한 번 알려준다 */
  const unit = query.metric === "unitPrice" && LINE_VIEWS.includes(query.view) ? " (만원/kg)" : "";
  return `${METRIC_LABELS[query.metric]}${unit} · ${GROUP_BY_LABELS[query.groupBy]}`;
};

/** 평년 기준 설명 */
const describeNormalYears = (years: number[]): string =>
  years.length === 0
    ? "비교할 과거 시즌 없음"
    : `평년 ${years[0]}–${years[years.length - 1]} · ${years.length}시즌 중앙값`;

type ViewCaptionProps = {
  query: AnalysisQuery;
  /** 평년 비교 중일 때 기준 시즌 */
  normalYears: number[] | null;
  /** 요약 띠가 없으면 머리글과 띄운다 */
  spaced: boolean;
};

/** 탭이 제목을 대신할 때 차트 위에 두는 뷰 설명 — 단위·묶기 기준 */
const ViewCaption = ({ query, normalYears, spaced }: ViewCaptionProps) => (
  <Typography
    sx={{
      px: { xs: 1.75, sm: 2.25 },
      pt: spaced ? 1.5 : 0,
      pb: 1,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: "text.secondary",
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {describeView(query)}
    {normalYears ? (
      <Box component="span" sx={{ fontWeight: 500, color: "text.disabled" }}>
        {"  ·  "}
        {describeNormalYears(normalYears)}
      </Box>
    ) : null}
  </Typography>
);

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

type ViewChartProps = Pick<ExplorerViewProps, "data" | "onQueryChange" | "ongoingYear">;

/** 현재 뷰의 차트 */
const ViewChart = ({ data, onQueryChange, ongoingYear }: ViewChartProps) => {
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
      return <CompositionChart query={query} result={result} ongoingYear={ongoingYear} />;
    case "relation":
      return data.relation ? <Relation query={query} model={data.relation} /> : null;
    case "coverage":
      return data.coverage ? <Coverage coverage={data.coverage} /> : null;
    case "weather":
      return <WeatherChart result={result} />;
    default:
      return <LineChart query={query} result={result} comparison={comparison} />;
  }
};

/** 차트 + 접히는 상세 표 */
const ChartWithTable = ({ data, onQueryChange, ongoingYear }: ViewChartProps) => {
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <>
      <ViewChart data={data} onQueryChange={onQueryChange} ongoingYear={ongoingYear} />
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
const ExplorerView = ({
  data,
  pending,
  selectedQuery,
  onQueryChange,
  requestRawCsv,
  ongoingYear,
  summary,
  tabs,
}: ExplorerViewProps) => {
  const chartAreaRef = useRef<HTMLDivElement | null>(null);
  const { query, result } = data;

  const renderBody = () => {
    if (result.rowCount === 0) return <EmptyResult />;
    if (CHART_VIEWS.includes(query.view))
      return <ChartWithTable data={data} onQueryChange={onQueryChange} ongoingYear={ongoingYear} />;
    return data.seasonSummaries ? (
      <SeasonSummaryTable summaries={data.seasonSummaries} ongoingYear={ongoingYear} />
    ) : (
      <PivotTable query={query} result={result} />
    );
  };

  return (
    <ExplorerPanel
      title={tabs ? undefined : VIEW_LABELS[selectedQuery.view]}
      caption={tabs ? undefined : describeView(selectedQuery)}
      header={tabs}
      action={<ExportMenu query={query} result={result} requestRawCsv={requestRawCsv} chartAreaRef={chartAreaRef} />}
      pending={pending}
      revision={data}
      flush
    >
      {result.rowCount > 0 ? summary : null}
      {tabs && query.view !== "weather" ? (
        <ViewCaption
          query={selectedQuery}
          normalYears={query.compare === "normal" && result.rowCount > 0 ? result.normalYears : null}
          spaced={!summary || result.rowCount === 0}
        />
      ) : null}
      <div ref={chartAreaRef}>{renderBody()}</div>
    </ExplorerPanel>
  );
};

export default ExplorerView;
