import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  Box,
  useMediaQuery,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useDataLoader } from "../hooks/useAuctionData";
import NavItems from "./Navbar/NavItems";
import DataDateBadge from "./Navbar/DataDateBadge";
import RefreshButton from "./Navbar/RefreshButton";
import MobileDrawer from "./Navbar/MobileDrawer";

const NAV_ITEMS = [
  { label: "대시보드", path: "/dashboard" },
  { label: "데이터 분석", path: "/data-analysis" },
];

const GlobalNavbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const themeMode = useSettingsStore((s) => s.themeMode);
  const toggleThemeMode = useSettingsStore((s) => s.toggleThemeMode);
  const displayMode = useSettingsStore((s) => s.displayMode);
  const toggleDisplayMode = useSettingsStore((s) => s.toggleDisplayMode);

  const { isRefreshing, latestDataDate, softRefresh } = useDataLoader();

  /**
   * 수동 새로고침. 새 데이터가 있으면 즉시 reload, 이미 최신이면
   * 스피너가 돌아갔다 돌아오는 것으로 사용자에게 충분히 피드백된다.
   */
  const handleRefresh = async () => {
    if (isRefreshing) return;
    try {
      const { updated } = await softRefresh();
      if (updated) {
        window.location.reload();
      }
    } catch (err) {
      console.error("[handleRefresh] 실패:", err);
    }
  };

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === "/dashboard" && location.pathname === "/");

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ gap: 0.5 }}>
          {isMobile && (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{ color: theme.palette.text.primary, mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 700, cursor: "pointer", mr: 1.5 }}
            onClick={() => navigate("/")}
          >
            <Box component="span" sx={{ color: theme.palette.primary.main }}>
              오
            </Box>
            <Box component="span" sx={{ color: theme.palette.text.primary }}>
              송이
            </Box>
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {!isMobile && <NavItems items={NAV_ITEMS} isActive={isActive} />}

          <DataDateBadge latestDataDate={latestDataDate} />
          <RefreshButton
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />

          {/* 큰글씨 토글 */}
          <Tooltip
            title={
              displayMode === "default"
                ? "큰글씨 모드로 전환"
                : "기본 모드로 전환"
            }
          >
            <IconButton
              onClick={toggleDisplayMode}
              sx={{
                color: theme.palette.text.primary,
                width: 40,
                height: 40,
              }}
            >
              <Typography
                sx={{
                  fontSize: displayMode === "large" ? "1.125rem" : "0.8125rem",
                  fontWeight: 700,
                  lineHeight: 1,
                  opacity: displayMode === "large" ? 1 : 0.5,
                }}
              >
                가
              </Typography>
            </IconButton>
          </Tooltip>

          {/* 다크모드 토글 */}
          <Tooltip
            title={
              themeMode === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"
            }
          >
            <IconButton
              onClick={toggleThemeMode}
              sx={{
                color: theme.palette.text.primary,
                transition: "transform 0.3s ease-in-out",
                "&:hover": {
                  transform: "rotate(180deg)",
                },
              }}
            >
              {themeMode === "light" ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navItems={NAV_ITEMS}
        isActive={isActive}
      />
    </>
  );
};

export default GlobalNavbar;
