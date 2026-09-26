import { useEffect, useRef, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes, styled } from "@mui/material/styles";
import { EXPLORER_PENDING } from "../../const/AnalysisLayout";

type ExplorerPanelProps = {
  /** 패널 제목. 없으면 머리글을 그리지 않는다 */
  title?: string;
  /** 제목 옆 보조 설명 (현재 선택 요약 등) */
  caption?: ReactNode;
  /** 머리글 오른쪽 컨트롤 */
  action?: ReactNode;
  /** 제목 대신 쓰는 머리글 (탭 등). 대기 중에도 흐려지지 않는다 */
  header?: ReactNode;
  children: ReactNode;
  /** 본문 안쪽 여백 제거 (표처럼 가장자리까지 채우는 콘텐츠) */
  flush?: boolean;
  /** 새 결과를 계산 중 — 직전 결과를 흐리게 두고 진행 바·빛줄기를 띄운다 */
  pending?: boolean;
  /** 결과가 바뀌면 달라지는 값 — 바뀔 때 본문이 흐림에서 선명하게 나타난다 */
  revision?: unknown;
};

const barSlide = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(${100 / (EXPLORER_PENDING.BAR_WIDTH_PERCENT / 100)}%); }
`;

const sweepSlide = keyframes`
  from { transform: translateX(-120%); }
  to { transform: translateX(${(100 / EXPLORER_PENDING.SWEEP_WIDTH_PERCENT) * 100 + 20}%); }
`;

/** 대기 표시 공통 — 짧은 계산에서는 깜빡이지 않도록 늦게 들어오고 바로 나간다 */
const pendingFade = (pending: boolean) => ({
  opacity: pending ? 1 : 0,
  transition: `opacity ${EXPLORER_PENDING.FADE_MS}ms ease ${pending ? EXPLORER_PENDING.DELAY_MS : 0}ms`,
});

/** 상단 진행 바 */
const PendingBar = styled("div", { shouldForwardProp: (prop) => prop !== "pending" })<{ pending: boolean }>(
  ({ theme, pending }) => ({
    position: "absolute",
    inset: "0 0 auto 0",
    height: EXPLORER_PENDING.BAR_HEIGHT,
    overflow: "hidden",
    zIndex: 3,
    pointerEvents: "none",
    ...pendingFade(pending),
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      width: `${EXPLORER_PENDING.BAR_WIDTH_PERCENT}%`,
      borderRadius: 2,
      backgroundColor: theme.palette.primary.main,
      animation: pending ? `${barSlide} ${EXPLORER_PENDING.BAR_CYCLE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) infinite` : "none",
    },
    "@media (prefers-reduced-motion: reduce)": { "&::before": { animation: "none", width: "100%" } },
  }),
);

/** 결과 위를 훑는 빛줄기 */
const PendingSweep = styled("div", { shouldForwardProp: (prop) => prop !== "pending" })<{ pending: boolean }>(
  ({ theme, pending }) => {
    const light = alpha(
      theme.palette.mode === "dark" ? "#FFF4E6" : "#FFFFFF",
      theme.palette.mode === "dark" ? EXPLORER_PENDING.SWEEP_ALPHA.DARK : EXPLORER_PENDING.SWEEP_ALPHA.LIGHT,
    );
    return {
      position: "absolute",
      inset: 0,
      zIndex: 2,
      pointerEvents: "none",
      overflow: "hidden",
      ...pendingFade(pending),
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        bottom: 0,
        width: `${EXPLORER_PENDING.SWEEP_WIDTH_PERCENT}%`,
        background: `linear-gradient(100deg, transparent 0%, ${light} 50%, transparent 100%)`,
        animation: pending ? `${sweepSlide} ${EXPLORER_PENDING.SWEEP_CYCLE_MS}ms ease-in-out infinite` : "none",
      },
      "@media (prefers-reduced-motion: reduce)": { "&::before": { animation: "none", display: "none" } },
    };
  },
);

/** 본문 — 대기 중 흐림·채도 낮춤 */
const PanelBody = styled("div", { shouldForwardProp: (prop) => prop !== "pending" && prop !== "flush" })<{
  pending: boolean;
  flush: boolean;
}>(({ theme, pending, flush }) => ({
  padding: flush ? 0 : theme.spacing(1.75),
  [theme.breakpoints.up("sm")]: { padding: flush ? 0 : theme.spacing(2.25) },
  opacity: pending ? EXPLORER_PENDING.CONTENT_OPACITY : 1,
  filter: pending ? `blur(${EXPLORER_PENDING.BLUR_PX}px) saturate(${EXPLORER_PENDING.SATURATION})` : "none",
  transition: `opacity ${EXPLORER_PENDING.FADE_MS}ms ease, filter ${EXPLORER_PENDING.FADE_MS}ms ease`,
  transitionDelay: pending ? `${EXPLORER_PENDING.DELAY_MS}ms` : "0ms",
}));

/** 움직임 줄이기 설정 */
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * 결과가 바뀌면 본문을 흐림에서 선명하게 전환한다.
 * 차트를 다시 마운트하지 않도록 key 대신 Web Animations API로 기존 요소에 입힌다.
 */
const useArrivalAnimation = (revision: unknown) => {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const firstRef = useRef(true);

  useEffect(
    function animateResultArrival() {
      if (firstRef.current) {
        firstRef.current = false;
        return;
      }
      const body = bodyRef.current;
      if (!body?.animate || prefersReducedMotion()) return;
      body.animate(
        [
          { opacity: EXPLORER_PENDING.CONTENT_OPACITY, filter: `blur(${EXPLORER_PENDING.BLUR_PX}px)` },
          { opacity: 1, filter: "blur(0px)" },
        ],
        { duration: EXPLORER_PENDING.ARRIVE_MS, easing: "ease-out" },
      );
    },
    [revision],
  );

  return bodyRef;
};

/**
 * 탐색기 공통 패널.
 * surface.raised 위에 테두리로 계층을 만들고, 머리글은 제목·요약·컨트롤 한 줄로 고정한다.
 */
const ExplorerPanel = ({
  title,
  caption,
  action,
  header,
  children,
  flush = false,
  pending = false,
  revision,
}: ExplorerPanelProps) => {
  const bodyRef = useArrivalAnimation(revision);

  return (
    <Box
      component="section"
      aria-busy={pending}
      sx={{
        position: "relative",
        bgcolor: "surface.raised",
        border: "1px solid",
        borderColor: "surface.border",
        borderRadius: "12px",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <PendingBar pending={pending} role={pending ? "progressbar" : undefined} aria-label={pending ? "결과 계산 중" : undefined} />
      {header ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            pl: { xs: 0.5, sm: 1 },
            pr: { xs: 1, sm: 1.5 },
            borderBottom: "1px solid",
            borderColor: "surface.border",
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>{header}</Box>
          {action ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>{action}</Box> : null}
        </Box>
      ) : title ? (
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
            <Typography component="h2" sx={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
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
      <Box sx={{ position: "relative" }}>
        <PanelBody ref={bodyRef} pending={pending} flush={flush}>
          {children}
        </PanelBody>
        <PendingSweep pending={pending} aria-hidden />
      </Box>
    </Box>
  );
};

export default ExplorerPanel;
