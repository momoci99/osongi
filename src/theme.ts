import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material/styles";

// 공통 타이포그래피 설정
const commonTypography = {
  fontFamily: [
    '"Noto Sans KR"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
  ].join(","),
  // 각 타이포그래피 variant별로 폰트 설정 가능
  h1: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 700,
  },
  h2: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 600,
  },
  h3: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 600,
  },
  h4: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 500,
  },
  h5: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 500,
  },
  h6: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 500,
  },
  subtitle1: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 400,
  },
  subtitle2: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 500,
  },
  body1: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 400,
  },
  body2: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 400,
  },
  button: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 500,
    textTransform: "none" as const, // 버튼 텍스트 대문자 변환 비활성화
  },
  caption: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 400,
  },
  overline: {
    fontFamily: '"Noto Sans KR", Roboto, Arial, sans-serif',
    fontWeight: 400,
  },
};

// 테마 생성 함수
export const createAppTheme = (mode: PaletteMode) => {
  const isLight = mode === "light";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isLight ? "#1976d2" : "#90caf9",
        light: isLight ? "#42a5f5" : "#bbdefb",
        dark: isLight ? "#1565c0" : "#5e92f3",
      },
      secondary: {
        main: isLight ? "#dc004e" : "#f48fb1",
        light: isLight ? "#e91e63" : "#f8bbd9",
        dark: isLight ? "#c51162" : "#ad1457",
      },
      background: {
        default: isLight ? "#ffffff" : "#121212",
        paper: isLight ? "#ffffff" : "#1e1e1e",
      },
      text: {
        primary: isLight ? "rgba(0, 0, 0, 0.87)" : "rgba(255, 255, 255, 0.87)",
        secondary: isLight ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.6)",
      },
    },
    typography: commonTypography,
    components: {
      // 컴포넌트별 커스텀 스타일
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 500,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none", // Material-UI 기본 그라디언트 제거
          },
        },
      },
    },
  });
};

// 기본 light 테마 (하위 호환성을 위해)
export const theme = createAppTheme("light");
