import { useState } from "react";
import {
  Box,
  Grid,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  type SelectChangeEvent,
} from "@mui/material";
import { GRADE_OPTIONS, REGION_UNION_MAP } from "../../const/Common";
import { TEST_IDS } from "../../test-ids";
import type { AnalysisFilters } from "../../utils/analysisUtils";
import RegionSelect from "./Filters/RegionSelect";
import UnionSelect from "./Filters/UnionSelect";
import DateRangePickerField from "./Filters/DateRangePicker";
import ComparisonToggle from "./Filters/ComparisonToggle";

type FilterControlsProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  layout: "vertical" | "horizontal";
};

/** 필터 입력 UI. Drawer(vertical)와 인라인(horizontal) 양쪽에서 재사용한다. */
const FilterControls = ({
  filters,
  onFiltersChange,
  layout,
}: FilterControlsProps) => {
  const [removedUnionsCount, setRemovedUnionsCount] = useState(0);
  const [toastOpen, setToastOpen] = useState(false);

  const handleFiltersChange = (next: AnalysisFilters) => {
    const removed = filters.unions.length - next.unions.length;
    if (removed > 0) {
      setRemovedUnionsCount(removed);
      setToastOpen(true);
    }
    onFiltersChange(next);
  };

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

  const gradeSelect = (
    <FormControl fullWidth size="small" data-testid={TEST_IDS.GRADE_SELECT}>
      <InputLabel>등급</InputLabel>
      <Select
        multiple
        value={filters.grades}
        label="등급"
        onChange={handleGradeChange}
        renderValue={(selected) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((value) => {
              const option = GRADE_OPTIONS.find((opt) => opt.value === value);
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
  );

  const dateRange = (
    <DateRangePickerField
      startDate={filters.startDate}
      endDate={filters.endDate}
      onStartDateChange={(date) => {
        if (date) onFiltersChange({ ...filters, startDate: date });
      }}
      onEndDateChange={(date) => {
        if (date) onFiltersChange({ ...filters, endDate: date });
      }}
      direction={layout === "vertical" ? "column" : "row"}
    />
  );

  const toast = (
    <Snackbar
      open={toastOpen}
      autoHideDuration={2500}
      onClose={() => setToastOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        severity="info"
        variant="filled"
        onClose={() => setToastOpen(false)}
      >
        선택 불가 조합 {removedUnionsCount}개가 해제되었습니다.
      </Alert>
    </Snackbar>
  );

  if (layout === "vertical") {
    return (
      <>
        <Stack spacing={2}>
          <RegionSelect
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          <UnionSelect
            filters={filters}
            onFiltersChange={onFiltersChange}
            availableUnions={availableUnions}
          />
          {gradeSelect}
          {dateRange}
          <ComparisonToggle
            filters={filters}
            onFiltersChange={onFiltersChange}
            dateDirection="column"
          />
        </Stack>
        {toast}
      </>
    );
  }

  return (
    <>
      <Grid container spacing={{ xs: 1.25, sm: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RegionSelect
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <UnionSelect
            filters={filters}
            onFiltersChange={onFiltersChange}
            availableUnions={availableUnions}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>{gradeSelect}</Grid>
        <Grid size={{ xs: 12, md: 6 }}>{dateRange}</Grid>
        <Grid size={12}>
          <ComparisonToggle
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </Grid>
      </Grid>
      {toast}
    </>
  );
};

export default FilterControls;
