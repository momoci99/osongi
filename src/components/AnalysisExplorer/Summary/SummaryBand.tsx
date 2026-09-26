import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { EXPLORER_LAYOUT } from "../../../const/AnalysisLayout";

type SummaryBandProps = {
  /** 요약 칸들 */
  children: ReactNode;
  /** 칸 위 머리 줄 (기준 시즌 선택 등) */
  header?: ReactNode;
  /** 칸 아래 경고·기준 설명 */
  footer?: ReactNode;
};

/** 차트 패널 머리글 아래 요약 띠 — 칸이 넘치면 다음 줄로 흐른다 */
const SummaryBand = ({ children, header, footer }: SummaryBandProps) => (
  <Box
    component="section"
    aria-label="요약"
    sx={{
      px: { xs: 1.75, sm: 2.25 },
      pt: 1.5,
      pb: 1.75,
      mb: 1.5,
      borderBottom: "1px solid",
      borderColor: "surface.border",
    }}
  >
    {header}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${EXPLORER_LAYOUT.SUMMARY_TILE_MIN_WIDTH}px, 1fr))`,
        columnGap: 3,
        rowGap: 1.5,
      }}
    >
      {children}
    </Box>
    {footer}
  </Box>
);

export default SummaryBand;
