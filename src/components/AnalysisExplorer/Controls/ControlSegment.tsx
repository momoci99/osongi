import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

type ControlSegmentProps<T extends string> = {
  label: string;
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
};

/**
 * 라벨이 붙은 세그먼트 컨트롤.
 * 선택지가 2~4개인 컨트롤은 드롭다운보다 한눈에 현재 상태가 보이는 세그먼트로 둔다.
 */
const ControlSegment = <T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: ControlSegmentProps<T>) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Typography
      component="span"
      sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary", whiteSpace: "nowrap" }}
    >
      {label}
    </Typography>
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_, next: T | null) => {
        if (next !== null) onChange(next);
      }}
      aria-label={label}
      sx={{
        "& .MuiToggleButton-root": {
          px: 1.25,
          py: 0.375,
          fontSize: "0.8125rem",
          fontWeight: 600,
          lineHeight: 1.5,
          color: "text.secondary",
          borderColor: "surface.border",
          whiteSpace: "nowrap",
        },
        "& .MuiToggleButton-root.Mui-selected": {
          color: "text.primary",
          bgcolor: "surface.overlay",
        },
      }}
    >
      {options.map((option) => (
        <ToggleButton key={option} value={option}>
          {labels[option]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  </Box>
);

export default ControlSegment;
