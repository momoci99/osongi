import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import type { AnalysisFilters } from "../../../utils/analysisUtils";

type UnionSelectProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  availableUnions: string[];
};

const UnionSelect = ({
  filters,
  onFiltersChange,
  availableUnions,
}: UnionSelectProps) => {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    onFiltersChange({
      ...filters,
      unions:
        typeof event.target.value === "string"
          ? [event.target.value]
          : event.target.value,
    });
  };

  return (
    <FormControl fullWidth size="small">
      <InputLabel>조합</InputLabel>
      <Select
        multiple
        value={filters.unions}
        label="조합"
        onChange={handleChange}
        renderValue={(selected) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                전체
              </Typography>
            ) : (
              selected.map((v) => (
                <Chip key={v} label={v} size="small" variant="outlined" />
              ))
            )}
          </Box>
        )}
      >
        {availableUnions.map((union) => (
          <MenuItem key={union} value={union}>
            {union}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default UnionSelect;
