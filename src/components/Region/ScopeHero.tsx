import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { SCOPE_HERO } from "../../const/RegionLayout";

type ScopeHeroProps = {
  /** 제목·설명 등 본문 열 */
  children: ReactNode;
  /** 오른쪽에 세우는 지표 패널 */
  stats: ReactNode;
};

/**
 * 페이지 상단 2단 배치.
 *
 * 제목과 요약 문단은 가독을 위해 글자 폭을 제한하는데, 그러면 넓은 화면에서
 * 오른쪽 절반이 통째로 비어 첫 화면이 한쪽으로 쏠려 보였다.
 * 그 자리에 지표 패널을 세워 빈 면적을 없애고 지표를 스크롤 없이 노출한다.
 */
const ScopeHero = ({ children, stats }: ScopeHeroProps) => (
  <Box
    component="section"
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        [SCOPE_HERO.SPLIT_BREAKPOINT]: `minmax(0, 1fr) ${SCOPE_HERO.STATS_WIDTH}px`,
      },
      gap: { xs: 2, [SCOPE_HERO.SPLIT_BREAKPOINT]: 5 },
      alignItems: "start",
    }}
  >
    <Box sx={{ minWidth: 0 }}>{children}</Box>
    {stats}
  </Box>
);

export default ScopeHero;
