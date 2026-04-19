import { useState } from "react";
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
  Collapse,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  type SelectChangeEvent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { GRADE_OPTIONS, REGION_UNION_MAP } from "../../const/Common";
import { TEST_IDS } from "../../test-ids";
import type { AnalysisFilters } from "../../utils/analysisUtils";
import SectionCard from "../common/SectionCard";
import RegionSelect from "./Filters/RegionSelect";
import UnionSelect from "./Filters/UnionSelect";
import DateRangePickerField from "./Filters/DateRangePicker";
import ComparisonToggle from "./Filters/ComparisonToggle";
import ActiveFilterSummary from "./Filters/ActiveFilterSummary";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  return (
    <SectionCard sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            필터
          </Typography>
          {isMobile && (
            <Button
              size="small"
              variant="text"
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              }
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? "접기" : "열기"}
            </Button>
          )}
        </Box>
        <Button variant="outlined" size="small" onClick={onResetFilters}>
          초기화
        </Button>
      </Box>

      <ActiveFilterSummary filters={filters} onFiltersChange={onFiltersChange} />

      <Collapse
        in={!isMobile || filtersOpen}
        timeout="auto"
        unmountOnExit={isMobile}
      >
        <Grid container spacing={{ xs: 1.25, sm: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RegionSelect filters={filters} onFiltersChange={handleFiltersChange} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <UnionSelect
              filters={filters}
              onFiltersChange={onFiltersChange}
              availableUnions={availableUnions}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
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
      </Collapse>

      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" variant="filled" onClose={() => setToastOpen(false)}>
          선택 불가 조합 {removedUnionsCount}개가 해제되었습니다.
        </Alert>
      </Snackbar>
    </SectionCard>
  );
}
