import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type SidebarSectionProps = {
  title: string;
  children: ReactNode;
};

/** 필터 사이드바 한 묶음 — 작은 제목 아래 컨트롤을 세로로 쌓고, 묶음 사이는 구분선 */
const SidebarSection = ({ title, children }: SidebarSectionProps) => (
  <Box
    component="section"
    aria-label={title}
    sx={{
      px: 2,
      py: 1.75,
      "& + &": { borderTop: "1px solid", borderColor: "surface.border" },
    }}
  >
    <Typography
      component="h3"
      sx={{
        fontSize: "0.6875rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: "text.disabled",
        mb: 1.25,
      }}
    >
      {title}
    </Typography>
    <Box sx={{ display: "grid", gap: 1.5 }}>{children}</Box>
  </Box>
);

export default SidebarSection;
