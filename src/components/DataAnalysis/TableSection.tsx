import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableContainer,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import type { MushroomAuctionDataRaw } from "../../types/data";
import type { AnalysisFilters } from "../../utils/analysisUtils";
import { transformToTableData } from "../../utils/tableUtils";
import { exportToCsv } from "../../utils/exportCsv";
import { UI_LAYOUT, TABLE_CONSTANTS } from "../../const/Numbers";
import DataTableHeader from "./Table/DataTableHeader";
import DataTableBody from "./Table/DataTableBody";
import DataTablePagination from "./Table/DataTablePagination";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";

interface TableSectionProps {
  loading: boolean;
  filteredData: MushroomAuctionDataRaw[];
  filters: AnalysisFilters;
}

export default function TableSection({
  loading,
  filteredData,
  filters,
}: TableSectionProps) {
  const theme = useTheme();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    TABLE_CONSTANTS.ROWS_PER_PAGE_DEFAULT
  );

  // 테이블용 데이터 변환
  const tableData = useMemo(
    () => transformToTableData(filteredData, filters.grades),
    [filteredData, filters.grades]
  );

  // 페이지네이션 핸들러
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 현재 페이지 데이터
  const paginatedData = tableData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <SectionCard sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: UI_LAYOUT.SECTION_MARGIN_BOTTOM,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>상세 데이터</Typography>
        {!loading && tableData.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              총 {tableData.length}개 레코드
            </Typography>
            <Tooltip title="CSV 다운로드">
              <IconButton
                size="small"
                onClick={() =>
                  exportToCsv(
                    tableData,
                    `오송이_데이터_${new Date().toISOString().slice(0, 10)}`
                  )
                }
              >
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {!loading && tableData.length > 0 ? (
        <Box>
          <TableContainer
            sx={{
              maxHeight: TABLE_CONSTANTS.MAX_HEIGHT,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            }}
          >
            <Table stickyHeader size="small">
              <DataTableHeader />
              <DataTableBody data={paginatedData} />
            </Table>
          </TableContainer>

          <DataTablePagination
            count={tableData.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      ) : (
        <EmptyState loading={loading} height={TABLE_CONSTANTS.MAX_HEIGHT} />
      )}
    </SectionCard>
  );
}
