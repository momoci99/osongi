import { Box, MenuItem, Select, Typography } from "@mui/material";

type ControlSelectProps<T extends string> = {
  label: string;
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
};

/** 라벨이 붙은 컴팩트 드롭다운 — 선택지가 많은 컨트롤용. 라벨 위, 선택 상자 전폭 */
const ControlSelect = <T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: ControlSelectProps<T>) => (
  <Box sx={{ display: "grid", gap: 0.75 }}>
    <Typography
      component="span"
      sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary", whiteSpace: "nowrap" }}
    >
      {label}
    </Typography>
    <Select
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      inputProps={{ "aria-label": label }}
      fullWidth
      sx={{
        fontSize: "0.8125rem",
        fontWeight: 600,
        "& .MuiSelect-select": { py: 0.625, pl: 1.25 },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "surface.border" },
      }}
    >
      {options.map((option) => (
        <MenuItem key={option} value={option} sx={{ fontSize: "0.8125rem" }}>
          {labels[option]}
        </MenuItem>
      ))}
    </Select>
  </Box>
);

export default ControlSelect;
