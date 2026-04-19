import { Box, Chip } from "@mui/material";
import { FILTER_PRESETS, isPresetActive } from "../../../const/filterPresets";
import type { AnalysisFilters } from "../../../utils/analysis/filters";

type PresetChipsProps = {
  filters: AnalysisFilters;
  onApply: (filters: AnalysisFilters) => void;
};

/** 필터 추천 프리셋 칩 목록. 현재 필터와 일치하는 칩은 활성 상태로 표시된다. */
const PresetChips = ({ filters, onApply }: PresetChipsProps) => (
  <Box
    sx={{
      display: "flex",
      gap: 1,
      overflowX: "auto",
      pb: 0.5,
      "&::-webkit-scrollbar": { height: 4 },
      "&::-webkit-scrollbar-thumb": {
        bgcolor: "action.disabled",
        borderRadius: 2,
      },
    }}
  >
    {FILTER_PRESETS.map((preset) => {
      const active = isPresetActive(preset, filters);
      return (
        <Chip
          key={preset.id}
          label={preset.label}
          size="small"
          variant={active ? "filled" : "outlined"}
          color={active ? "primary" : "default"}
          onClick={() => onApply(preset.apply(filters))}
          sx={{ flexShrink: 0 }}
        />
      );
    })}
  </Box>
);

export default PresetChips;
