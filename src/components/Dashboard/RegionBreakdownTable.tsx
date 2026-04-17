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
import { GradeKeyToKorean } from "../../const/Common";
import DashboardCard from "./DashboardCard";
import type { DailyDataType } from "../../types/DailyData";

type RegionBreakdownTableProps = {
  myRegion: string;
  regionData: { gradeKey: string; quantityKg: number; unitPriceWon: number }[];
  dayComparison: DailyDataType["latestDaily"]["previousDayComparison"];
};

const RegionBreakdownTable = ({
  myRegion,
  regionData,
  dayComparison,
}: RegionBreakdownTableProps) => {
  const theme = useTheme();
  const upColor = theme.palette.chart.up;
  const downColor = theme.palette.chart.down;

  if (regionData.length === 0) {
    return (
      <DashboardCard>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            textAlign: "center",
            py: 3,
          }}
        >
          {myRegion} 지역의 거래 데이터가 없습니다. 시즌 중 공판이 진행되면
          데이터가 표시됩니다.
        </Typography>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, opacity: 0.6 }}>등급</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, opacity: 0.6 }}>
                수량 (kg)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, opacity: 0.6 }}>
                단가 (원/kg)
              </TableCell>
              {dayComparison && (
                <TableCell align="right" sx={{ fontWeight: 600, opacity: 0.6 }}>
                  전일 대비
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {regionData.map((item) => {
              const gradeLabel =
                GradeKeyToKorean[
                  item.gradeKey as keyof typeof GradeKeyToKorean
                ] || item.gradeKey;
              const gradeColor =
                theme.palette.chart[
                  item.gradeKey as keyof typeof theme.palette.chart
                ];
              const change = dayComparison?.gradeChanges.find(
                (c) => c.gradeKey === item.gradeKey,
              );

              return (
                <TableRow key={item.gradeKey}>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                      }}
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
                      {gradeLabel}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {item.quantityKg.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {item.unitPriceWon.toLocaleString()}
                  </TableCell>
                  {dayComparison && change && (
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 500,
                        color:
                          change.changePercent > 0
                            ? upColor
                            : change.changePercent < 0
                              ? downColor
                              : theme.palette.text.secondary,
                      }}
                    >
                      {change.changePercent > 0
                        ? `▲ ${change.changePercent.toFixed(1)}%`
                        : change.changePercent < 0
                          ? `▼ ${Math.abs(change.changePercent).toFixed(1)}%`
                          : "— 0.0%"}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </DashboardCard>
  );
};

export default RegionBreakdownTable;
