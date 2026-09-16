import { Box, Divider, useTheme } from "@mui/material";
import FilterChip from "./FilterChip";
import UnionPicker from "./UnionPicker";
import { AVAILABLE_REGIONS, GRADE_OPTIONS } from "../../../const/Common";
import { regionColor } from "../../../const/Regions";
import type { AnalysisQuery, GradeKey } from "../../../utils/analysisQuery/types";

type ScopeFilterProps = {
  query: AnalysisQuery;
  onChange: (patch: Pick<Partial<AnalysisQuery>, "regions" | "unions" | "grades">) => void;
};

/** 배열 토글 */
const toggleItem = <T,>(items: T[], item: T): T[] =>
  items.includes(item) ? items.filter((value) => value !== item) : [...items, item];

/** 지역·조합·등급 범위 필터 */
const ScopeFilter = ({ query, onChange }: ScopeFilterProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: 0.75,
        rowGap: 1,
      }}
    >
      <FilterChip
        selected={query.regions.length === 0 && query.unions.length === 0}
        onClick={() => onChange({ regions: [], unions: [] })}
      >
        전국
      </FilterChip>
      {AVAILABLE_REGIONS.map((region) => (
        <FilterChip
          key={region}
          dotColor={regionColor(region)}
          selected={query.regions.includes(region)}
          onClick={() => onChange({ regions: toggleItem(query.regions, region) })}
        >
          {region}
        </FilterChip>
      ))}
      <UnionPicker unions={query.unions} onChange={(unions) => onChange({ unions })} />

      <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.5 }} />

      <FilterChip selected={query.grades.length === 0} onClick={() => onChange({ grades: [] })}>
        전 등급
      </FilterChip>
      {GRADE_OPTIONS.map((option) => (
        <FilterChip
          key={option.value}
          dotColor={theme.palette.chart[option.value]}
          selected={query.grades.includes(option.value)}
          onClick={() => onChange({ grades: toggleItem<GradeKey>(query.grades, option.value) })}
        >
          {option.label}
        </FilterChip>
      ))}
    </Box>
  );
};

export default ScopeFilter;
