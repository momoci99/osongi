import { useTheme } from "@mui/material/styles";
import { useThemeMode } from "../contexts/ThemeContext";

// 테마 관련 유틸리티 훅
export const useAppTheme = () => {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();

  return {
    theme,
    mode,
    toggleTheme,
    isDark: mode === "dark",
    isLight: mode === "light",
  };
};

// 테마별 값을 반환하는 훅
export const useThemeValue = <T>(lightValue: T, darkValue: T): T => {
  const { isDark } = useAppTheme();
  return isDark ? darkValue : lightValue;
};

// 시스템 테마 감지 훅 (선택사항)
export const useSystemTheme = () => {
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};
