import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import type { PaletteMode } from "@mui/material/styles";

interface ThemeToggleButtonProps {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  mode,
  toggleTheme,
}) => {
  return (
    <Tooltip
      title={mode === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
    >
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        sx={{
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "rotate(180deg)",
          },
        }}
      >
        {mode === "light" ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;
