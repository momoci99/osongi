import type { SxProps, Theme } from "@mui/material/styles";
import { LINE_CHART } from "../../../const/AnalysisLayout";

/** 툴팁 스타일 — D3가 innerHTML로 채우는 클래스들 */
export const chartTooltipSx = {
  position: "absolute",
  top: 0,
  left: 0,
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity 0.12s ease",
  bgcolor: "surface.overlay",
  border: "1px solid",
  borderColor: "surface.border",
  borderRadius: "8px",
  boxShadow: 4,
  px: 1.5,
  py: 1.125,
  minWidth: 180,
  maxWidth: LINE_CHART.TOOLTIP_MAX_WIDTH,
  zIndex: 2,
  fontSize: "0.75rem",
  "& .tt-title": { fontWeight: 700, fontSize: "0.8125rem", mb: 0.75 },
  "& .tt-row": {
    display: "grid",
    gridTemplateColumns: "10px auto 1fr",
    columnGap: "8px",
    alignItems: "center",
    py: "2px",
  },
  "& .tt-low": { opacity: 0.55 },
  "& .tt-swatch": { width: 10, height: 3, borderRadius: "2px" },
  "& .tt-label": { color: "text.secondary", whiteSpace: "nowrap" },
  "& .tt-value": { fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" },
  "& .tt-detail": { gridColumn: "2 / 4", color: "text.disabled", fontSize: "0.6875rem", mt: "-2px" },
  "& .tt-normal": {
    mt: 0.75,
    pt: 0.75,
    borderTop: "1px solid",
    borderColor: "surface.border",
    color: "text.secondary",
  },
} as const satisfies SxProps<Theme>;

/**
 * 툴팁을 앵커 오른쪽에 두되 넘치면 왼쪽으로 뒤집는다.
 * 컨테이너 기준 좌표를 받는다.
 */
export const placeTooltip = (
  tooltipEl: HTMLElement,
  anchorX: number,
  anchorY: number,
  containerWidth: number,
) => {
  const tooltipWidth = tooltipEl.offsetWidth;
  const left =
    anchorX + LINE_CHART.TOOLTIP_OFFSET + tooltipWidth > containerWidth
      ? anchorX - LINE_CHART.TOOLTIP_OFFSET - tooltipWidth
      : anchorX + LINE_CHART.TOOLTIP_OFFSET;
  tooltipEl.style.left = `${Math.max(0, left)}px`;
  tooltipEl.style.top = `${Math.max(0, anchorY)}px`;
  tooltipEl.style.opacity = "1";
};

/** 툴팁 숨기기 */
export const hideTooltip = (tooltipEl: HTMLElement) => {
  tooltipEl.style.opacity = "0";
};
