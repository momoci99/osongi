import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router";

type NavItem = { label: string; path: string };

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  isActive: (path: string) => boolean;
};

const MobileDrawer = ({
  open,
  onClose,
  navItems,
  isActive,
}: MobileDrawerProps) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 240,
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      <Box sx={{ pt: 2, px: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          <Box component="span" sx={{ color: theme.palette.primary.main }}>
            오
          </Box>
          송이
        </Typography>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={isActive(item.path)}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
            sx={{
              mx: 1,
              borderRadius: "0.5rem",
              "&.Mui-selected": {
                bgcolor: `${theme.palette.primary.main}14`,
              },
            }}
          >
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: isActive(item.path) ? 600 : 400,
                fontSize: "0.9375rem",
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};

export default MobileDrawer;
