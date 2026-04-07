import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemText,
  useTheme,
  Typography,
} from "@mui/material";
import { useSettingsStore } from "../stores/useSettingsStore";
import { AVAILABLE_REGIONS } from "../const/Common";

const RegionOnboarding = () => {
  const theme = useTheme();

  const hasCompletedOnboarding = useSettingsStore(
    (s) => s.hasCompletedOnboarding
  );
  const myRegion = useSettingsStore((s) => s.myRegion);
  const setMyRegion = useSettingsStore((s) => s.setMyRegion);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  if (hasCompletedOnboarding) return null;

  const handleSelect = (region: (typeof AVAILABLE_REGIONS)[number]) => {
    setMyRegion(region);
  };

  const handleConfirm = () => {
    if (myRegion) {
      completeOnboarding();
    }
  };

  return (
    <Dialog
      open
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "0.75rem",
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          어느 지역의 시세를 보시겠습니까?
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
        >
          설정한 지역의 시세가 대시보드에 표시됩니다. 나중에 언제든 변경할 수
          있습니다.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <List sx={{ mx: -1 }}>
          {AVAILABLE_REGIONS.map((region) => (
            <ListItemButton
              key={region}
              selected={myRegion === region}
              onClick={() => handleSelect(region)}
              sx={{
                borderRadius: "0.5rem",
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: `${theme.palette.primary.main}14`,
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemText
                primary={region}
                primaryTypographyProps={{
                  fontWeight: myRegion === region ? 600 : 400,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          disabled={!myRegion}
          onClick={handleConfirm}
          sx={{
            borderRadius: "0.5rem",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          시작하기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegionOnboarding;
