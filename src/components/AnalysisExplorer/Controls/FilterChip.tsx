import { ButtonBase } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

type FilterChipProps = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  /** 앞에 붙는 색 점 (등급·지역 식별색) */
  dotColor?: string;
  /** 색 점을 진하게 — 생략하면 selected. '전 등급'처럼 전체가 포함된 상태면 칩이 꺼져 있어도 결과에 들어 있다 */
  dotActive?: boolean;
};

/**
 * 칩 본체. sx 대신 styled로 두어 스타일을 한 번만 직렬화한다 —
 * 칩이 10여 개라 조작마다 sx를 다시 계산하면 렌더 비용이 커진다.
 */
const ChipButton = styled(ButtonBase, { shouldForwardProp: (prop) => prop !== "selected" })<{
  selected: boolean;
}>(({ theme, selected }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.625),
  height: 28,
  padding: theme.spacing(0, 1.125),
  borderRadius: 14,
  border: "1px solid",
  borderColor: selected ? theme.palette.surface.borderStrong : theme.palette.surface.border,
  backgroundColor: selected ? theme.palette.surface.overlay : "transparent",
  color: selected ? theme.palette.text.primary : theme.palette.text.secondary,
  fontSize: "0.8125rem",
  fontWeight: selected ? 700 : 500,
  whiteSpace: "nowrap",
  "&:hover": { borderColor: theme.palette.surface.borderStrong },
  "&.Mui-focusVisible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
}));

/** 색 점 */
const Dot = styled("span", { shouldForwardProp: (prop) => prop !== "active" })<{ active: boolean }>(
  ({ active }) => ({ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, opacity: active ? 1 : 0.5 }),
);

/** 필터 토글 칩 — MUI Chip보다 낮고 조밀하게, 선택 상태는 테두리+표면 단계로 표현 */
const FilterChip = ({ selected, onClick, children, dotColor, dotActive = selected }: FilterChipProps) => (
  <ChipButton selected={selected} onClick={onClick} aria-pressed={selected}>
    {dotColor ? <Dot active={dotActive} style={{ backgroundColor: dotColor }} /> : null}
    {children}
  </ChipButton>
);

export default FilterChip;
