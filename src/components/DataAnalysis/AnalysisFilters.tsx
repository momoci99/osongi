import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  type SelectChangeEvent,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  AVAILABLE_REGIONS,
  GRADE_OPTIONS,
  REGION_UNION_MAP,
} from "../../const/Common";
import type { AnalysisFilters } from "../../utils/analysisUtils";

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

  // 선택된 지역들의 조합 합집합
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

  const handleRegionsChange = (event: SelectChangeEvent<string[]>) => {
    const newRegions =
      typeof event.target.value === "string"
        ? [event.target.value]
        : event.target.value;

    // 선택된 지역이 바뀌면 해당 지역에 없는 조합 제거
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

  const handleUnionsChange = (event: SelectChangeEvent<string[]>) => {
    onFiltersChange({
      ...filters,
      unions:
        typeof event.target.value === "string"
          ? [event.target.value]
          : event.target.value,
    });
  };

  const handleGradeChange = (event: SelectChangeEvent<string[]>) => {
    onFiltersChange({
      ...filters,
      grades:
        typeof event.target.value === "string"
          ? [event.target.value]
          : event.target.value,
    });
  };

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      onFiltersChange({ ...filters, startDate: date });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      onFiltersChange({ ...filters, endDate: date });
    }
  };

  const handleComparisonToggle = () => {
    const enabled = !filters.comparisonEnabled;
    if (enabled && !filters.comparisonStartDate) {
      // 비교 모드 켤 때 작년 동기간 자동 설정
      const compStart = new Date(filters.startDate);
      compStart.setFullYear(compStart.getFullYear() - 1);
      const compEnd = new Date(filters.endDate);
      compEnd.setFullYear(compEnd.getFullYear() - 1);
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

  const handleComparisonStartChange = (date: Date | null) => {
    if (date) {
      onFiltersChange({ ...filters, comparisonStartDate: date });
    }
  };

  const handleComparisonEndChange = (date: Date | null) => {
    if (date) {
      onFiltersChange({ ...filters, comparisonEndDate: date });
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: "0.75rem",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          필터
        </Typography>
        <Button variant="outlined" size="small" onClick={onResetFilters}>
          초기화
        </Button>
      </Box>

      <Grid container spacing={2}>
        {/* 지역 선택 (복수) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>지역</InputLabel>
            <Select
              multiple
              value={filters.regions}
              label="지역"
              onChange={handleRegionsChange}
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
        </Grid>

        {/* 조합 선택 (복수) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>조합</InputLabel>
            <Select
              multiple
              value={filters.unions}
              label="조합"
              onChange={handleUnionsChange}
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
        </Grid>

        {/* 등급 선택 */}
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
                      (opt) => opt.value === value
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

        {/* 기간 선택 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <DatePicker
              label="시작일"
              value={filters.startDate}
              onChange={handleStartDateChange}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
            <DatePicker
              label="종료일"
              value={filters.endDate}
              onChange={handleEndDateChange}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
          </Box>
        </Grid>

        {/* 비교 모드 */}
        <Grid size={12}>
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
                  onChange={handleComparisonToggle}
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
              <Box sx={{ display: "flex", gap: 1.5, flex: 1, minWidth: 280 }}>
                <DatePicker
                  label="비교 시작일"
                  value={filters.comparisonStartDate}
                  onChange={handleComparisonStartChange}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
                <DatePicker
                  label="비교 종료일"
                  value={filters.comparisonEndDate}
                  onChange={handleComparisonEndChange}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
