import { Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { REGION_BREAKDOWN_TABLE } from "../../const/Common";

type ChangeBadgeProps = {
  /** 전일 대비 변화율 (%) */
  changePercent: number;
};

/** 부호에 맞는 화살표와 절댓값 텍스트 */
const formatChange = (changePercent: number): string => {
  const magnitude = Math.abs(changePercent).toFixed(1);
  if (changePercent > 0) return `▲ ${magnitude}%`;
  if (changePercent < 0) return `▼ ${magnitude}%`;
  return `— ${magnitude}%`;
};

/**
 * 전일 대비 변화율 배지.
 * 좁은 화면에서 화살표와 숫자가 두 줄로 갈라지지 않도록 한 덩어리로 묶는다.
 */
const ChangeBadge = ({ changePercent }: ChangeBadgeProps) => {
  const theme = useTheme();
  const color =
    changePercent > 0
      ? theme.palette.chart.up
      : changePercent < 0
        ? theme.palette.chart.down
        : theme.palette.text.secondary;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        minWidth: REGION_BREAKDOWN_TABLE.CHANGE_BADGE_MIN_WIDTH,
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        color,
        bgcolor: alpha(color, REGION_BREAKDOWN_TABLE.CHANGE_BADGE_BG_ALPHA),
        fontSize: "0.75rem",
        fontWeight: 600,
        textAlign: "center",
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {formatChange(changePercent)}
    </Box>
  );
};

export default ChangeBadge;
