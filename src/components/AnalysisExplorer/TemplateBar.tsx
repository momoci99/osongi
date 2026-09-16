import { Box, ButtonBase, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { TEMPLATE_BAR } from "../../const/AnalysisLayout";
import {
  ANALYSIS_TEMPLATES,
  type AnalysisTemplateId,
} from "../../utils/analysisQuery/templates";

type TemplateBarProps = {
  activeId: AnalysisTemplateId | null;
  onSelect: (id: AnalysisTemplateId) => void;
};

/**
 * 질문 템플릿 — 탐색기 상태를 한 번에 세팅하는 단축키.
 * 카드에 "질문"을 함께 보여 무엇을 답해 주는지 누르기 전에 알 수 있게 한다.
 */
const TemplateBar = ({ activeId, onSelect }: TemplateBarProps) => (
  <Box
    component="nav"
    aria-label="질문 템플릿"
    sx={{
      display: "grid",
      gridAutoFlow: { xs: "column", md: "row" },
      gridAutoColumns: { xs: `minmax(${TEMPLATE_BAR.CARD_MIN_WIDTH}px, 1fr)`, md: "unset" },
      gridTemplateColumns: {
        md: `repeat(${ANALYSIS_TEMPLATES.length}, minmax(0, 1fr))`,
      },
      gap: 1,
      overflowX: { xs: "auto", md: "visible" },
      pb: { xs: 0.5, md: 0 },
      scrollSnapType: { xs: "x mandatory", md: "none" },
    }}
  >
    {ANALYSIS_TEMPLATES.map((template) => {
      const active = template.id === activeId;
      return (
        <ButtonBase
          key={template.id}
          onClick={() => onSelect(template.id)}
          aria-pressed={active}
          sx={(theme) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            textAlign: "left",
            gap: 0.375,
            px: 1.5,
            py: 1.25,
            borderRadius: "10px",
            border: "1px solid",
            borderColor: active ? "primary.main" : "surface.border",
            bgcolor: active
              ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.06)
              : "surface.raised",
            scrollSnapAlign: "start",
            transition: "border-color 0.15s ease, background-color 0.15s ease",
            "&:hover": {
              borderColor: active ? "primary.main" : "surface.borderStrong",
            },
            "&.Mui-focusVisible": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          })}
        >
          <Typography
            component="span"
            sx={{
              fontSize: "0.875rem",
              fontWeight: 700,
              color: active ? "primary.main" : "text.primary",
              letterSpacing: "-0.01em",
            }}
          >
            {template.label}
          </Typography>
          <Typography
            component="span"
            sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.45 }}
          >
            {template.question}
          </Typography>
        </ButtonBase>
      );
    })}
  </Box>
);

export default TemplateBar;
