import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { GradeKeyToKorean } from "../../../const/Common";
import { ChangeIndicator } from "../AnalysisKPI";

type GradeComparisonTableProps = {
  gradeAnalysis: Array<{
    gradeKey: string;
    avgPrice: number;
    totalQuantity: number;
    quantityShare: number;
    priceChange: number | null;
  }>;
};

/** 등급별 거래 현황과 전년 대비 변화를 표로 정리해 보여주는 컴포넌트 */
const GradeComparisonTable = ({
  gradeAnalysis,
}: GradeComparisonTableProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "0.75rem",
        overflow: "hidden",
      }}
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, opacity: 0.6 }}>등급</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, opacity: 0.6 }}>
                평균단가
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, opacity: 0.6 }}>
                거래량
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, opacity: 0.6 }}>
                점유율
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, opacity: 0.6 }}>
                전년 대비
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gradeAnalysis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography
                    color="text.secondary"
                    sx={{ py: 2, fontSize: "0.875rem" }}
                  >
                    등급별 비교 데이터가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              gradeAnalysis.map((item) => {
                const gradeLabel =
                  GradeKeyToKorean[
                    item.gradeKey as keyof typeof GradeKeyToKorean
                  ] ?? item.gradeKey;

                return (
                  <TableRow key={item.gradeKey}>
                    <TableCell>{gradeLabel}</TableCell>
                    <TableCell align="right">
                      {`${Math.round(item.avgPrice).toLocaleString()}원`}
                    </TableCell>
                    <TableCell align="right">
                      {`${item.totalQuantity.toLocaleString()}kg`}
                    </TableCell>
                    <TableCell align="right">
                      {`${(item.quantityShare * 100).toFixed(1)}%`}
                    </TableCell>
                    <TableCell align="right">
                      {item.priceChange === null ? (
                        "—"
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                          }}
                        >
                          <ChangeIndicator value={item.priceChange} />
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default GradeComparisonTable;
