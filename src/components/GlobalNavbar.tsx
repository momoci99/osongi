import { useState } from "react";
import {
  AppBar,
  Button,
  Toolbar,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Menu as MenuIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useDataLoader } from "../hooks/useAuctionData";

const NAV_ITEMS = [
  { label: "대시보드", path: "/dashboard" },
  { label: "데이터 분석", path: "/data-analysis" },
];

/** "2026-04-14" → "04/14" 형태로 짧게 표기 */
const formatLatestDataDate = (iso: string | undefined): string | null => {
  if (!iso) return null;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${match[2]}/${match[3]}`;
};

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

  const latestDataLabel = formatLatestDataDate(latestDataDate);

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
          {/* 모바일 햄버거 */}
          {isMobile && (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{ color: theme.palette.text.primary, mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* 로고 */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              cursor: "pointer",
              mr: 1.5,
            }}
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

          {/* 데스크톱 네비게이션 */}
          {!isMobile &&
            NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: isActive(item.path)
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                  fontWeight: isActive(item.path) ? 600 : 400,
                  fontSize: "0.875rem",
                  position: "relative",
                  "&::after": isActive(item.path)
                    ? {
                        content: '""',
                        position: "absolute",
                        bottom: 4,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 16,
                        height: 2,
                        borderRadius: 1,
                        bgcolor: theme.palette.primary.main,
                      }
                    : undefined,
                }}
              >
                {item.label}
              </Button>
            ))}

          {/* 데이터 기준일 */}
          {latestDataLabel && (
            <Tooltip
              title={
                latestDataDate
                  ? `데이터 기준일: ${latestDataDate}`
                  : "데이터 기준일"
              }
            >
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  alignItems: "center",
                  gap: 0.5,
                  mr: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: "0.375rem",
                  border: `1px solid ${theme.palette.divider}`,
                  color: theme.palette.text.secondary,
                  fontSize: "0.75rem",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: theme.palette.primary.main,
                  }}
                />
                기준 {latestDataLabel}
              </Box>
            </Tooltip>
          )}

          {/* 수동 새로고침 */}
          <Tooltip
            title={isRefreshing ? "데이터 갱신 중..." : "데이터 새로고침"}
          >
            <span>
              <IconButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label={
                  isRefreshing ? "데이터 갱신 중" : "데이터 새로고침"
                }
                sx={{
                  color: theme.palette.text.primary,
                  width: 40,
                  height: 40,
                }}
              >
                {isRefreshing ? (
                  <CircularProgress size={18} thickness={5} />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>

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
              themeMode === "light"
                ? "다크 모드로 전환"
                : "라이트 모드로 전환"
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

      {/* 모바일 드로어 */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 240,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <Box sx={{ pt: 2, px: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            <Box component="span" sx={{ color: theme.palette.primary.main }}>오</Box>송이
          </Typography>
        </Box>
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              selected={isActive(item.path)}
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
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
    </>
  );
};

export default GlobalNavbar;
