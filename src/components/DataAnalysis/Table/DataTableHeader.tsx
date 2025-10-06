import { TableHead, TableRow, TableCell, useTheme } from "@mui/material";
import { TABLE_CONSTANTS } from "../../../const/Numbers";

export default function DataTableHeader() {
  const theme = useTheme();

  return (
    <TableHead>
      <TableRow>
        <TableCell
          sx={{
            fontWeight: TABLE_CONSTANTS.HEADER_FONT_WEIGHT,
            backgroundColor: theme.palette.background.default,
            minWidth: TABLE_CONSTANTS.DATE_COLUMN_WIDTH,
          }}
        >
          날짜
        </TableCell>
        <TableCell
          sx={{
            fontWeight: TABLE_CONSTANTS.HEADER_FONT_WEIGHT,
            backgroundColor: theme.palette.background.default,
            minWidth: TABLE_CONSTANTS.REGION_COLUMN_WIDTH,
          }}
        >
          지역
        </TableCell>
        <TableCell
          sx={{
            fontWeight: TABLE_CONSTANTS.HEADER_FONT_WEIGHT,
            backgroundColor: theme.palette.background.default,
            minWidth: TABLE_CONSTANTS.UNION_COLUMN_WIDTH,
          }}
        >
          조합명
        </TableCell>
        <TableCell
          sx={{
            fontWeight: TABLE_CONSTANTS.HEADER_FONT_WEIGHT,
            backgroundColor: theme.palette.background.default,
            minWidth: TABLE_CONSTANTS.GRADE_COLUMN_WIDTH,
          }}
        >
          등급
        </TableCell>
        <TableCell
          align="right"
          sx={{
            fontWeight: TABLE_CONSTANTS.HEADER_FONT_WEIGHT,
            backgroundColor: theme.palette.background.default,
            minWidth: TABLE_CONSTANTS.QUANTITY_COLUMN_WIDTH,
          }}
        >
          수량(kg)
        </TableCell>
        <TableCell
          align="right"
          sx={{
            fontWeight: TABLE_CONSTANTS.HEADER_FONT_WEIGHT,
            backgroundColor: theme.palette.background.default,
            minWidth: TABLE_CONSTANTS.PRICE_COLUMN_WIDTH,
          }}
        >
          단가(원/kg)
        </TableCell>
      </TableRow>
    </TableHead>
  );
}
