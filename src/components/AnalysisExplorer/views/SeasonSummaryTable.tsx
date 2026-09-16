import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { tableContainerSx, tableSx } from "./tableStyles";
import {
  formatInteger,
  formatQuantity,
  formatUnitPrice,
} from "../../../utils/analysisQuery/format";
import type { SeasonSummaryRow } from "../../../utils/analysisQuery/seasonTables";

type SeasonSummaryTableProps = {
  summaries: SeasonSummaryRow[];
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
const SeasonSummaryTable = ({ summaries }: SeasonSummaryTableProps) => (
  <Box sx={tableContainerSx}>
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
          <TableCell>메모</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[...summaries].reverse().map((season) => (
          <TableRow key={season.year}>
            <TableCell className="sticky-col" sx={{ fontWeight: 700 }}>
              {season.year}
            </TableCell>
            <TableCell>{monthDay(season.firstDate)}</TableCell>
            <TableCell>{monthDay(season.lastDate)}</TableCell>
            <TableCell className="numeric">{formatInteger(season.tradingDays)}일</TableCell>
            <TableCell>{monthDay(season.peakDate)}</TableCell>
            <TableCell className="numeric">{withUnit(formatQuantity(season.peakQuantity))}</TableCell>
            <TableCell className="numeric">{withUnit(formatQuantity(season.quantity))}</TableCell>
            <TableCell className="numeric">
              {season.unitPrice === null ? "–" : withUnit(formatUnitPrice(season.unitPrice))}
            </TableCell>
            <TableCell className="numeric">{season.unions}</TableCell>
            <TableCell>
              {season.note ? (
                <Typography component="span" sx={{ fontSize: "0.75rem", color: "secondary.main", fontWeight: 600 }}>
                  {season.note}
                </Typography>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);

export default SeasonSummaryTable;
