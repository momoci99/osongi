import {
  AppBar,
  Button,
  Toolbar,
  Typography,
  useTheme,
  type PaletteMode,
} from "@mui/material";
import { useNavigate } from "react-router";
import ThemeToggleButton from "./ThemeToggleButton";

const GlobalNavbar = ({ mode, toggleTheme }: GlobalNavbarProps) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          오송이
        </Typography>
        <Button
          sx={{
            color: theme.palette.text.primary,
          }}
          onClick={() => handleNavigation("/dashboard")}
        >
          대시보드
        </Button>
        <Button
          sx={{
            color: theme.palette.text.primary,
          }}
          onClick={() => handleNavigation("/data-analysis")}
        >
          데이터 분석
        </Button>
        {/* <Button
          sx={{
            color: theme.palette.text.primary,
          }}
          onClick={() => handleNavigation("/raw-data")}
        >
          다운로드
        </Button>
        <Button
          sx={{
            color: theme.palette.text.primary,
          }}
          onClick={() => handleNavigation("/help")}
        >
          도움말
        </Button> */}
        <ThemeToggleButton mode={mode} toggleTheme={toggleTheme} />
      </Toolbar>
    </AppBar>
  );
};

type GlobalNavbarProps = {
  mode: PaletteMode;
  toggleTheme: () => void;
};

export default GlobalNavbar;
