import { Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { tableContainerSx, tableSx } from "./tableStyles";
import ScrollFade from "../../common/ScrollFade";
import { ONGOING_SEASON_LABEL } from "../../../const/AnalysisCharts";
import { formatInteger, formatQuantity, formatUnitPrice } from "../../../utils/analysisQuery/format";
import type { SeasonSummaryRow } from "../../../utils/analysisQuery/seasonTables";

type SeasonSummaryTableProps = {
  summaries: SeasonSummaryRow[];
  /** 아직 끝나지 않은 시즌 연도 (없으면 null) */
  ongoingYear: number | null;
};

/** MM-DD 표시 */
const monthDay = (date: string): string => {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
};

/** 값+단위 한 칸 */
const withUnit = ({ value, unit }: { value: string; unit: string }) => (
  <>
    {value}
    <Box component="span" sx={{ ml: 0.25, color: "text.disabled", fontSize: "0.6875rem" }}>
      {unit}
    </Box>
  </>
);

/** 시즌별 개시·종료·피크·총량·가중 단가 */
const SeasonSummaryTable = ({ summaries, ongoingYear }: SeasonSummaryTableProps) => {
  /** 열 안에서 단위를 통일해야 위아래 행을 바로 비교할 수 있다 */
  const peakScale = Math.max(0, ...summaries.map((season) => season.peakQuantity));
  const totalScale = Math.max(0, ...summaries.map((season) => season.quantity));

  return (
    <ScrollFade sx={tableContainerSx} fadeStart={false} revision={summaries}>
      <Table stickyHeader size="small" sx={tableSx}>
        <TableHead>
          <TableRow>
            <TableCell className="sticky-col">시즌</TableCell>
            <TableCell>개시</TableCell>
            <TableCell>종료</TableCell>
            <TableCell className="numeric">공판일</TableCell>
            <TableCell>피크일</TableCell>
            <TableCell className="numeric">피크 물량</TableCell>
            <TableCell className="numeric">총 물량</TableCell>
            <TableCell className="numeric">가중 단가</TableCell>
            <TableCell className="numeric">조합</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...summaries].reverse().map((season) => (
            <TableRow key={season.year}>
              <TableCell className="sticky-col" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                {season.year}
                {season.year === ongoingYear ? (
                  <Box
                    component="span"
                    sx={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "primary.main" }}
                  >
                    {ONGOING_SEASON_LABEL}
                  </Box>
                ) : null}
              </TableCell>
              <TableCell>{monthDay(season.firstDate)}</TableCell>
              <TableCell>{monthDay(season.lastDate)}</TableCell>
              <TableCell className="numeric">{formatInteger(season.tradingDays)}일</TableCell>
              <TableCell>{monthDay(season.peakDate)}</TableCell>
              <TableCell className="numeric">{withUnit(formatQuantity(season.peakQuantity, peakScale))}</TableCell>
              <TableCell className="numeric">{withUnit(formatQuantity(season.quantity, totalScale))}</TableCell>
              <TableCell className="numeric">
                {season.unitPrice === null ? "–" : withUnit(formatUnitPrice(season.unitPrice))}
              </TableCell>
              <TableCell className="numeric">{season.unions}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollFade>
  );
};

export default SeasonSummaryTable;
