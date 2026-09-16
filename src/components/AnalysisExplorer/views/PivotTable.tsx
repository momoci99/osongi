import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { tableContainerSx, tableSx } from "./tableStyles";
import { EXPLORER_TABLE } from "../../../const/AnalysisLayout";
import { compareX } from "../../../utils/analysisQuery/aggregate";
import { formatAxisValue, formatMetricText } from "../../../utils/analysisQuery/format";
import type {
  AnalysisQuery,
  AnalysisResult,
  NormalBandPoint,
} from "../../../utils/analysisQuery/types";

type PivotTableProps = {
  query: AnalysisQuery;
  result: AnalysisResult;
};

type PivotRow = {
  key: string;
  label: string;
  sortYear: number;
  sortX: string | number;
  cells: Map<string, { value: number | null; lowSample: boolean }>;
};

/**
 * 시즌 겹침 축(월일·시즌일차)에서 시즌으로 묶지 않으면
 * 서로 다른 해의 같은 x가 한 행으로 섞이므로 행 키에 연도를 붙인다.
 */
const needsYearInRow = (result: AnalysisResult, query: AnalysisQuery): boolean =>
  (result.axis === "monthDay" || result.axis === "seasonDay") && query.groupBy !== "year";

/** 집계 결과를 행 = x, 열 = 시리즈 표로 펼친다 */
const buildPivotRows = (result: AnalysisResult, query: AnalysisQuery, seriesKeys: string[]): PivotRow[] => {
  const withYear = needsYearInRow(result, query);
  const rows = new Map<string, PivotRow>();

  for (const series of result.series) {
    if (!seriesKeys.includes(series.key)) continue;
    for (const point of series.points) {
      const key = withYear ? `${point.year}|${point.x}` : String(point.x);
      const label = formatAxisValue(result.axis, point.x, query.granularity);
      const row = rows.get(key) ?? {
        key,
        label: withYear ? `${point.year} · ${label}` : label,
        sortYear: withYear ? point.year : 0,
        sortX: point.x,
        cells: new Map(),
      };
      row.cells.set(series.key, { value: point.value, lowSample: point.lowSample });
      rows.set(key, row);
    }
  }

  return [...rows.values()].sort((a, b) => a.sortYear - b.sortYear || compareX(a.sortX, b.sortX));
};

type NormalCellsProps = {
  point: NormalBandPoint | undefined;
  metric: AnalysisQuery["metric"];
};

/** 평년 중앙값·범위 셀 */
const NormalCells = ({ point, metric }: NormalCellsProps) => (
  <>
    <TableCell className="numeric" sx={{ color: "text.secondary" }}>
      {point ? formatMetricText(metric, point.median) : ""}
    </TableCell>
    <TableCell className="numeric" sx={{ color: "text.disabled" }}>
      {point ? `${formatMetricText(metric, point.lower)} – ${formatMetricText(metric, point.upper)}` : ""}
    </TableCell>
  </>
);

/** 범용 피벗 표 — 모든 뷰의 수치 확인용 폴백 */
const PivotTable = ({ query, result }: PivotTableProps) => {
  const visibleSeries = result.series.slice(0, EXPLORER_TABLE.MAX_SERIES_COLUMNS);
  const hiddenCount = result.series.length - visibleSeries.length;
  const rows = buildPivotRows(result, query, visibleSeries.map((series) => series.key));
  const normalByX = new Map((result.normalBand ?? []).map((point) => [String(point.x), point]));
  const showNormal = result.normalBand !== null;

  return (
    <Box>
      <Box sx={tableContainerSx}>
        <Table stickyHeader size="small" sx={tableSx}>
          <TableHead>
            <TableRow>
              <TableCell className="sticky-col">구간</TableCell>
              {visibleSeries.map((series) => (
                <TableCell key={series.key} className="numeric">
                  {series.label}
                </TableCell>
              ))}
              {showNormal ? (
                <>
                  <TableCell className="numeric">평년 중앙값</TableCell>
                  <TableCell className="numeric">평년 범위 (P25–P75)</TableCell>
                </>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="sticky-col" sx={{ fontWeight: 600 }}>
                  {row.label}
                </TableCell>
                {visibleSeries.map((series) => {
                  const cell = row.cells.get(series.key);
                  return (
                    <TableCell
                      key={series.key}
                      className="numeric"
                      sx={{ color: cell?.lowSample ? "text.disabled" : "text.primary" }}
                    >
                      {cell ? formatMetricText(query.metric, cell.value) : ""}
                    </TableCell>
                  );
                })}
                {showNormal ? <NormalCells point={normalByX.get(String(row.sortX))} metric={query.metric} /> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Typography variant="caption" sx={{ display: "block", px: 2, py: 1, color: "text.disabled" }}>
        흐린 값은 공판 건수가 적은 구간입니다
        {hiddenCount > 0 ? ` · 시리즈 ${hiddenCount}개는 열이 많아 생략했습니다` : ""}
      </Typography>
    </Box>
  );
};

export default PivotTable;
