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
import DashboardCard from "../Dashboard/DashboardCard";
import { GradeKeyToKorean } from "../../const/Common";
import { GRADE_SHARE_BAR } from "../../const/Charts";
import type { GradeStat } from "../../types/region";

type ScopeGradeTableProps = {
  grades: GradeStat[];
  /** 표 위에 붙는 소제목 */
  caption: string;
  emptyMessage: string;
};

/** 등급 + 물량 비중을 함께 들고 다니는 행 단위 데이터 */
type GradeRow = GradeStat & {
  label: string;
  color: string;
  sharePercent: number;
};

const gradeLabel = (gradeKey: string): string =>
  GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey;

const gradeColor = (theme: Theme, gradeKey: string): string => {
  const color = theme.palette.chart[gradeKey as keyof typeof theme.palette.chart];
  return typeof color === "string" ? color : theme.palette.text.secondary;
};

/** 소수점이 그대로 노출되면 표가 지저분해진다. kg은 정수로 끊는다 */
const formatKg = (value: number): string =>
  Math.round(value).toLocaleString("ko-KR");

const toRows = (grades: GradeStat[], theme: Theme): GradeRow[] => {
  const total = grades.reduce((sum, grade) => sum + grade.quantityKg, 0);

  return grades.map((grade) => ({
    ...grade,
    label: gradeLabel(grade.gradeKey),
    color: gradeColor(theme, grade.gradeKey),
    sharePercent: total > 0 ? (grade.quantityKg / total) * 100 : 0,
  }));
};

type GradeDotProps = { color: string };

const GradeDot = ({ color }: GradeDotProps) => (
  <Box
    sx={{
      width: 10,
      height: 10,
      borderRadius: "2px",
      bgcolor: color,
      flexShrink: 0,
    }}
  />
);

type ShareBarProps = { percent: number; color: string };

/**
 * 비중을 숫자만 보여주면 등외품 편중 같은 쏠림이 눈에 들어오지 않는다.
 * 막대를 겹쳐 한눈에 비율이 읽히게 한다.
 */
const ShareBar = ({ percent, color }: ShareBarProps) => (
  <Box
    sx={{
      width: "100%",
      height: GRADE_SHARE_BAR.HEIGHT,
      borderRadius: GRADE_SHARE_BAR.RADIUS,
      bgcolor: "action.hover",
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        width: `${percent}%`,
        height: "100%",
        bgcolor: color,
        opacity: GRADE_SHARE_BAR.OPACITY,
      }}
    />
  </Box>
);

type GradeRowsProps = { rows: GradeRow[] };

/**
 * 모바일 표현. 4열 표를 390px에 밀어 넣으면 등급명이 한 글자씩 세로로 쪼개져
 * 읽을 수 없다. 좁은 폭에서는 표를 버리고 행 카드로 바꾼다.
 */
const GradeCardList = ({ rows }: GradeRowsProps) => (
  <Box sx={{ display: { xs: "block", sm: "none" } }}>
    {rows.map((row, index) => (
      <Box
        key={row.gradeKey}
        sx={{
          py: 1.5,
          borderTop: index === 0 ? "none" : "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mb: 0.75,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
            <GradeDot color={row.color} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {row.label}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
          >
            {row.avgUnitPriceWon.toLocaleString("ko-KR")}
            <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.25 }}>
              원/kg
            </Typography>
          </Typography>
        </Box>

        <ShareBar percent={row.sharePercent} color={row.color} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 0.5,
            color: "text.secondary",
          }}
        >
          <Typography variant="caption">{formatKg(row.quantityKg)}kg</Typography>
          <Typography variant="caption">{row.sharePercent.toFixed(1)}%</Typography>
        </Box>
      </Box>
    ))}
  </Box>
);

const HEAD_CELL_SX = { fontWeight: 600, opacity: 0.6 } as const;

/** 데스크톱 표현 */
const GradeTable = ({ rows }: GradeRowsProps) => (
  <TableContainer sx={{ display: { xs: "none", sm: "block" } }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={HEAD_CELL_SX}>등급</TableCell>
          <TableCell align="right" sx={HEAD_CELL_SX}>
            평균 단가 (원/kg)
          </TableCell>
          <TableCell align="right" sx={HEAD_CELL_SX}>
            공판량 (kg)
          </TableCell>
          <TableCell align="right" sx={{ ...HEAD_CELL_SX, width: "22%" }}>
            비중
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.gradeKey}>
            <TableCell>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <GradeDot color={row.color} />
                {row.label}
              </Box>
            </TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
            >
              {row.avgUnitPriceWon.toLocaleString("ko-KR")}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatKg(row.quantityKg)}
            </TableCell>
            <TableCell align="right">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  justifyContent: "flex-end",
                }}
              >
                <ShareBar percent={row.sharePercent} color={row.color} />
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.sharePercent.toFixed(1)}%
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

/** 등급별 물량·평균 단가. 모바일은 카드 리스트, 데스크톱은 표로 갈라진다 */
const ScopeGradeTable = ({ grades, caption, emptyMessage }: ScopeGradeTableProps) => {
  const theme = useTheme();
  const rows = toRows(grades, theme);

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
        {rows.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, textAlign: "center", py: 3 }}
          >
            {emptyMessage}
          </Typography>
        ) : (
          <>
            <GradeCardList rows={rows} />
            <GradeTable rows={rows} />
          </>
        )}
      </DashboardCard>
    </Box>
  );
};

export default ScopeGradeTable;
