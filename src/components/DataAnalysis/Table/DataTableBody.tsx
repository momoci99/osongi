import { TableBody, TableRow, TableCell, useTheme } from "@mui/material";
import type { TableRowData } from "../../../utils/tableUtils";
import { formatNumber, formatPrice } from "../../../utils/tableUtils";
import { TABLE_CONSTANTS } from "../../../const/Numbers";

interface DataTableBodyProps {
  data: TableRowData[];
}

export default function DataTableBody({ data }: DataTableBodyProps) {
  const theme = useTheme();

  return (
    <TableBody>
      {data.map((row) => (
        <TableRow
          key={row.id}
          hover
          sx={{
            "&:nth-of-type(odd)": {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <TableCell sx={{ padding: TABLE_CONSTANTS.CELL_PADDING }}>
            {row.date}
          </TableCell>
          <TableCell sx={{ padding: TABLE_CONSTANTS.CELL_PADDING }}>
            {row.region}
          </TableCell>
          <TableCell sx={{ padding: TABLE_CONSTANTS.CELL_PADDING }}>
            {row.union}
          </TableCell>
          <TableCell sx={{ padding: TABLE_CONSTANTS.CELL_PADDING }}>
            {row.gradeName}
          </TableCell>
          <TableCell
            align="right"
            sx={{ padding: TABLE_CONSTANTS.CELL_PADDING }}
          >
            {formatNumber(row.quantity)}
          </TableCell>
          <TableCell
            align="right"
            sx={{ padding: TABLE_CONSTANTS.CELL_PADDING }}
          >
            {formatPrice(row.unitPrice)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
