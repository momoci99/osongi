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
import { UI_LAYOUT, GRID_BREAKPOINTS, THEME_VALUES } from "../../const/Numbers";

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

  // 모든 조합 목록
  const allUnions = Object.values(REGION_UNION_MAP).flat().sort();

  // 필터 변경 핸들러들
  const handleRegionChange = (event: SelectChangeEvent) => {
    const newRegion = event.target.value;
    const firstUnion =
      REGION_UNION_MAP[newRegion as keyof typeof REGION_UNION_MAP]?.[0] || "";
    onFiltersChange({
      ...filters,
      region: newRegion,
      union: firstUnion, // 지역 변경 시 첫 번째 조합 자동 선택
    });
  };

  const handleUnionChange = (event: SelectChangeEvent) => {
    onFiltersChange({
      ...filters,
      union: event.target.value,
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

  // 지역 기반 조합 필터링 (고정된 지역-조합 매핑 사용)
  const filteredUnions = () => {
    if (!filters.region) return allUnions;

    // 선택된 지역의 조합만 반환
    const unions =
      REGION_UNION_MAP[filters.region as keyof typeof REGION_UNION_MAP] || [];
    return unions.sort();
  };

  return (
    <Paper
      variant={theme.palette.mode === "dark" ? "outlined" : "elevation"}
      elevation={
        theme.palette.mode === "dark"
          ? THEME_VALUES.DARK_ELEVATION
          : THEME_VALUES.LIGHT_ELEVATION
      }
      sx={{
        p: UI_LAYOUT.CARD_PADDING,
        mb: UI_LAYOUT.CARD_MARGIN_BOTTOM,
        borderRadius: UI_LAYOUT.CARD_BORDER_RADIUS,
        width: "100%",
        backgroundImage: "none",
        backgroundColor: "transparent",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: UI_LAYOUT.SECTION_MARGIN_BOTTOM,
        }}
      >
        <Typography variant="h6">필터 설정</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={onResetFilters}
          sx={{ minWidth: "auto", px: UI_LAYOUT.BUTTON_PADDING_X }}
        >
          🔄 초기화
        </Button>
      </Box>

      <Grid container spacing={UI_LAYOUT.GRID_SPACING}>
        {/* 지역 선택 (단일 선택) */}
        <Grid
          size={{
            xs: GRID_BREAKPOINTS.FULL_WIDTH,
            sm: GRID_BREAKPOINTS.HALF_MOBILE_UP,
          }}
        >
          <FormControl fullWidth>
            <InputLabel shrink={filters.region !== ""}>지역</InputLabel>
            <Select
              value={filters.region}
              label="지역"
              onChange={handleRegionChange}
              displayEmpty
              renderValue={(selected) => {
                return selected || "지역 선택";
              }}
            >
              {AVAILABLE_REGIONS.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* 조합 선택 */}
        <Grid
          size={{
            xs: GRID_BREAKPOINTS.FULL_WIDTH,
            sm: GRID_BREAKPOINTS.HALF_MOBILE_UP,
          }}
        >
          <FormControl fullWidth>
            <InputLabel shrink={filters.union !== "" || !filters.region}>
              조합
            </InputLabel>
            <Select
              value={filters.union}
              label="조합"
              onChange={handleUnionChange}
              disabled={!filters.region}
              displayEmpty
              renderValue={(selected) => {
                return selected || "조합 선택";
              }}
            >
              {filteredUnions().map((union) => (
                <MenuItem key={union} value={union}>
                  {union}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* 등급 선택 */}
        <Grid
          size={{
            xs: GRID_BREAKPOINTS.FULL_WIDTH,
            md: GRID_BREAKPOINTS.HALF_MEDIUM_UP,
          }}
        >
          <FormControl fullWidth>
            <InputLabel>등급</InputLabel>
            <Select
              multiple
              value={filters.grades}
              label="등급"
              onChange={handleGradeChange}
              renderValue={(selected) => (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: UI_LAYOUT.CHIP_GAP,
                  }}
                >
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
        <Grid
          size={{
            xs: GRID_BREAKPOINTS.FULL_WIDTH,
            md: GRID_BREAKPOINTS.HALF_MEDIUM_UP,
          }}
        >
          <Box sx={{ display: "flex", gap: UI_LAYOUT.FORM_GAP }}>
            <DatePicker
              label="시작일"
              value={filters.startDate}
              onChange={handleStartDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "medium",
                },
              }}
            />
            <DatePicker
              label="종료일"
              value={filters.endDate}
              onChange={handleEndDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "medium",
                },
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
