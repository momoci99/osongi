# Phase A: 큰글씨 모드 CSS 완성

## 목적
대시보드와 데이터 분석 화면에서 `displayMode === "large"`일 때 MUI 타이포그래피와 D3 차트 축·범례 폰트가 함께 커지도록 마무리한다.

## 예상 소요 시간
4~6시간

## 완료 기준
- 큰글씨 모드 토글 후 KPI 숫자 영역이 기본 모드 대비 즉시 커지고, `DashboardKpiCard`의 핵심 값이 `h3` 스케일로 렌더링된다.
- `src/App.css`에 `MuiTypography-h3`와 `.kpi-value`에 대한 큰글씨 규칙이 존재한다.
- D3 기반 차트 5곳에서 축 또는 범례 폰트가 `displayMode === "large"`일 때 기본 모드보다 최소 2px 이상 커진다.
- `FONT_SIZES` 상수에 기본 모드와 큰글씨 모드를 함께 표현하는 구조가 생기고, 차트 훅에서 하드코딩된 `"10px"`, `"12px"` 문자열이 제거된다.
- 큰글씨 모드 토글 시 새로고침 없이 CSS와 SVG 텍스트 크기가 동시에 반영된다.

## 변경 파일 목록
- `src/components/Dashboard/DashboardKpiCard.tsx`
- `src/App.css`
- `src/utils/d3/chartMargins.ts`
- `src/const/Numbers.ts`
- `src/components/Dashboard/DashboardChartWeeklyToggle/useDrawWeeklyToggle.ts`
- `src/components/Dashboard/DashboardChartGradePerKg/useDrawGradeBarKg.ts`
- `src/components/Dashboard/DashboardChartGradePerPrice/useDrawGradeBarPrice.ts`
- `src/components/DataAnalysis/ScatterPlotChart.tsx`
- `src/components/DataAnalysis/GradeBreakdownChart.tsx`

## 구현 세부사항

### 1. KPI 값 타이포그래피를 `h3` 기준으로 정렬
2026-04-18 기준 `src/components/Dashboard/DashboardKpiCard.tsx`는 실제로 `variant="h4"`를 사용하고 있다. 따라서 `App.css`에 `MuiTypography-h3` 규칙만 추가하면 KPI에는 적용되지 않는다. Phase A에서는 먼저 KPI 값 렌더링을 `h3`로 맞추고 `className="kpi-value"`를 함께 부여한다.

```tsx
<Typography
  variant="h3"
  className="kpi-value"
  sx={{
    fontWeight: 700,
    fontSize: "1.75rem",
    lineHeight: 1.2,
  }}
>
  {content}
</Typography>
```

### 2. `App.css` 큰글씨 모드 오버라이드 보강
`App.tsx`가 이미 `html[data-display]`를 동기화하므로 CSS 쪽은 변수와 선택자만 보강하면 된다. 축/범례용 변수는 D3 쪽 기준값과 동일한 이름으로 맞춰두면 디버깅이 쉽다.

```css
:root {
  --font-axis: 10px;
  --font-legend: 12px;
}

html[data-display="large"] {
  font-size: 17px;
  --font-axis: 12px;
  --font-legend: 14px;
}

html[data-display="large"] .MuiTypography-h3,
html[data-display="large"] .kpi-value {
  font-size: 2.25rem !important;
  line-height: 1.15 !important;
}

html[data-display="large"] .MuiTypography-h4,
html[data-display="large"] .MuiTypography-h5 {
  font-size: 2.5rem !important;
}

html[data-display="large"] .MuiTypography-body1 {
  font-size: 1.0625rem !important;
}

html[data-display="large"] .MuiTypography-body2 {
  font-size: 1rem !important;
}

html[data-display="large"] .MuiTypography-caption {
  font-size: 0.9375rem !important;
}
```

### 3. `src/utils/d3/chartMargins.ts`에 큰글씨 모드 헬퍼 추가
모든 D3 훅에서 `document.documentElement.dataset.display`를 반복해서 읽지 않도록 공용 헬퍼를 추가한다.

```ts
export type ChartMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/**
 * 현재 차트 너비가 모바일 기준인지 판단합니다.
 */
export const isMobileWidth = (width: number): boolean => width < 600;

/**
 * 현재 문서가 큰글씨 모드인지 판단합니다.
 */
export const isLargeDisplay = (): boolean =>
  typeof document !== "undefined" &&
  document.documentElement.dataset.display === "large";

/**
 * 현재 너비에 따라 모바일 또는 데스크톱 마진을 선택합니다.
 */
export const selectMargin = (
  width: number,
  mobile: ChartMargin,
  desktop: ChartMargin,
): ChartMargin => (isMobileWidth(width) ? mobile : desktop);
```

### 4. `src/const/Numbers.ts`의 `FONT_SIZES` 확장
기존 `FONT_SIZES.MOBILE` / `FONT_SIZES.DESKTOP` 구조는 유지하고, 큰글씨 전용 묶음을 추가해 현재 사용처의 수정 범위를 최소화한다.

```ts
export const FONT_SIZES = {
  MOBILE: {
    TITLE: "12px",
    AXIS: "8px",
    LEGEND: "10px",
    MESSAGE: "14px",
  },
  DESKTOP: {
    TITLE: "14px",
    AXIS: "10px",
    LEGEND: "12px",
    MESSAGE: "16px",
  },
  LARGE: {
    MOBILE: {
      TITLE: "14px",
      AXIS: "10px",
      LEGEND: "12px",
      MESSAGE: "16px",
    },
    DESKTOP: {
      TITLE: "16px",
      AXIS: "12px",
      LEGEND: "14px",
      MESSAGE: "18px",
    },
  },
} as const;
```

공통 선택 패턴은 아래처럼 맞춘다.

```ts
const fontSize = isLargeDisplay()
  ? isMobile
    ? FONT_SIZES.LARGE.MOBILE
    : FONT_SIZES.LARGE.DESKTOP
  : isMobile
    ? FONT_SIZES.MOBILE
    : FONT_SIZES.DESKTOP;
```

### 5. 적용 대상 차트 5개와 폰트 적용 패턴

| 경로 | 적용 포인트 | 적용 패턴 |
| --- | --- | --- |
| `src/components/Dashboard/DashboardChartWeeklyToggle/useDrawWeeklyToggle.ts` | X축, Y축, Y라벨, 범례 | `axisFontSize`, `"12px"`, `"14px"`를 `fontSize.AXIS`, `fontSize.TITLE`, `fontSize.LEGEND`로 치환 |
| `src/components/Dashboard/DashboardChartGradePerKg/useDrawGradeBarKg.ts` | X축, Y축, Y라벨, 막대 값 라벨 | `drawXAxis`, `drawYAxis`, `drawBars`에 `fontSize` 객체를 인자로 전달 |
| `src/components/Dashboard/DashboardChartGradePerPrice/useDrawGradeBarPrice.ts` | X축, Y축, 막대 값 라벨 | `useDrawGradeBarKg`와 동일한 인터페이스로 맞춰 한 번에 패턴 통일 |
| `src/components/DataAnalysis/ScatterPlotChart.tsx` | X축, Y축, 축 라벨 | `axisFontSize`, `labelSize`를 `fontSize.AXIS`, `fontSize.TITLE`로 정리 |
| `src/components/DataAnalysis/GradeBreakdownChart.tsx` | 중앙 합계, 범례 이름, 범례 퍼센트 | `"0.8rem"`, `"1rem"`을 `fontSize.LEGEND`, `fontSize.TITLE` 기준으로 치환 |

차트 훅 내부의 실제 치환 패턴은 아래처럼 통일한다.

```ts
import { FONT_SIZES } from "../../../const/Numbers";
import {
  isLargeDisplay,
  isMobileWidth,
} from "../../../utils/d3/chartMargins";

const isMobile = isMobileWidth(containerWidth);
const fontSize = isLargeDisplay()
  ? isMobile
    ? FONT_SIZES.LARGE.MOBILE
    : FONT_SIZES.LARGE.DESKTOP
  : isMobile
    ? FONT_SIZES.MOBILE
    : FONT_SIZES.DESKTOP;

mainGroup
  .append("g")
  .call(yAxis)
  .selectAll("text")
  .style("font-size", fontSize.AXIS);

legendItem
  .append("text")
  .style("font-size", fontSize.LEGEND);
```

`src/components/DataAnalysis/DataAnalysisChart/useDrawAnalysisChart.ts`는 이미 `FONT_SIZES`를 사용하고 있으므로, 같은 Phase에서 `FONT_SIZES.LARGE` 분기만 추가하면 자동으로 큰글씨 모드를 흡수할 수 있다.

## 검증 절차
1. 앱 실행 후 네비게이션 또는 설정 패널에서 큰글씨 모드를 켠다.
2. 대시보드 KPI 카드 값 DOM을 확인해 `MuiTypography-h3 kpi-value`가 렌더링되는지 확인한다.
3. `window.getComputedStyle(document.documentElement).getPropertyValue("--font-axis")` 값이 큰글씨 모드에서 `12px`인지 확인한다.
4. 대시보드의 `주간 등급별 변동`, `등급별 수량`, `등급별 가격` 차트에서 축 글자가 기본 모드보다 커졌는지 비교한다.
5. 데이터 분석의 산점도와 등급별 비중 차트에서 범례 또는 축 폰트가 함께 커졌는지 확인한다.
6. 큰글씨 모드를 끄고 다시 켜도 새로고침 없이 SVG 텍스트 크기가 즉시 바뀌는지 확인한다.
