import type { SxProps, Theme } from "@mui/material/styles";
import { EXPLORER_TABLE } from "../../../const/AnalysisLayout";

/** 탐색기 표 컨테이너 — 내부 스크롤 + 머리글 고정 */
export const tableContainerSx: SxProps<Theme> = {
  maxHeight: EXPLORER_TABLE.MAX_HEIGHT,
  overflow: "auto",
};

/** 조밀한 숫자 표 공통 셀 스타일 */
export const tableSx: SxProps<Theme> = {
  "& th, & td": {
    fontSize: "0.8125rem",
    py: 0.875,
    px: 1.5,
    borderColor: "surface.border",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  "& thead th": {
    bgcolor: "surface.base",
    color: "text.secondary",
    fontWeight: 700,
    fontSize: "0.75rem",
    borderBottomColor: "surface.borderStrong",
  },
  "& tbody tr:hover td": { bgcolor: "surface.overlay" },
  "& td.numeric, & th.numeric": { textAlign: "right" },
  "& th.sticky-col, & td.sticky-col": {
    position: "sticky",
    left: 0,
    zIndex: 1,
    bgcolor: "surface.raised",
    borderRight: "1px solid",
    borderRightColor: "surface.border",
  },
  "& thead th.sticky-col": { zIndex: 3, bgcolor: "surface.base" },
};
