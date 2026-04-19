import {
  Box,
  Drawer,
  SwipeableDrawer,
  Typography,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FilterControls from "./FilterControls";
import PresetChips from "./Filters/PresetChips";
import type { AnalysisFilters } from "../../utils/analysisUtils";
import { FILTER_DRAWER } from "../../const/Numbers";

type FilterDrawerProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  onResetFilters: () => void;
  open: boolean;
  onClose: () => void;
};

/** 하단 시트 상단의 드래그 핸들 */
const Puller = () => (
  <Box
    sx={{
      width: 36,
      height: 4,
      borderRadius: 2,
      bgcolor: "action.disabled",
      mx: "auto",
      mt: 1,
      mb: 0.5,
    }}
  />
);

/**
 * 필터 Drawer.
 * - Desktop(md↑): 우측 persistent Drawer (300px)
 * - Mobile(md↓): 하단 SwipeableDrawer (전체 너비, 최대 85vh)
 */
const FilterDrawer = ({
  filters,
  onFiltersChange,
  onResetFilters,
  open,
  onClose,
}: FilterDrawerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const header = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        필터
      </Typography>
      <IconButton size="small" onClick={onClose} aria-label="필터 닫기">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  const content = (
    <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 2 }}>
      <PresetChips filters={filters} onApply={onFiltersChange} />
      <Box
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          my: 1.5,
        }}
      />
      <FilterControls
        filters={filters}
        onFiltersChange={onFiltersChange}
        layout="vertical"
      />
    </Box>
  );

  const footer = (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Button
        variant="outlined"
        size="small"
        fullWidth
        onClick={onResetFilters}
      >
        초기화
      </Button>
    </Box>
  );

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            maxHeight: "85vh",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            bgcolor: theme.palette.background.paper,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Puller />
        {header}
        {content}
        {footer}
      </SwipeableDrawer>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      PaperProps={{
        sx: {
          width: FILTER_DRAWER.WIDTH,
          bgcolor: theme.palette.background.paper,
          borderLeft: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {header}
      {content}
      {footer}
    </Drawer>
  );
};

export default FilterDrawer;
