import type { ReactNode } from "react";
import { Box, useTheme } from "@mui/material";
import FilterChip from "./FilterChip";
import UnionPicker from "./UnionPicker";
import SidebarSection from "./SidebarSection";
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

/** 칩 묶음 — 사이드바 폭 안에서 줄바꿈 */
const ChipGroup = ({ children }: { children: ReactNode }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>{children}</Box>
);

/** 지역·조합·등급 범위 필터 */
const ScopeFilter = ({ query, onChange }: ScopeFilterProps) => {
  const theme = useTheme();

  return (
    <>
      <SidebarSection title="지역">
        <ChipGroup>
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
              dotActive={query.regions.length === 0 || query.regions.includes(region)}
              selected={query.regions.includes(region)}
              onClick={() => onChange({ regions: toggleItem(query.regions, region) })}
            >
              {region}
            </FilterChip>
          ))}
        </ChipGroup>
        <Box>
          <UnionPicker unions={query.unions} onChange={(unions) => onChange({ unions })} />
        </Box>
      </SidebarSection>

      <SidebarSection title="등급">
        <ChipGroup>
          <FilterChip selected={query.grades.length === 0} onClick={() => onChange({ grades: [] })}>
            전 등급
          </FilterChip>
          {GRADE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              dotColor={theme.palette.chart[option.value]}
              dotActive={query.grades.length === 0 || query.grades.includes(option.value)}
              selected={query.grades.includes(option.value)}
              onClick={() => onChange({ grades: toggleItem<GradeKey>(query.grades, option.value) })}
            >
              {option.label}
            </FilterChip>
          ))}
        </ChipGroup>
      </SidebarSection>
    </>
  );
};

export default ScopeFilter;
