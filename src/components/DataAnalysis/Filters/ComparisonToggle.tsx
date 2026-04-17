import { Box, Switch, FormControlLabel, Typography } from "@mui/material";
import type { AnalysisFilters } from "../../../utils/analysisUtils";
import { getComparisonDateRange } from "../../../utils/analysisUtils";
import DateRangePickerField from "./DateRangePicker";

type ComparisonToggleProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
};

const ComparisonToggle = ({
  filters,
  onFiltersChange,
}: ComparisonToggleProps) => {
  const handleToggle = () => {
    const enabled = !filters.comparisonEnabled;
    if (enabled && !filters.comparisonStartDate) {
      const { startDate: compStart, endDate: compEnd } = getComparisonDateRange(
        filters.startDate,
        filters.endDate,
      );
      onFiltersChange({
        ...filters,
        comparisonEnabled: enabled,
        comparisonStartDate: compStart,
        comparisonEndDate: compEnd,
      });
    } else {
      onFiltersChange({ ...filters, comparisonEnabled: enabled });
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={filters.comparisonEnabled}
            onChange={handleToggle}
            size="small"
          />
        }
        label={
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            비교 모드
          </Typography>
        }
      />
      {filters.comparisonEnabled && (
        <Box sx={{ flex: 1, minWidth: 280 }}>
          <DateRangePickerField
            startDate={filters.comparisonStartDate}
            endDate={filters.comparisonEndDate}
            onStartDateChange={(date) => {
              if (date)
                onFiltersChange({ ...filters, comparisonStartDate: date });
            }}
            onEndDateChange={(date) => {
              if (date)
                onFiltersChange({ ...filters, comparisonEndDate: date });
            }}
            startLabel="비교 시작일"
            endLabel="비교 종료일"
          />
        </Box>
      )}
    </Box>
  );
};

export default ComparisonToggle;
