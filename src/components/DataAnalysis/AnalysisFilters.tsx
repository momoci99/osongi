import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  type SelectChangeEvent,
} from "@mui/material";
import { GRADE_OPTIONS, REGION_UNION_MAP } from "../../const/Common";
import type { AnalysisFilters } from "../../utils/analysisUtils";
import SectionCard from "../common/SectionCard";
import RegionSelect from "./Filters/RegionSelect";
import UnionSelect from "./Filters/UnionSelect";
import DateRangePickerField from "./Filters/DateRangePicker";
import ComparisonToggle from "./Filters/ComparisonToggle";

interface AnalysisFiltersProps {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  onResetFilters: () => void;
}

export default function AnalysisFiltersComponent({
  filters,
  onFiltersChange,
  onResetFilters,
}: AnalysisFiltersProps) {
  const availableUnions = (() => {
    if (filters.regions.length === 0) {
      return Object.values(REGION_UNION_MAP).flat().sort();
    }
    const unions = new Set<string>();
    filters.regions.forEach((region) => {
      const regionUnions =
        REGION_UNION_MAP[region as keyof typeof REGION_UNION_MAP] || [];
      regionUnions.forEach((u) => unions.add(u));
    });
    return Array.from(unions).sort();
  })();

  const handleGradeChange = (event: SelectChangeEvent<string[]>) => {
    onFiltersChange({
      ...filters,
      grades:
        typeof event.target.value === "string"
          ? [event.target.value]
          : event.target.value,
    });
  };

  return (
    <SectionCard sx={{ p: 2.5, mb: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          필터
        </Typography>
        <Button variant="outlined" size="small" onClick={onResetFilters}>
          초기화
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RegionSelect filters={filters} onFiltersChange={onFiltersChange} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <UnionSelect
            filters={filters}
            onFiltersChange={onFiltersChange}
            availableUnions={availableUnions}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>등급</InputLabel>
            <Select
              multiple
              value={filters.grades}
              label="등급"
              onChange={handleGradeChange}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => {
                    const option = GRADE_OPTIONS.find(
                      (opt) => opt.value === value,
                    );
                    return (
                      <Chip
                        key={value}
                        label={option?.label || value}
                        size="small"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {GRADE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DateRangePickerField
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(date) => {
              if (date) onFiltersChange({ ...filters, startDate: date });
            }}
            onEndDateChange={(date) => {
              if (date) onFiltersChange({ ...filters, endDate: date });
            }}
          />
        </Grid>

        <Grid size={12}>
          <ComparisonToggle
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </Grid>
      </Grid>
    </SectionCard>
  );
}
