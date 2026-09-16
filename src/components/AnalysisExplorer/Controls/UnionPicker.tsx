import { useState } from "react";
import { Box, Button, Popover, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterChip from "./FilterChip";
import { AVAILABLE_REGIONS, REGION_UNION_MAP } from "../../../const/Common";
import { regionColor } from "../../../const/Regions";

type UnionPickerProps = {
  unions: string[];
  onChange: (unions: string[]) => void;
};

/** 선택 요약 라벨 */
const describeUnions = (unions: string[]): string =>
  unions.length === 0 ? "전체 조합" : unions.length === 1 ? unions[0] : `조합 ${unions.length}곳`;

/** 조합 다중 선택 팝오버 — 지역별로 묶어 보여준다 */
const UnionPicker = ({ unions, onChange }: UnionPickerProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const toggle = (union: string) =>
    onChange(unions.includes(union) ? unions.filter((item) => item !== union) : [...unions, union]);

  return (
    <>
      <Button
        size="small"
        color="inherit"
        endIcon={<ExpandMoreIcon fontSize="small" />}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          height: 28,
          borderRadius: "14px",
          border: "1px solid",
          borderColor: unions.length > 0 ? "surface.borderStrong" : "surface.border",
          bgcolor: unions.length > 0 ? "surface.overlay" : "transparent",
          color: unions.length > 0 ? "text.primary" : "text.secondary",
          fontWeight: unions.length > 0 ? 700 : 500,
          fontSize: "0.8125rem",
          px: 1.25,
        }}
      >
        {describeUnions(unions)}
      </Button>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 2, width: 360, maxWidth: "calc(100vw - 32px)" } } }}
      >
        {AVAILABLE_REGIONS.map((region) => (
          <Box key={region} sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: regionColor(region) }} />
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.secondary" }}>
                {region}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.625 }}>
              {REGION_UNION_MAP[region].map((union) => (
                <FilterChip key={union} selected={unions.includes(union)} onClick={() => toggle(union)}>
                  {union}
                </FilterChip>
              ))}
            </Box>
          </Box>
        ))}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 0.5 }}>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            조합을 고르면 지역 선택보다 우선합니다
          </Typography>
          <Button size="small" color="inherit" disabled={unions.length === 0} onClick={() => onChange([])}>
            선택 해제
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default UnionPicker;
