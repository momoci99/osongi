# Phase 2-1: 연도 오버레이 모드 — 상세 구현 명세

> **연관 문서**: [`chart-enhancement-plan.md`](../planning/chart-enhancement-plan.md)
>
> 현재 연도별 서브플롯(좌→우 나열) 외에, 같은 축에 연도별 데이터를 겹쳐 표시하는 모드를 추가한다.
> "올해와 작년, 뭐가 달랐나?" — 분석 페이지 7가지 질문 중 #2에 직접 답변.

---

## 현재 코드 구조 파악

### 서브플롯 아키텍처

```
useDrawAnalysisChart useEffect:
  1. filterMushroomSeason(data)
  2. groupByYear(seasonData) → yearGroups (Map<number, data[]>)
  3. globalYScale (모든 연도 공유)
  4. years.forEach → drawSubplot()
     - 독립 xScale (해당 연도의 dateExtent)
     - subplotWidth = (전체폭 - 여백 - 갭) / 연도수
  5. drawLegend()
```

**핵심 제약**: 각 서브플롯의 X축은 해당 연도의 실제 날짜 범위. 2023년 데이터가 9/1~11/15이고 2024년이 8/20~12/10이면 X축 범위가 다름.

### 오버레이 모드에서 달라지는 점

- X축: **월-일** 기준 (연도 무시). 모든 연도를 8/1~12/31 공통 축에 표시.
- 시리즈 구분: 기존 `region-gradeKey` 대신 `year-region-gradeKey` 또는 연도별 색상.
- 서브플롯 분할 없음: 단일 차트에 모든 연도 겹침.

---

## 핵심 설계 결정

| 결정                | 선택                                       | 이유                                                   |
| ------------------- | ------------------------------------------ | ------------------------------------------------------ |
| 레이아웃 타입명     | `"subplot" \| "overlay"`                   | 기존 `ChartMode`("price"\|"quantity")와 독립적인 축    |
| 기본값              | `"subplot"` (현재 동작 유지)               | 기존 사용자 행동 보존                                  |
| X축 범위            | 고정 8/1 ~ 12/31                           | 송이버섯 시즌 전체를 커버                              |
| 색상 전략           | **연도별 색상**, 등급은 대시 패턴으로 구분 | 오버레이 목적이 "연도 비교"이므로 연도가 1차 구분 기준 |
| 시리즈 key          | `${year}-${region}-${gradeKey}`            | 같은 region-gradeKey도 연도별로 별도 시리즈            |
| 단일 등급/지역 권장 | 시리즈 > 15개 시 경고                      | 오버레이 + 다지역 + 다등급 = 가독성 파괴               |

### 색상 전략 상세

```
서브플롯 모드: 색상 = 등급, 대시 = 등급, 시리즈 = region-gradeKey
오버레이 모드: 색상 = 연도, 대시 = 등급, 시리즈 = year-region-gradeKey
```

연도별 색상 팔레트 (D3 schemeCategory10 또는 커스텀):

```typescript
const YEAR_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];
```

---

## 구현 명세

### Task 1: `ChartLayout` 타입 및 상태

#### `seriesBuilder.ts`

```typescript
export type ChartLayout = "subplot" | "overlay";
```

#### `DataAnalysisChart/index.tsx`

```typescript
const [layout, setLayout] = useState<ChartLayout>("subplot");
```

UI — 토글 버튼 (기존 가격/수량 토글 좌측에 배치):

```typescript
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";

<ToggleButtonGroup
  value={layout}
  exclusive
  onChange={(_, val) => val && setLayout(val)}
  size="small"
>
  <ToggleButton value="subplot">
    <Tooltip title="연도별 분리"><ViewColumnIcon fontSize="small" /></Tooltip>
  </ToggleButton>
  <ToggleButton value="overlay">
    <Tooltip title="연도 겹쳐보기"><CompareArrowsIcon fontSize="small" /></Tooltip>
  </ToggleButton>
</ToggleButtonGroup>
```

**단일 연도일 때**: 오버레이 토글 비활성화 (겹칠 연도가 없으므로).

---

### Task 2: `useDrawAnalysisChart` 분기

#### 파라미터 확장

```typescript
type UseDrawAnalysisChartParams = {
  // ... 기존 필드
  layout: ChartLayout;
};
```

의존 배열에 `layout` 추가.

#### useEffect 내 분기

```typescript
if (layout === "overlay") {
  drawOverlayChart({
    svg, seasonData, yearGroups, years,
    globalYScale, yValue, mode,
    margin, isMobile, fontSize, theme,
    containerWidth, subplotHeight,
    maData: filteredMAData,
    showMA, showMarkers,
    onLegendClick, hiddenSeriesRef,
  });
} else {
  // 기존 서브플롯 로직 (years.forEach → drawSubplot)
  years.forEach((year, yearIndex) => { ... });
}

// 범례는 두 모드 모두 동일하게 하단에 표시
const legendItems = layout === "overlay"
  ? collectOverlayLegendItems(yearGroups, years)
  : collectLegendItems(yearGroups, colorScale);
```

---

### Task 3: `drawOverlayChart()` 함수

```typescript
type DrawOverlayChartParams = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  seasonData: WeeklyPriceDatum[];
  yearGroups: Map<number, WeeklyPriceDatum[]>;
  years: number[];
  globalYScale: d3.ScaleLinear<number, number>;
  yValue: (d: WeeklyPriceDatum) => number;
  mode: ChartMode;
  margin: { top: number; right: number; bottom: number; left: number };
  isMobile: boolean;
  fontSize: { title: string; axis: string; legend: string; message: string };
  theme: Theme;
  containerWidth: number;
  subplotHeight: number;
  maData: MovingAverageDatum[];
  showMA: boolean;
  showMarkers: boolean;
  onLegendClick?: (seriesKey: string) => void;
  hiddenSeriesRef?: React.RefObject<Set<string>>;
};

const drawOverlayChart = ({
  svg,
  seasonData,
  yearGroups,
  years,
  globalYScale,
  yValue,
  mode,
  margin,
  isMobile,
  fontSize,
  theme,
  containerWidth,
  subplotHeight,
  ...rest
}: DrawOverlayChartParams) => {
  const plotWidth = containerWidth - margin.left - margin.right;

  // 공통 X축: 월-일 기준 (기준년 2000으로 정규화)
  const xScale = d3
    .scaleTime()
    .domain([new Date(2000, 7, 1), new Date(2000, 11, 31)]) // 8/1 ~ 12/31
    .range([0, plotWidth]);

  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // X축
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(isMobile ? 5 : 10)
    .tickFormat((d) => d3.timeFormat("%m/%d")(d as Date));

  chartGroup
    .append("g")
    .attr("transform", `translate(0, ${subplotHeight})`)
    .call(xAxis)
    .selectAll("text")
    .style("fill", theme.palette.text.primary)
    .style("font-size", fontSize.axis);

  // Y축
  const yAxis = d3
    .axisLeft(globalYScale)
    .ticks(isMobile ? 5 : 8)
    .tickFormat((d) => `${d}${mode === "price" ? "원" : "kg"}`);

  chartGroup
    .append("g")
    .call(yAxis)
    .selectAll("text")
    .style("fill", theme.palette.text.primary)
    .style("font-size", fontSize.axis);

  // 연도별 색상 스케일
  const yearColorScale = d3
    .scaleOrdinal<number, string>()
    .domain(years)
    .range(YEAR_COLORS);

  // 각 연도의 데이터를 기준년(2000)으로 정규화하여 렌더링
  years.forEach((year) => {
    const yearData = yearGroups.get(year)!;
    const normalizedData = yearData.map((d) => ({
      ...d,
      normalizedDate: normalizeToBaseYear(d.date),
    }));

    const yearSeriesList = buildOverlayYearSeries(
      normalizedData,
      year,
      yearColorScale,
    );

    yearSeriesList.forEach((series) => {
      drawOverlaySeriesLine({
        chartGroup,
        series,
        xScale,
        globalYScale,
        yValue,
        isMobile,
        theme,
      });
    });
  });
};
```

---

### Task 4: 날짜 정규화 헬퍼

```typescript
/**
 * 날짜의 월-일을 기준년(2000)으로 정규화합니다.
 * 예: "2024-09-15" → new Date(2000, 8, 15)
 */
const normalizeToBaseYear = (dateStr: string): Date => {
  const d = new Date(dateStr);
  return new Date(2000, d.getMonth(), d.getDate());
};
```

---

### Task 5: 오버레이 시리즈 빌더

#### `seriesBuilder.ts`

```typescript
export type OverlaySeries = {
  year: number;
  region: string;
  gradeKey: string;
  data: (WeeklyPriceDatum & { normalizedDate: Date })[];
  color: string;
  dashPattern: string;
  seriesKey: string;
};

/**
 * 오버레이 모드용 시리즈를 생성합니다.
 * 색상은 연도별, 대시 패턴은 등급별로 구분합니다.
 */
export const buildOverlayYearSeries = (
  normalizedData: (WeeklyPriceDatum & { normalizedDate: Date })[],
  year: number,
  yearColorScale: d3.ScaleOrdinal<number, string>,
): OverlaySeries[] => {
  const seriesMap = new Map<string, OverlaySeries>();

  normalizedData.forEach((d) => {
    if (!d.region || !d.gradeKey) return;
    const key = `${year}-${d.region}-${d.gradeKey}`;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        year,
        region: d.region,
        gradeKey: d.gradeKey,
        data: [],
        color: yearColorScale(year),
        dashPattern: getGradeDashPattern(d.gradeKey),
        seriesKey: key,
      });
    }
    seriesMap.get(key)!.data.push(d);
  });

  seriesMap.forEach((s) => {
    s.data.sort(
      (a, b) => a.normalizedDate.getTime() - b.normalizedDate.getTime(),
    );
  });

  return Array.from(seriesMap.values());
};
```

---

### Task 6: 오버레이 범례

기존 범례와 다른 형식. 연도가 1차 구분이므로:

```
● 2023년  ● 2024년  ● 2025년    ← 연도별 색상
─── 1등급  - - - 2등급  ─ · ─ 3등급   ← 등급별 대시 패턴
```

2행 범례:

- 1행: 연도 색상 범례
- 2행: 등급 대시 패턴 범례

```typescript
export const collectOverlayLegendItems = (
  yearGroups: Map<number, WeeklyPriceDatum[]>,
  years: number[],
  yearColorScale: d3.ScaleOrdinal<number, string>,
): { yearItems: YearLegendItem[]; gradeItems: GradeLegendItem[] } => {
  const yearItems = years.map((year) => ({
    year,
    color: yearColorScale(year),
  }));

  const uniqueGrades = new Set<string>();
  yearGroups.forEach((data) =>
    data.forEach((d) => uniqueGrades.add(d.gradeKey)),
  );
  const gradeItems = sortGradeKeys([...uniqueGrades]).map((gradeKey) => ({
    gradeKey,
    dashPattern: getGradeDashPattern(gradeKey),
  }));

  return { yearItems, gradeItems };
};
```

---

### Task 7: 기존 Phase 기능과의 호환

| Phase 기능      | 오버레이 모드 호환                                                      |
| --------------- | ----------------------------------------------------------------------- |
| 0-1 범례 토글   | `data-series-key`가 `year-region-gradeKey`이므로 동일 메커니즘으로 동작 |
| 0-2 과부하 경고 | `countUniqueSeries` 로직을 오버레이 key 기준으로도 계산 필요            |
| 0-3 높이 확장   | 동일하게 적용                                                           |
| 1-1 Crosshair   | 서브플롯별이 아닌 단일 차트 overlay. `addCrosshair` 파라미터 조정 필요  |
| 1-2 극값 마커   | 연도별 시리즈에서 각각 극값 표시                                        |

---

## 수정 파일 요약

| 파일                          | 변경 내용                                                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seriesBuilder.ts`            | (1) `ChartLayout` 타입 export (2) `OverlaySeries` 타입 (3) `buildOverlayYearSeries()` (4) `collectOverlayLegendItems()`                                                |
| `useDrawAnalysisChart.ts`     | (1) `layout` 파라미터 추가 (2) `drawOverlayChart()` 함수 (3) `normalizeToBaseYear()` 헬퍼 (4) useEffect 내 layout 분기 (5) `YEAR_COLORS` 상수 (6) 오버레이 범례 렌더링 |
| `DataAnalysisChart/index.tsx` | (1) `layout` 상태 (2) 레이아웃 토글 UI (3) 단일 연도 시 비활성화 (4) 훅에 전달                                                                                         |

---

## 엣지 케이스

| 케이스                      | 동작                                                                         |
| --------------------------- | ---------------------------------------------------------------------------- |
| 단일 연도 선택              | 오버레이 토글 비활성화 (disabled)                                            |
| 5년 이상 + 다지역 + 다등급  | 시리즈 폭발. 과부하 경고(0-2)가 표시됨                                       |
| 연도별 데이터 기간이 다름   | 정규화된 X축(8/1~12/31)에서 데이터 없는 구간은 라인이 끊김                   |
| 연도 10개 초과              | `YEAR_COLORS` 배열 길이 10. 11번째부터 첫 색상 반복 (scaleOrdinal 기본 동작) |
| 모드 전환 (subplot↔overlay) | 전체 재그리기. `hiddenSeriesRef` 키 형식이 바뀌므로 리셋 필요                |

---

## 테스트 계획

### 통합 테스트 (수동)

| #   | 시나리오                      | 확인 사항                                  |
| --- | ----------------------------- | ------------------------------------------ |
| 1   | subplot → overlay 토글        | 서브플롯이 단일 차트로 전환, X축 8/1~12/31 |
| 2   | overlay에서 2023 vs 2024 비교 | 연도별 색상 구분, 같은 월-일 위치에 겹침   |
| 3   | overlay 범례                  | 1행: 연도 색상, 2행: 등급 대시 패턴        |
| 4   | overlay + 범례 토글           | 특정 연도-지역-등급 숨김                   |
| 5   | 단일 연도 선택 시             | 오버레이 토글 disabled                     |
| 6   | overlay → subplot 복귀        | 원래 서브플롯 구조로 복원                  |
| 7   | overlay + Crosshair           | 단일 차트에서 수직선 + 다중 연도 값 표시   |
| 8   | 다크모드에서 연도 색상        | 가독성 확인                                |
| 9   | 모바일에서 오버레이           | 토글 UI 접근성, 차트 가독성                |

---

## 의존성

- Phase 0-1(범례 토글)의 `data-series-key` 인프라 활용
- Phase 1-1(Crosshair)은 오버레이 모드에서 단일 차트 기반으로 동작해야 함 → Crosshair 로직에 layout 분기 필요
- 외부 패키지 추가: 없음

## 리스크

| 리스크                                | 심각도 | 대응                                                                  |
| ------------------------------------- | ------ | --------------------------------------------------------------------- |
| `useDrawAnalysisChart.ts` 코드량 급증 | 중간   | `drawOverlayChart`를 별도 파일로 분리 고려 (`useDrawOverlayChart.ts`) |
| 서브플롯/오버레이 공유 로직 중복      | 중간   | 공통 부분(축 렌더링, 시리즈 라인 그리기)을 헬퍼로 추출                |
| 연도 10개 이상 시 색상 반복           | 낮음   | 실제 데이터가 2013~2025 (13년). 색상 팔레트 확장 또는 연도 선택 제한  |
