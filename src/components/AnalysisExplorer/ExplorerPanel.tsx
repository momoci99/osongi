import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type ExplorerPanelProps = {
  /** 패널 제목. 없으면 머리글을 그리지 않는다 */
  title?: string;
  /** 제목 옆 보조 설명 (현재 선택 요약 등) */
  caption?: ReactNode;
  /** 머리글 오른쪽 컨트롤 */
  action?: ReactNode;
  children: ReactNode;
  /** 본문 안쪽 여백 제거 (표처럼 가장자리까지 채우는 콘텐츠) */
  flush?: boolean;
};

/**
 * 탐색기 공통 패널.
 * surface.raised 위에 테두리로 계층을 만들고, 머리글은 제목·요약·컨트롤 한 줄로 고정한다.
 */
const ExplorerPanel = ({ title, caption, action, children, flush = false }: ExplorerPanelProps) => (
  <Box
    component="section"
    sx={{
      bgcolor: "surface.raised",
      border: "1px solid",
      borderColor: "surface.border",
      borderRadius: "12px",
      overflow: "hidden",
      minWidth: 0,
    }}
  >
    {title ? (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          columnGap: 2,
          rowGap: 1,
          px: { xs: 1.75, sm: 2.25 },
          pt: { xs: 1.5, sm: 1.75 },
          pb: flush ? 1.5 : 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25, minWidth: 0, flexWrap: "wrap" }}>
          <Typography
            component="h2"
            sx={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.01em" }}
          >
            {title}
          </Typography>
          {caption ? (
            <Typography
              component="span"
              sx={{ fontSize: "0.8125rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
            >
              {caption}
            </Typography>
          ) : null}
        </Box>
        {action ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>{action}</Box> : null}
      </Box>
    ) : null}
    <Box sx={{ p: flush ? 0 : { xs: 1.75, sm: 2.25 } }}>{children}</Box>
  </Box>
);

export default ExplorerPanel;
