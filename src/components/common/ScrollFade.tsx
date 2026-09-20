import { Box } from "@mui/material";
import { useRef, type ElementType, type ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import useScrollEdges from "../../hooks/useScrollEdges";
import { SCROLL_FADE } from "../../const/Common";

type ScrollFadeProps = {
  children: ReactNode;
  /** 스크롤 영역 자체에 줄 스타일 */
  sx?: SxProps<Theme>;
  /** 스크롤 영역 시맨틱 태그 */
  component?: ElementType;
  /** 페이드 바탕색 (테마 경로). 스크롤 영역이 놓인 면 색과 맞춘다 */
  surface?: string;
  /**
   * 왼쪽 페이드를 함께 쓸지.
   * 첫 열을 고정한 표처럼 왼쪽 끝에 계속 보여야 할 내용이 있으면 끈다.
   */
  fadeStart?: boolean;
  /** 내용이 바뀌면 다시 재도록 넘기는 값 */
  revision?: unknown;
  role?: string;
  "aria-label"?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

/** 페이드 한 쪽 */
const FadeEdge = ({ side, surface }: { side: "left" | "right"; surface: string }) => (
  <Box
    aria-hidden
    data-scroll-fade={side}
    sx={{
      position: "absolute",
      top: 0,
      bottom: 0,
      [side]: 0,
      width: SCROLL_FADE.WIDTH,
      pointerEvents: "none",
      zIndex: SCROLL_FADE.Z_INDEX,
      background: (theme) =>
        `linear-gradient(to ${side === "left" ? "right" : "left"}, ${theme.palette.surface[
          surface as keyof typeof theme.palette.surface
        ]}, transparent)`,
    }}
  />
);

/**
 * 가로로 넘치는 영역의 끝을 흐리게 해 더 볼 내용이 있음을 알린다.
 * 스크롤이 끝에 닿으면 그쪽 페이드는 사라진다.
 */
const ScrollFade = ({
  children,
  sx,
  component = "div",
  surface = "raised",
  fadeStart = true,
  revision,
  ...rest
}: ScrollFadeProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const edges = useScrollEdges(scrollerRef, revision);

  return (
    <Box sx={{ position: "relative", minWidth: 0 }}>
      <Box ref={scrollerRef} component={component} sx={sx} {...rest}>
        {children}
      </Box>
      {fadeStart && edges.start ? <FadeEdge side="left" surface={surface} /> : null}
      {edges.end ? <FadeEdge side="right" surface={surface} /> : null}
    </Box>
  );
};

export default ScrollFade;
