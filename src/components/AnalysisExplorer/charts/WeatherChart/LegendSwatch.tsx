import { Box, Typography, useTheme } from "@mui/material";
import { WEATHER_CHART } from "../../../../const/AnalysisLayout";

type LegendSwatchProps = {
  color: string;
  label: string;
  variant: "bar" | "band" | "line" | "dashed";
  /** 생략하면 막대·선은 1, 띠는 기온 밴드 기준 */
  opacity?: number;
};

/** 범례 항목 — 색 표본은 마크 모양을 따르고 글자는 텍스트 색 */
const LegendSwatch = ({ color, label, variant, opacity }: LegendSwatchProps) => {
  const theme = useTheme();
  const isLine = variant === "line" || variant === "dashed";
  /** 범례 표본은 작아 차트 밴드와 같은 불투명도면 거의 안 보인다 — 두 배로 */
  const bandOpacity = WEATHER_CHART.TEMPERATURE_BAND_OPACITY[theme.palette.mode] * 2;
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <Box
        component="span"
        sx={{
          width: variant === "bar" ? 8 : 16,
          height: isLine ? 0 : 10,
          borderTop: isLine ? `2px ${variant === "dashed" ? "dashed" : "solid"} ${color}` : "none",
          bgcolor: isLine ? "transparent" : color,
          opacity: opacity ?? (variant === "band" ? bandOpacity : 1),
          borderRadius: "2px",
        }}
      />
      <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
};

export default LegendSwatch;
