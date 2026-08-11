import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import DashboardCard from "../Dashboard/DashboardCard";
import { GradeKeyToKorean } from "../../const/Common";
import type { GradeStat } from "../../types/region";

type ScopeGradeTableProps = {
  grades: GradeStat[];
  /** 표 위에 붙는 소제목 */
  caption: string;
  emptyMessage: string;
};

/** 등급별 물량·평균 단가 표 */
const ScopeGradeTable = ({ grades, caption, emptyMessage }: ScopeGradeTableProps) => {
  const theme = useTheme();
  const totalQuantityKg = grades.reduce((sum, grade) => sum + grade.quantityKg, 0);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        component="h2"
        variant="h6"
        sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5 }}
      >
        {caption}
      </Typography>
      <DashboardCard>
        {grades.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, textAlign: "center", py: 3 }}
          >
            {emptyMessage}
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, opacity: 0.6 }}>등급</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, opacity: 0.6 }}>
                    평균 단가 (원/kg)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, opacity: 0.6 }}>
                    공판량 (kg)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, opacity: 0.6 }}>
                    비중
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grades.map((grade) => {
                  const gradeColor =
                    theme.palette.chart[
                      grade.gradeKey as keyof typeof theme.palette.chart
                    ];
                  const share =
                    totalQuantityKg > 0
                      ? (grade.quantityKg / totalQuantityKg) * 100
                      : 0;

                  return (
                    <TableRow key={grade.gradeKey}>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "2px",
                              bgcolor:
                                typeof gradeColor === "string"
                                  ? gradeColor
                                  : theme.palette.text.secondary,
                              flexShrink: 0,
                            }}
                          />
                          {GradeKeyToKorean[
                            grade.gradeKey as keyof typeof GradeKeyToKorean
                          ] ?? grade.gradeKey}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {grade.avgUnitPriceWon.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {grade.quantityKg.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        {share.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DashboardCard>
    </Box>
  );
};

export default ScopeGradeTable;
