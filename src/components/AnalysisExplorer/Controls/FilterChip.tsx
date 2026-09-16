import { ButtonBase, Box } from "@mui/material";
import type { ReactNode } from "react";

type FilterChipProps = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  /** 앞에 붙는 색 점 (등급·지역 식별색) */
  dotColor?: string;
};

/** 필터 토글 칩 — MUI Chip보다 낮고 조밀하게, 선택 상태는 테두리+표면 단계로 표현 */
const FilterChip = ({ selected, onClick, children, dotColor }: FilterChipProps) => (
  <ButtonBase
    onClick={onClick}
    aria-pressed={selected}
    sx={(theme) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 0.625,
      height: 28,
      px: 1.125,
      borderRadius: "14px",
      border: "1px solid",
      borderColor: selected ? "surface.borderStrong" : "surface.border",
      bgcolor: selected ? "surface.overlay" : "transparent",
      color: selected ? "text.primary" : "text.secondary",
      fontSize: "0.8125rem",
      fontWeight: selected ? 700 : 500,
      whiteSpace: "nowrap",
      transition: "background-color 0.15s ease, border-color 0.15s ease",
      "&:hover": { borderColor: "surface.borderStrong" },
      "&.Mui-focusVisible": {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 1,
      },
    })}
  >
    {dotColor ? (
      <Box
        component="span"
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: dotColor,
          opacity: selected ? 1 : 0.5,
          flexShrink: 0,
        }}
      />
    ) : null}
    {children}
  </ButtonBase>
);

export default FilterChip;
