import { Box, ButtonBase } from "@mui/material";
import ScrollFade from "../../common/ScrollFade";
import { styled } from "@mui/material/styles";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { VIEW_LABELS } from "../../../utils/analysisQuery/labels";
import type { AnalysisView } from "../../../utils/analysisQuery/types";

type ViewTabsProps = {
  view: AnalysisView;
  onChange: (view: AnalysisView) => void;
  /** 호버·포커스 시 결과를 미리 계산 */
  onPrefetch?: (view: AnalysisView) => void;
};

const VIEWS = Object.keys(VIEW_LABELS) as AnalysisView[];

/** 탭 버튼 — 표시선은 ::after 크기 변환으로만 그려 레이아웃 측정이 없다 */
const TabButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
  position: "relative",
  flexShrink: 0,
  minHeight: 44,
  padding: theme.spacing(0, 1.75),
  fontSize: "0.875rem",
  fontWeight: selected ? 700 : 600,
  color: selected ? theme.palette.text.primary : theme.palette.text.secondary,
  whiteSpace: "nowrap",
  "&:hover": { color: theme.palette.text.primary },
  "&::after": {
    content: '""',
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    height: 2,
    borderRadius: "2px 2px 0 0",
    backgroundColor: theme.palette.primary.main,
    transform: selected ? "scaleX(1)" : "scaleX(0)",
  },
  "&.Mui-focusVisible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: -4,
  },
}));

/** 좌우 화살표 이동 거리 */
const ARROW_STEP = { ArrowRight: 1, ArrowLeft: -1 } as const;

/**
 * 분석 뷰 탭.
 * MUI Tabs는 렌더마다 표시선 위치를 재느라 강제 레이아웃을 일으켜
 * 템플릿을 빠르게 바꿀 때 프레임이 끊겼다. 표시선을 CSS로만 그려 측정을 없앤다.
 */
const ViewTabs = ({ view, onChange, onPrefetch }: ViewTabsProps) => {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    function revealSelectedTab() {
      /** 템플릿 등으로 뷰가 바뀌면 좁은 화면에서 선택 탭이 스크롤 밖일 수 있다 */
      listRef.current
        ?.querySelector<HTMLElement>(`[data-view="${view}"]`)
        ?.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "smooth",
        });
    },
    [view],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = ARROW_STEP[event.key as keyof typeof ARROW_STEP];
    if (!step) return;
    event.preventDefault();
    const next =
      VIEWS[(VIEWS.indexOf(view) + step + VIEWS.length) % VIEWS.length];
    onChange(next);
    event.currentTarget
      .querySelector<HTMLElement>(`[data-view="${next}"]`)
      ?.focus();
  };

  return (
    /** 선택 탭을 찾아 스크롤하기 위한 기준 — ScrollFade 안쪽이 실제 스크롤 영역이다 */
    <Box ref={listRef} sx={{ minWidth: 0 }}>
      <ScrollFade
        role="tablist"
        aria-label="분석 뷰"
        onKeyDown={handleKeyDown}
        sx={{
          display: "flex",
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {VIEWS.map((item) => {
          const selected = item === view;
          return (
            <TabButton
              key={item}
              role="tab"
              data-view={item}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              selected={selected}
              onClick={() => onChange(item)}
              onPointerEnter={() => onPrefetch?.(item)}
            >
              {VIEW_LABELS[item]}
            </TabButton>
          );
        })}
      </ScrollFade>
    </Box>
  );
};

export default ViewTabs;
