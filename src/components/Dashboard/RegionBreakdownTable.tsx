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
import type { Theme } from "@mui/material/styles";
import { GradeKeyToKorean, REGION_BREAKDOWN_TABLE } from "../../const/Common";
import DashboardCard from "./DashboardCard";
import ChangeBadge from "./ChangeBadge";
import splitGradeLabel from "../../utils/splitGradeLabel";
import type { DailyDataType } from "../../types/DailyData";

type RegionGradeItem = {
  gradeKey: string;
  quantityKg: number;
  unitPriceWon: number;
};

type RegionBreakdownTableProps = {
  myRegion: string;
  regionData: RegionGradeItem[];
  dayComparison: DailyDataType["latestDaily"]["previousDayComparison"];
};

/** 좁은 화면(xs)에서만 보이는 요소 */
const MOBILE_ONLY = { xs: "block", sm: "none" } as const;
/** 좁은 화면(xs)에서 숨기는 표 셀 */
const DESKTOP_CELL = { xs: "none", sm: "table-cell" } as const;

const HEAD_CELL_SX = {
  fontWeight: 600,
  opacity: 0.6,
  whiteSpace: "nowrap",
} as const;

/** 셀 좌우 여백. 카드 padding과 겹쳐 좁은 화면 폭을 낭비하지 않게 줄인다 */
const CELL_SX = { px: { xs: 1, sm: 2 } } as const;

const NUMBER_CELL_SX = {
  ...CELL_SX,
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
} as const;

const gradeLabel = (gradeKey: string): string =>
  GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey;

const gradeColor = (theme: Theme, gradeKey: string): string => {
  const color =
    theme.palette.chart[gradeKey as keyof typeof theme.palette.chart];
  return typeof color === "string" ? color : theme.palette.text.secondary;
};

const formatKg = (value: number): string =>
  value.toLocaleString("ko-KR", {
    maximumFractionDigits: REGION_BREAKDOWN_TABLE.QUANTITY_FRACTION_DIGITS,
  });

/** 원 단위 소수점은 의미가 없고 폭만 차지하므로 정수로 반올림 */
const formatWon = (value: number): string =>
  Math.round(value).toLocaleString("ko-KR");

type GradeCellProps = { item: RegionGradeItem };

/** 등급 셀. 좁은 화면에서는 숨겨진 수량 열을 보조 텍스트로 흡수한다 */
const GradeCell = ({ item }: GradeCellProps) => {
  const theme = useTheme();
  const { main, qualifier } = splitGradeLabel(gradeLabel(item.gradeKey));
  const subTextSx = {
    color: theme.palette.text.secondary,
    lineHeight: 1.3,
  } as const;

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          mt: 0.625,
          borderRadius: "2px",
          bgcolor: gradeColor(theme, item.gradeKey),
          flexShrink: 0,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
          {main}
        </Typography>
        {qualifier && (
          <Typography
            variant="caption"
            sx={{ ...subTextSx, display: "block", whiteSpace: "nowrap" }}
          >
            {qualifier}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            ...subTextSx,
            display: MOBILE_ONLY,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatKg(item.quantityKg)}kg
        </Typography>
      </Box>
    </Box>
  );
};

/** 내 지역 등급별 수량·단가·전일 대비. 좁은 화면에서는 수량 열을 등급 셀로 합친다 */
const RegionBreakdownTable = ({
  myRegion,
  regionData,
  dayComparison,
}: RegionBreakdownTableProps) => {
  const theme = useTheme();

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
              <TableCell sx={{ ...HEAD_CELL_SX, ...CELL_SX }}>등급</TableCell>
              <TableCell
                align="right"
                sx={{ ...HEAD_CELL_SX, ...CELL_SX, display: DESKTOP_CELL }}
              >
                수량 (kg)
              </TableCell>
              <TableCell align="right" sx={{ ...HEAD_CELL_SX, ...CELL_SX }}>
                단가 (원/kg)
              </TableCell>
              {dayComparison && (
                <TableCell align="right" sx={{ ...HEAD_CELL_SX, ...CELL_SX }}>
                  전일 대비
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {regionData.map((item) => {
              const change = dayComparison?.gradeChanges.find(
                (c) => c.gradeKey === item.gradeKey,
              );

              return (
                <TableRow key={item.gradeKey}>
                  <TableCell sx={CELL_SX}>
                    <GradeCell item={item} />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ ...NUMBER_CELL_SX, display: DESKTOP_CELL }}
                  >
                    {formatKg(item.quantityKg)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ ...NUMBER_CELL_SX, fontWeight: 600 }}
                  >
                    {formatWon(item.unitPriceWon)}
                  </TableCell>
                  {dayComparison && (
                    <TableCell align="right" sx={CELL_SX}>
                      {change && (
                        <ChangeBadge changePercent={change.changePercent} />
                      )}
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
