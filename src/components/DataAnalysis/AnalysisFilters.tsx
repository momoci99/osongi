import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Collapse,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { AnalysisFilters } from "../../utils/analysisUtils";
import SectionCard from "../common/SectionCard";
import ActiveFilterSummary from "./Filters/ActiveFilterSummary";
import FilterControls from "./FilterControls";

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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <SectionCard sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            필터
          </Typography>
          {isMobile && (
            <Button
              size="small"
              variant="text"
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              }
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? "접기" : "열기"}
            </Button>
          )}
        </Box>
        <Button variant="outlined" size="small" onClick={onResetFilters}>
          초기화
        </Button>
      </Box>

      <ActiveFilterSummary
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <Collapse
        in={!isMobile || filtersOpen}
        timeout="auto"
        unmountOnExit={isMobile}
      >
        <FilterControls
          filters={filters}
          onFiltersChange={onFiltersChange}
          layout="horizontal"
        />
      </Collapse>
    </SectionCard>
  );
}
