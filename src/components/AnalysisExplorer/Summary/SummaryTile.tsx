import { Box, Typography } from "@mui/material";

type SummaryTileProps = {
  label: string;
  value: string;
  unit?: string;
  /** 값 아래 보조 설명 (날짜·조합·순위 등) */
  caption?: string;
  /** 대표 지표는 한 단계 크게 */
  emphasis?: boolean;
};

/** 요약 띠의 칸 하나 — 라벨 위, 값·단위 아래 */
const SummaryTile = ({ label, value, unit, caption, emphasis = false }: SummaryTileProps) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary", mb: 0.25 }}>{label}</Typography>
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.375 }}>
      <Typography
        component="span"
        sx={{
          fontSize: emphasis ? "1.5rem" : "1.125rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          lineHeight: 1.3,
          color: emphasis ? "primary.main" : "text.primary",
        }}
      >
        {value}
      </Typography>
      {unit ? (
        <Typography
          component="span"
          sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary", whiteSpace: "nowrap" }}
        >
          {unit}
        </Typography>
      ) : null}
    </Box>
    {caption ? (
      <Typography
        component="span"
        sx={{
          display: "block",
          fontSize: "0.75rem",
          color: "text.disabled",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.5,
        }}
      >
        {caption}
      </Typography>
    ) : null}
  </Box>
);

export default SummaryTile;
