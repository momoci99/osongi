import {
  Paper,
  Stack,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  type SelectChangeEvent,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import PresetChips from "./Filters/PresetChips";
import DateRangePickerField from "./Filters/DateRangePicker";
import { GRADE_OPTIONS } from "../../const/Common";
import { TEST_IDS } from "../../test-ids";
import type { AnalysisFilters } from "../../utils/analysisUtils";

type InlineFilterBarProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  onAdvancedClick: () => void;
  onResetFilters: () => void;
};

/** 데이터 분석 페이지 인라인 필터 바 */
const InlineFilterBar = ({
  filters,
  onFiltersChange,
  onAdvancedClick,
  onResetFilters,
}: InlineFilterBarProps) => {
  const activeCount =
    filters.regions.length +
    filters.unions.length +
    (filters.comparisonEnabled ? 1 : 0);

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
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        p: { xs: 1.5, md: 2 },
        mb: 2.5,
        bgcolor: "background.paper",
        borderColor: "divider",
      }}
    >
      <Stack direction="column" gap={1.5}>
        <PresetChips filters={filters} onApply={onFiltersChange} />
        <Stack
          direction={{ xs: "column", md: "row" }}
          gap={1.5}
          alignItems={{ md: "center" }}
        >
          <DateRangePickerField
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(date) => {
              if (date) {
                onFiltersChange({ ...filters, startDate: date });
              }
            }}
            onEndDateChange={(date) => {
              if (date) {
                onFiltersChange({ ...filters, endDate: date });
              }
            }}
            direction="row"
          />
          <FormControl
            size="small"
            data-testid={TEST_IDS.GRADE_SELECT}
            sx={{ minWidth: 200 }}
          >
            <InputLabel>등급 ({filters.grades.length}/{GRADE_OPTIONS.length})</InputLabel>
            <Select
              multiple
              value={filters.grades}
              label={`등급 (${filters.grades.length}/${GRADE_OPTIONS.length})`}
              onChange={handleGradeChange}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => {
                    const option = GRADE_OPTIONS.find(
                      (gradeOption) => gradeOption.value === value
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
          <Stack
            direction="row"
            gap={1}
            sx={{ ml: { md: "auto" } }}
          >
            <Button
              variant="text"
              size="small"
              color="inherit"
              onClick={onResetFilters}
            >
              초기화
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon />}
              onClick={onAdvancedClick}
              data-testid={TEST_IDS.ADVANCED_FILTER_BUTTON}
            >
              고급 필터
              {activeCount > 0 && (
                <Box
                  component="span"
                  sx={{ ml: 0.5, color: "primary.main", fontWeight: 600 }}
                >
                  {activeCount > 9 ? "9+" : activeCount}
                </Box>
              )}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default InlineFilterBar;
