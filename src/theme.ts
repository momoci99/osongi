import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material/styles";

/**
 * 표면 계단.
 *
 * 이전 팔레트는 배경(#171412)·카드(#211E1A)·테두리(#2C2520)의 명암비가 모두 1.1대라
 * 세 층이 한 덩어리로 읽혔다. 다크 저휘도 구간에서는 WCAG 명암비가 압축돼
 * 배경끼리의 수치를 올리는 데 한계가 있으므로, 계층은 **테두리가 만든다**.
 * border/raised 명암비를 1.10 → 1.60으로 끌어올려 카드 경계를 실제로 보이게 한다.
 */
declare module "@mui/material/styles" {
  interface Palette {
    surface: {
      /** 페이지 바닥 */
      base: string;
      /** 카드·패널 */
      raised: string;
      /** 팝오버·툴팁·선택된 컨트롤 */
      overlay: string;
      /** 기본 경계선 */
      border: string;
      /** 강조 경계선. 선택 상태나 표 머리글 아래처럼 구분이 더 필요한 자리 */
      borderStrong: string;
    };
    chart: ChartPalette;
  }
  interface PaletteOptions {
    surface?: Palette["surface"];
    chart?: ChartPalette;
  }
}

type ChartPalette = {
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

/**
 * Modern Forest 색상 토큰.
 *
 * 소나무와 송이버섯에서 초록·갈색을 가져오되, 두 계열이 서로 남처럼 놀지 않도록
 * 두 가지를 지킨다.
 *
 * 1. 배경 갈색의 채도를 12% → 16~18%로 올려 갈색이 실제로 갈색으로 읽히게 한다.
 * 2. 초록을 형광 민트(H142 S71%)에서 침엽수 초록(H150 S46%)으로 낮춰
 *    갈색 배경(H26)과 같은 화면에서 튀지 않게 한다.
 *
 * accent(송이 갓 적갈색)는 지역 식별 색과 겹치지 않도록 H16에 둔다.
 * 경북이 H28을 쓰므로 accent 를 도트·막대 근처에서 쓰면 지역색으로 오독된다.
 */
const MODERN_FOREST = {
  light: {
    /**
     * 라이트에서는 카드가 바닥보다 **밝아야** 떠 보인다.
     * 이전에는 바닥(#FAFAF9)이 카드(#F7F6F4)보다 밝아 계단이 뒤집혀 있었다.
     */
    base: "#F8F7F6",
    raised: "#FFFFFF",
    overlay: "#FFFFFF",
    border: "#E6E3E0",
    borderStrong: "#D1CCC7",
    foreground: "#1D1916",
    muted: "#746B63",
    subtle: "#948C84",
    primary: "#196B42",
    primaryDim: "#278657",
    accent: "#A7401B",
    up: "#BA7308",
    down: "#087E9B",
    grade1: "#1B7447",
    grade2: "#1450D2",
    grade3Stopped: "#C47908",
    grade3Estimated: "#6E2FDA",
    gradeBelow: "#D52020",
    mixedGrade: "#A69E96",
  },
  dark: {
    base: "#110E0C",
    raised: "#211B18",
    overlay: "#302A24",
    border: "#453D35",
    borderStrong: "#5D544B",
    foreground: "#F9F8F5",
    muted: "#A6988C",
    subtle: "#7D6F64",
    primary: "#4CBD85",
    primaryDim: "#35825C",
    accent: "#D36B45",
    up: "#F7C23B",
    down: "#3ECDEA",
    grade1: "#69D39E",
    grade2: "#63A1EE",
    grade3Stopped: "#F4B434",
    grade3Estimated: "#AA86EA",
    gradeBelow: "#EF6C6C",
    mixedGrade: "#766A60",
  },
} as const;

/** 공통 타이포그래피 설정 */
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
  h1: { fontWeight: 700 },
  h2: { fontWeight: 600 },
  h3: { fontWeight: 600 },
  h4: { fontWeight: 500 },
  h5: { fontWeight: 500 },
  h6: { fontWeight: 500 },
  subtitle1: { fontWeight: 400 },
  subtitle2: { fontWeight: 500 },
  body1: { fontWeight: 400 },
  body2: { fontWeight: 400 },
  button: { fontWeight: 500, textTransform: "none" as const },
  caption: { fontWeight: 400 },
  overline: { fontWeight: 400 },
};

/** 차트 색은 팔레트 초록·파랑 계열을 그대로 잇는다 */
const chartPalette = (
  tokens: (typeof MODERN_FOREST)["light" | "dark"],
  isLight: boolean
): ChartPalette => ({
  weight: isLight
    ? { main: "#196B42", light: "#7FC9A2", dark: "#0F4A2D" }
    : { main: "#4CBD85", light: "#8FDCB7", dark: "#35825C" },
  price: isLight
    ? { main: "#1450D2", light: "#93B4F5", dark: "#0E3A9B" }
    : { main: "#63A1EE", light: "#A6C7F5", dark: "#3F79C4" },
  up: tokens.up,
  down: tokens.down,
  grade1: tokens.grade1,
  grade2: tokens.grade2,
  grade3Stopped: tokens.grade3Stopped,
  grade3Estimated: tokens.grade3Estimated,
  gradeBelow: tokens.gradeBelow,
  mixedGrade: tokens.mixedGrade,
});

/** 테마 생성 함수 */
export const createAppTheme = (mode: PaletteMode) => {
  const isLight = mode === "light";
  const tokens = isLight ? MODERN_FOREST.light : MODERN_FOREST.dark;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.primary,
        dark: tokens.primaryDim,
        /** 초록 위에 얹는 글자. 다크는 바닥색, 라이트는 흰색이 대비가 크다 */
        contrastText: isLight ? "#FFFFFF" : tokens.base,
      },
      secondary: { main: tokens.accent },
      surface: {
        base: tokens.base,
        raised: tokens.raised,
        overlay: tokens.overlay,
        border: tokens.border,
        borderStrong: tokens.borderStrong,
      },
      chart: chartPalette(tokens, isLight),
      background: {
        default: tokens.base,
        paper: tokens.raised,
      },
      text: {
        primary: tokens.foreground,
        secondary: tokens.muted,
        /** 캡션·보조 설명. secondary 에 opacity 를 겹쳐 쓰면 대비가 3 아래로 떨어졌다 */
        disabled: tokens.subtle,
      },
      divider: tokens.border,
      error: { main: tokens.gradeBelow },
      warning: { main: tokens.grade3Stopped },
      success: { main: tokens.primary },
      info: { main: tokens.grade2 },
    },
    typography: commonTypography,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { fontVariantNumeric: "tabular-nums" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          /**
           * MUI 기본 elevation 은 흰색 오버레이를 깔아 갈색 표면을 회색으로 바꾼다.
           * 오버레이를 끄고 계층은 surface 토큰과 테두리로 만든다.
           */
          root: { backgroundImage: "none" },
          outlined: ({ theme }) => ({
            borderColor: theme.palette.surface.border,
          }),
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.surface.border,
          }),
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            backgroundColor: theme.palette.surface.overlay,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.surface.border}`,
            fontSize: "0.75rem",
          }),
          arrow: ({ theme }) => ({
            color: theme.palette.surface.overlay,
          }),
        },
      },
    },
  });
};

/** 기본 light 테마 (하위 호환성을 위해) */
export const theme = createAppTheme("light");
