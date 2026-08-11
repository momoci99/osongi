import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { UNION_SORT_LABELS } from "../../const/Regions";
import type { UnionSortKey } from "../../types/region";

type UnionSortToggleProps = {
  value: UnionSortKey;
  onChange: (next: UnionSortKey) => void;
};

/**
 * 조합 목록 정렬 기준 전환.
 * "많이 나온 곳"과 "비싼 곳"은 다른 질문인데 이전에는 물량순 하나로 고정이었다.
 */
const UnionSortToggle = ({ value, onChange }: UnionSortToggleProps) => (
  <ToggleButtonGroup
    exclusive
    size="small"
    value={value}
    onChange={(_, next: UnionSortKey | null) => next && onChange(next)}
    aria-label="조합 정렬 기준"
    sx={{
      "& .MuiToggleButton-root": {
        px: 1.5,
        py: 0.375,
        fontSize: "0.8125rem",
        textTransform: "none",
        borderColor: "divider",
      },
    }}
  >
    {(Object.keys(UNION_SORT_LABELS) as UnionSortKey[]).map((key) => (
      <ToggleButton key={key} value={key}>
        {UNION_SORT_LABELS[key]}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);

export default UnionSortToggle;
