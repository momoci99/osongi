import { Box, Chip, Typography } from "@mui/material";
import { GRADE_OPTIONS } from "../../../const/Common";
import type { AnalysisFilters } from "../../../utils/analysisUtils";

type ActiveFilterSummaryProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }).replace(/\. /g, "/").replace(".", "");

const ActiveFilterSummary = ({ filters, onFiltersChange }: ActiveFilterSummaryProps) => {
  const chips: { key: string; label: string; onDelete: () => void }[] = [];

  filters.regions.forEach((region) => {
    chips.push({
      key: `region-${region}`,
      label: `지역: ${region}`,
      onDelete: () =>
        onFiltersChange({ ...filters, regions: filters.regions.filter((r) => r !== region) }),
    });
  });

  filters.unions.forEach((union) => {
    chips.push({
      key: `union-${union}`,
      label: `조합: ${union}`,
      onDelete: () =>
        onFiltersChange({ ...filters, unions: filters.unions.filter((u) => u !== union) }),
    });
  });

  const allGradeValues = GRADE_OPTIONS.map((o) => o.value);
  const missingGrades = allGradeValues.filter((g) => !filters.grades.includes(g));
  if (missingGrades.length > 0) {
    const activeLabels = filters.grades.map(
      (g) => GRADE_OPTIONS.find((o) => o.value === g)?.label ?? g
    );
    chips.push({
      key: "grades",
      label: `등급: ${activeLabels.join(", ")}`,
      onDelete: () => onFiltersChange({ ...filters, grades: allGradeValues }),
    });
  }

  chips.push({
    key: "date",
    label: `기간: ${formatDate(filters.startDate)} ~ ${formatDate(filters.endDate)}`,
    onDelete: () => {/* 기간은 삭제 불가 — 읽기 전용 칩으로 표시 */},
  });

  if (chips.length === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.75,
        alignItems: "center",
        px: 0.5,
        py: 0.75,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        적용 중:
      </Typography>
      {chips.map(({ key, label, onDelete }) => {
        const isDeletable = key !== "date";
        return (
          <Chip
            key={key}
            label={label}
            size="small"
            variant="outlined"
            color="primary"
            onDelete={isDeletable ? onDelete : undefined}
            sx={{ fontSize: "0.7rem", height: 24 }}
          />
        );
      })}
    </Box>
  );
};

export default ActiveFilterSummary;
