import { Box, Chip } from "@mui/material";
import { ALL_REGIONS_FILTER, regionColor } from "../../const/Regions";

type RegionFilterChipsProps = {
  regions: string[];
  value: string;
  onChange: (next: string) => void;
};

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
    sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}
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
