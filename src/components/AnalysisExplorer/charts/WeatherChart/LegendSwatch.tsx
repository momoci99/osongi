import { Box, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { WEATHER_CHART } from "../../../../const/AnalysisLayout";

type LegendSwatchProps = {
  color: string;
  label: string;
  variant: "bar" | "band" | "line" | "dashed" | "dot" | "ring" | "tick";
  /** 생략하면 막대·선은 1, 띠는 기온 밴드 모양(옅은 면 + 윤곽선). 주면 윤곽선 없는 단색 면 */
  opacity?: number;
};

/** 범례 항목 — 색 표본은 마크 모양을 따르고 글자는 텍스트 색 */
const LegendSwatch = ({ color, label, variant, opacity }: LegendSwatchProps) => {
  const theme = useTheme();
  const isLine = variant === "line" || variant === "dashed";
  const temperatureBand = variant === "band" && opacity === undefined;
  const isPoint = variant === "dot" || variant === "ring";
  /** 범례 표본은 작아 차트 밴드와 같은 불투명도면 거의 안 보인다 — 두 배로, 윤곽선은 차트와 같게 */
  const bandFill = alpha(color, WEATHER_CHART.TEMPERATURE_BAND_OPACITY[theme.palette.mode] * 2);
  const bandEdge = `1px solid ${alpha(color, WEATHER_CHART.TEMPERATURE_EDGE_OPACITY)}`;
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <Box
        component="span"
        sx={{
          width: isPoint ? 10 : variant === "tick" ? 2 : variant === "bar" ? 8 : 16,
          height: isLine ? 0 : variant === "tick" ? 12 : 10,
          ...(isPoint && { borderRadius: "50%", boxSizing: "border-box" }),
          borderTop: isLine ? `2px ${variant === "dashed" ? "dashed" : "solid"} ${color}` : temperatureBand ? bandEdge : "none",
          borderBottom: temperatureBand ? bandEdge : "none",
          bgcolor: isLine || variant === "ring" ? "transparent" : temperatureBand ? bandFill : color,
          opacity: opacity ?? 1,
          ...(!isPoint && { borderRadius: "2px" }),
          /** 빈 점 — 위아래 테두리 초기화 뒤에 둬야 테가 온전히 그려진다 */
          ...(variant === "ring" && { border: `2px solid ${color}` }),
        }}
      />
      <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
};

export default LegendSwatch;
