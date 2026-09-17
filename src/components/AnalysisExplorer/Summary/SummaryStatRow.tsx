import { Box, Typography } from "@mui/material";

type SummaryStatRowProps = {
  label: string;
  value: string;
  unit?: string;
  /** 값 아래 보조 설명 (날짜·조합 등) */
  caption?: string;
  /** 대표 지표는 한 단계 크게 */
  emphasis?: boolean;
};

/** 요약 패널 한 줄 — 라벨 왼쪽, 값·단위 오른쪽 정렬 */
const SummaryStatRow = ({ label, value, unit, caption, emphasis = false }: SummaryStatRowProps) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 2,
      py: 1.125,
      "& + &": { borderTop: "1px solid", borderColor: "surface.border" },
    }}
  >
    <Typography sx={{ fontSize: "0.8125rem", fontWeight: 500, color: "text.secondary", pt: 0.25 }}>
      {label}
    </Typography>
    <Box sx={{ textAlign: "right", minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 0.375 }}>
        <Typography
          component="span"
          sx={{
            fontSize: emphasis ? "1.375rem" : "1rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            lineHeight: 1.25,
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
          sx={{ display: "block", fontSize: "0.75rem", color: "text.disabled", fontVariantNumeric: "tabular-nums" }}
        >
          {caption}
        </Typography>
      ) : null}
    </Box>
  </Box>
);

export default SummaryStatRow;
