import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { PaletteMode } from "@mui/material";

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeProviderProps> = ({
  children,
}) => {
  // 로컬 스토리지에서 저장된 테마 모드를 가져오거나 기본값으로 'light' 사용
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem("theme-mode");
    return (savedMode as PaletteMode) || "light";
  });

  // 테마 전환 함수
  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
  };

  // 테마 모드 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  const value = {
    mode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// 커스텀 훅
export const useThemeMode = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeContextProvider");
  }
  return context;
};
