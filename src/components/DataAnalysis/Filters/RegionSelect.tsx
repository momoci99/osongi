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
import { AVAILABLE_REGIONS, REGION_UNION_MAP } from "../../../const/Common";
import type { AnalysisFilters } from "../../../utils/analysisUtils";

type RegionSelectProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
};

const RegionSelect = ({ filters, onFiltersChange }: RegionSelectProps) => {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const newRegions =
      typeof event.target.value === "string"
        ? [event.target.value]
        : event.target.value;

    const validUnions = new Set<string>();
    newRegions.forEach((region) => {
      const regionUnions =
        REGION_UNION_MAP[region as keyof typeof REGION_UNION_MAP] || [];
      regionUnions.forEach((u) => validUnions.add(u));
    });
    const filteredUnions =
      newRegions.length === 0
        ? filters.unions
        : filters.unions.filter((u) => validUnions.has(u));

    onFiltersChange({
      ...filters,
      regions: newRegions,
      unions: filteredUnions,
    });
  };

  return (
    <FormControl fullWidth size="small">
      <InputLabel>지역</InputLabel>
      <Select
        multiple
        value={filters.regions}
        label="지역"
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
        {AVAILABLE_REGIONS.map((region) => (
          <MenuItem key={region} value={region}>
            {region}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default RegionSelect;
