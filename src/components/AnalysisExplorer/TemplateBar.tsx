import { Box, ButtonBase } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { TEMPLATE_BAR } from "../../const/AnalysisLayout";
import {
  ANALYSIS_TEMPLATES,
  type AnalysisTemplateId,
} from "../../utils/analysisQuery/templates";

type TemplateBarProps = {
  activeId: AnalysisTemplateId | null;
  onSelect: (id: AnalysisTemplateId) => void;
  /** 호버·포커스 시 결과를 미리 계산 */
  onPrefetch?: (id: AnalysisTemplateId) => void;
};

/**
 * 카드 본체 — styled로 스타일을 한 번만 직렬화.
 * 선택 표시에는 전환 효과를 두지 않는다 — 누른 즉시 바뀌어야 반응이 빠르게 느껴진다.
 */
const TemplateCard = styled(ButtonBase, { shouldForwardProp: (prop) => prop !== "active" })<{ active: boolean }>(
  ({ theme, active }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    textAlign: "left",
    gap: theme.spacing(0.375),
    padding: theme.spacing(1.25, 1.5),
    borderRadius: 10,
    border: "1px solid",
    borderColor: active ? theme.palette.primary.main : theme.palette.surface.border,
    backgroundColor: active
      ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.06)
      : theme.palette.surface.raised,
    scrollSnapAlign: "start",
    "&:hover": { borderColor: active ? theme.palette.primary.main : theme.palette.surface.borderStrong },
    "&.Mui-focusVisible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
  }),
);

const CardLabel = styled("span", { shouldForwardProp: (prop) => prop !== "active" })<{ active: boolean }>(
  ({ theme, active }) => ({
    fontSize: "0.875rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
  }),
);

const CardQuestion = styled("span")(({ theme }) => ({
  fontSize: "0.75rem",
  lineHeight: 1.45,
  color: theme.palette.text.secondary,
}));

/**
 * 질문 템플릿 — 탐색기 상태를 한 번에 세팅하는 단축키.
 * 카드에 "질문"을 함께 보여 무엇을 답해 주는지 누르기 전에 알 수 있게 한다.
 */
const TemplateBar = ({ activeId, onSelect, onPrefetch }: TemplateBarProps) => (
  <Box
    component="nav"
    aria-label="질문 템플릿"
    sx={{
      display: "grid",
      gridAutoFlow: { xs: "column", md: "row" },
      gridAutoColumns: { xs: `minmax(${TEMPLATE_BAR.CARD_MIN_WIDTH}px, 1fr)`, md: "unset" },
      gridTemplateColumns: { md: `repeat(${ANALYSIS_TEMPLATES.length}, minmax(0, 1fr))` },
      gap: 1,
      overflowX: { xs: "auto", md: "visible" },
      pb: { xs: 0.5, md: 0 },
      scrollSnapType: { xs: "x mandatory", md: "none" },
    }}
  >
    {ANALYSIS_TEMPLATES.map((template) => {
      const active = template.id === activeId;
      return (
        <TemplateCard
          key={template.id}
          active={active}
          onClick={() => onSelect(template.id)}
          onPointerEnter={() => onPrefetch?.(template.id)}
          onFocus={() => onPrefetch?.(template.id)}
          aria-pressed={active}
        >
          <CardLabel active={active}>{template.label}</CardLabel>
          <CardQuestion>{template.question}</CardQuestion>
        </TemplateCard>
      );
    })}
  </Box>
);

export default TemplateBar;
