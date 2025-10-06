import { TablePagination, useTheme } from "@mui/material";
import { TABLE_CONSTANTS } from "../../../const/Numbers";

interface DataTablePaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DataTablePagination({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: DataTablePaginationProps) {
  const theme = useTheme();

  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={onPageChange}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={onRowsPerPageChange}
      rowsPerPageOptions={TABLE_CONSTANTS.ROWS_PER_PAGE_OPTIONS}
      labelRowsPerPage="페이지당 행 수:"
      labelDisplayedRows={({ from, to, count }) =>
        `${from}-${to} / 총 ${count}개`
      }
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        mt: 1,
      }}
    />
  );
}
