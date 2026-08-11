import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { SCOPE_SECTION_HEADING } from "../../const/RegionLayout";

type ScopeSectionHeadingProps = {
  title: string;
  /** 제목 아래 한 줄 보조 설명 */
  caption?: string;
  /** 제목 오른쪽에 붙는 컨트롤 (정렬 토글 등) */
  action?: ReactNode;
  /** 페이지 첫 섹션은 위 여백을 줄인다 */
  dense?: boolean;
};

/**
 * 지역·조합 페이지 공통 섹션 제목.
 *
 * 이전에는 섹션 제목이 16px, 카드 이름이 20px이라 위계가 뒤집혀 있었다.
 * 제목 크기를 한 곳에서 고정해 하위 요소보다 항상 크게 유지한다.
 */
const ScopeSectionHeading = ({
  title,
  caption,
  action,
  dense = false,
}: ScopeSectionHeadingProps) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 1,
      mt: dense ? 0 : SCOPE_SECTION_HEADING.MARGIN_TOP,
      mb: SCOPE_SECTION_HEADING.MARGIN_BOTTOM,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="h2"
        sx={{
          fontWeight: 700,
          fontSize: SCOPE_SECTION_HEADING.FONT_SIZE,
          letterSpacing: SCOPE_SECTION_HEADING.LETTER_SPACING,
          lineHeight: 1.35,
        }}
      >
        {title}
      </Typography>
      {caption ? (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {caption}
        </Typography>
      ) : null}
    </Box>
    {action}
  </Box>
);

export default ScopeSectionHeading;
