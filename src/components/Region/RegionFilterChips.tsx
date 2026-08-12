import { Box, Chip } from "@mui/material";
import { ALL_REGIONS_FILTER, regionColor } from "../../const/Regions";
import { SCOPE_RANK_LIST } from "../../const/RegionLayout";

type RegionFilterChipsProps = {
  regions: string[];
  value: string;
  onChange: (next: string) => void;
};

type ChipDotProps = { color: string };

/** 칩이 목록 도트 색의 범례 역할을 겸한다 */
const ChipDot = ({ color }: ChipDotProps) => (
  <Box
    aria-hidden
    sx={{
      width: SCOPE_RANK_LIST.DOT_SIZE,
      height: SCOPE_RANK_LIST.DOT_SIZE,
      borderRadius: "50%",
      bgcolor: color,
      ml: "10px !important",
      mr: "-2px !important",
    }}
  />
);

/**
 * 지역 필터 칩.
 * 조합이 21개라 눈으로 훑는 것 말고는 특정 지역을 골라낼 방법이 없었다.
 */
const RegionFilterChips = ({
  regions,
  value,
  onChange,
}: RegionFilterChipsProps) => (
  <Box
    role="group"
    aria-label="지역 필터"
    sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}
  >
    {[ALL_REGIONS_FILTER, ...regions].map((region) => {
      const selected = region === value;
      const color = region === ALL_REGIONS_FILTER ? null : regionColor(region);

      return (
        <Chip
          key={region}
          label={region}
          size="small"
          clickable
          aria-pressed={selected}
          onClick={() => onChange(region)}
          variant={selected ? "filled" : "outlined"}
          icon={
            color ? <ChipDot color={selected ? "#fff" : color} /> : undefined
          }
          sx={{
            fontWeight: selected ? 700 : 500,
            borderColor: color ?? "divider",
            ...(selected && color
              ? {
                  bgcolor: color,
                  color: "common.white",
                  "&:hover": { bgcolor: color },
                }
              : {}),
          }}
        />
      );
    })}
  </Box>
);

export default RegionFilterChips;
