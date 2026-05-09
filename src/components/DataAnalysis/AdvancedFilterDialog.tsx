import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Box,
  Button,
  Divider,
  Typography,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RegionSelect from "./Filters/RegionSelect";
import UnionSelect from "./Filters/UnionSelect";
import ComparisonToggle from "./Filters/ComparisonToggle";
import { REGION_UNION_MAP } from "../../const/Common";
import type { AnalysisFilters } from "../../utils/analysisUtils";

type AdvancedFilterDialogProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  onResetFilters: () => void;
  open: boolean;
  onClose: () => void;
};

/** 고급 필터 모달. 지역·조합·비교 모드를 모아서 노출. */
const AdvancedFilterDialog = ({
  filters,
  onFiltersChange,
  onResetFilters,
  open,
  onClose,
}: AdvancedFilterDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [removedUnionsCount, setRemovedUnionsCount] = useState(0);
  const [toastOpen, setToastOpen] = useState(false);

  const handleFiltersWithToast = (next: AnalysisFilters) => {
    const removed = filters.unions.length - next.unions.length;
    if (removed > 0) {
      setRemovedUnionsCount(removed);
      setToastOpen(true);
    }
    onFiltersChange(next);
  };

  const availableUnions = useMemo(() => {
    if (filters.regions.length === 0) {
      return Object.values(REGION_UNION_MAP).flat().sort();
    }
    const unions = new Set<string>();
    filters.regions.forEach((region) => {
      const regionUnions =
        REGION_UNION_MAP[region as keyof typeof REGION_UNION_MAP] || [];
      regionUnions.forEach((u) => unions.add(u));
    });
    return Array.from(unions).sort();
  }, [filters.regions]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        TransitionProps={{ timeout: 220 }}
        aria-labelledby="advanced-filter-dialog-title"
      >
        <DialogTitle
          id="advanced-filter-dialog-title"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1.5,
            py: 1.5,
          }}
        >
          <Typography component="span" variant="subtitle1" fontWeight={600}>
            고급 필터
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="고급 필터 닫기"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Stack spacing={2}>
            <RegionSelect
              filters={filters}
              onFiltersChange={handleFiltersWithToast}
            />
            <UnionSelect
              filters={filters}
              onFiltersChange={onFiltersChange}
              availableUnions={availableUnions}
            />
            <Divider />
            <Box>
              <ComparisonToggle
                filters={filters}
                onFiltersChange={onFiltersChange}
                dateDirection="row"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
          <Button
            variant="text"
            color="inherit"
            size="small"
            onClick={onResetFilters}
          >
            초기화
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" size="small" onClick={onClose}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={() => setToastOpen(false)}
        >
          선택 불가 조합 {removedUnionsCount}개가 해제되었습니다.
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdvancedFilterDialog;
