import { useState } from "react";
import {
  Box,
  Switch,
  FormControlLabel,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import type { AnalysisFilters } from "../../../utils/analysisUtils";
import { TEST_IDS } from "../../../test-ids";
import {
  getComparisonDateRange,
  getPresetLastWeek,
  getPresetSeasonStart,
} from "../../../utils/analysisUtils";
import DateRangePickerField from "./DateRangePicker";

type PresetId = "year" | "lastWeek" | "seasonStart";

type ComparisonToggleProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  dateDirection?: "row" | "column";
};

const PRESETS: { id: PresetId; label: string }[] = [
  { id: "year", label: "전년 동기" },
  { id: "lastWeek", label: "직전 1주" },
  { id: "seasonStart", label: "시즌 시작부터" },
];

const ComparisonToggle = ({
  filters,
  onFiltersChange,
  dateDirection = "row",
}: ComparisonToggleProps) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null);

  const applyPreset = (preset: PresetId) => {
    let compStart: Date;
    let compEnd: Date;

    if (preset === "year") {
      const r = getComparisonDateRange(filters.startDate, filters.endDate);
      compStart = r.startDate;
      compEnd = r.endDate;
    } else if (preset === "lastWeek") {
      const r = getPresetLastWeek(filters.startDate);
      compStart = r.startDate;
      compEnd = r.endDate;
    } else {
      const r = getPresetSeasonStart(filters.startDate, filters.endDate);
      compStart = r.startDate;
      compEnd = r.endDate;
    }

    setSelectedPreset(preset);
    onFiltersChange({
      ...filters,
      comparisonEnabled: true,
      comparisonStartDate: compStart,
      comparisonEndDate: compEnd,
    });
  };

  const handleToggle = () => {
    if (filters.comparisonEnabled) {
      setSelectedPreset(null);
      onFiltersChange({ ...filters, comparisonEnabled: false });
    } else {
      applyPreset("year");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <FormControlLabel
        control={
          <Switch
            data-testid={TEST_IDS.COMPARISON_TOGGLE}
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
        <Box sx={{ flex: 1, minWidth: dateDirection === "column" ? 0 : 280 }}>
          <Stack direction="row" sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.75 }}>
            {PRESETS.map((preset) => (
              <Chip
                key={preset.id}
                label={preset.label}
                size="small"
                variant={selectedPreset === preset.id ? "filled" : "outlined"}
                color={selectedPreset === preset.id ? "primary" : "default"}
                onClick={() => applyPreset(preset.id)}
                sx={{ fontSize: "0.7rem", height: 24 }}
              />
            ))}
          </Stack>
          <DateRangePickerField
            startDate={filters.comparisonStartDate}
            endDate={filters.comparisonEndDate}
            onStartDateChange={(date) => {
              if (date) {
                setSelectedPreset(null);
                onFiltersChange({ ...filters, comparisonStartDate: date });
              }
            }}
            onEndDateChange={(date) => {
              if (date) {
                setSelectedPreset(null);
                onFiltersChange({ ...filters, comparisonEndDate: date });
              }
            }}
            startLabel="비교 시작일"
            endLabel="비교 종료일"
            direction={dateDirection}
          />
        </Box>
      )}
    </Box>
  );
};

export default ComparisonToggle;
