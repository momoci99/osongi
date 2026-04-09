import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material/styles";

// MUI Palette module augmentation: add custom chart colors
declare module "@mui/material/styles" {
  interface Palette {
    chart: {
      weight: { main: string; light: string; dark: string };
      price: { main: string; light: string; dark: string };
      up: string;
      down: string;
      grade1: string;
      grade2: string;
      grade3Stopped: string;
      grade3Estimated: string;
      gradeBelow: string;
      mixedGrade: string;
    };
  }
  interface PaletteOptions {
    chart?: {
      weight: { main: string; light: string; dark: string };
      price: { main: string; light: string; dark: string };
      up: string;
      down: string;
      grade1: string;
      grade2: string;
      grade3Stopped: string;
      grade3Estimated: string;
      gradeBelow: string;
      mixedGrade: string;
    };
  }
}

// Modern Forest 색상 토큰
const MODERN_FOREST = {
  light: {
    background: "#FAFAF9",
    paper: "#FFFFFF",
    border: "#E7E5E4",
    foreground: "#1C1917",
    muted: "#78716C",
    primary: "#166534",
    accent: "#B45309",
    up: "#B45309",
    down: "#0891B2",
    grade1: "#166534",
    grade2: "#2563EB",
    grade3Stopped: "#D97706",
    grade3Estimated: "#7C3AED",
    gradeBelow: "#DC2626",
    mixedGrade: "#A8A29E",
  },
  dark: {
    background: "#171412",
    paper: "#211E1A",
    border: "#2C2520",
    foreground: "#FAF9F7",
    muted: "#8C7E73",
    primary: "#22C55E",
    accent: "#FBBF24",
    up: "#FBBF24",
    down: "#22D3EE",
    grade1: "#4ADE80",
    grade2: "#60A5FA",
    grade3Stopped: "#FBBF24",
    grade3Estimated: "#A78BFA",
    gradeBelow: "#F87171",
    mixedGrade: "#6B5E54",
  },
} as const;

// 공통 타이포그래피 설정
const commonTypography = {
  fontFamily: [
    '"Pretendard"',
    '"Noto Sans KR"',
    "-apple-system",
    "BlinkMacSystemFont",
    "system-ui",
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
  ].join(","),
  h1: {
    fontWeight: 700,
  },
  h2: {
    fontWeight: 600,
  },
  h3: {
    fontWeight: 600,
  },
  h4: {
    fontWeight: 500,
  },
  h5: {
    fontWeight: 500,
  },
  h6: {
    fontWeight: 500,
  },
  subtitle1: {
    fontWeight: 400,
  },
  subtitle2: {
    fontWeight: 500,
  },
  body1: {
    fontWeight: 400,
  },
  body2: {
    fontWeight: 400,
  },
  button: {
    fontWeight: 500,
    textTransform: "none" as const,
  },
  caption: {
    fontWeight: 400,
  },
  overline: {
    fontWeight: 400,
  },
};

// 테마 생성 함수
export const createAppTheme = (mode: PaletteMode) => {
  const isLight = mode === "light";
  const tokens = isLight ? MODERN_FOREST.light : MODERN_FOREST.dark;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.primary,
      },
      secondary: {
        main: tokens.accent,
      },
      chart: {
        weight: isLight
          ? { main: "#166534", light: "#86EFAC", dark: "#14532D" }
          : { main: "#4ADE80", light: "#86EFAC", dark: "#22C55E" },
        price: isLight
          ? { main: "#2563EB", light: "#93C5FD", dark: "#1D4ED8" }
          : { main: "#60A5FA", light: "#93C5FD", dark: "#3B82F6" },
        up: tokens.up,
        down: tokens.down,
        grade1: tokens.grade1,
        grade2: tokens.grade2,
        grade3Stopped: tokens.grade3Stopped,
        grade3Estimated: tokens.grade3Estimated,
        gradeBelow: tokens.gradeBelow,
        mixedGrade: tokens.mixedGrade,
      },
      background: {
        default: tokens.background,
        paper: tokens.paper,
      },
      text: {
        primary: tokens.foreground,
        secondary: tokens.muted,
      },
      divider: tokens.border,
      error: {
        main: isLight ? "#DC2626" : "#F87171",
      },
    },
    typography: commonTypography,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontVariantNumeric: "tabular-nums",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
};


// 기본 light 테마 (하위 호환성을 위해)
export const theme = createAppTheme("light");
