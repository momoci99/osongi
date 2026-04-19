# Phase 1-2: 최고가/최저가 자동 마커 — 상세 구현 명세

> **연관 문서**: [`chart-enhancement-plan.md`](../planning/chart-enhancement-plan.md)
>
> 각 시리즈의 시즌 내 최고/최저 포인트에 ▲/▼ 마커 + 값 라벨을 자동 표시한다.
> "올해 최고가가 언제, 얼마였나?" — 보고서 단골 질문에 차트 위에서 즉답.

---

## 현재 코드 구조 파악

### 시리즈 렌더링 흐름

```
drawSubplot()
  ├─ buildYearSeries(yearData, colorScale) → seriesList
  ├─ seriesList.forEach → drawSeriesLineAndPoints()
  │   ├─ path (라인)
  │   └─ circles (데이터 포인트)
  └─ drawMAOverlay() (optional)
```

- 각 `AnalysisSeries`는 `data: WeeklyPriceDatum[]`를 가짐 (날짜순 정렬)
- `yValue(d)` 접근자로 가격 또는 수량 반환

### 현재 극값 표시

- `AnalysisKPI` 컴포넌트에서 `maxPrice`, `minPrice`를 숫자+날짜로 표시
- **차트 위에서의 시각적 위치 표시는 없음** — 숫자와 시각의 연결 부재

---

## 구현 명세

### 핵심 설계 결정

| 결정             | 선택                                    | 이유                                             |
| ---------------- | --------------------------------------- | ------------------------------------------------ |
| 마커 표시 단위   | **시리즈별** (region-gradeKey)          | 시리즈마다 독립적인 최고/최저가 존재             |
| 마커 형태        | ▲ (최고), ▼ (최저) + 값 라벨            | 직관적 상하 방향, 국제 금융 차트 관례            |
| 표시 조건        | 시리즈 데이터가 2개 이상일 때만         | 1개면 최고=최저이므로 무의미                     |
| 시리즈 수 임계치 | 시리즈 > 10개일 때 마커 OFF (토글 가능) | 126개 시리즈 × 2 마커 = 252개 마커는 가독성 파괴 |
| 라벨 충돌        | 간단한 Y 오프셋으로 처리                | 완벽한 label placement는 과잉                    |

---

### Task 1: 마커 ON/OFF 토글 상태

#### `DataAnalysisChart/index.tsx`

```typescript
const [showMarkers, setShowMarkers] = useState(true);
```

시리즈 수가 많으면 기본 OFF:

```typescript
useEffect(() => {
  const seriesCount = new Set(data.map((d) => `${d.region}-${d.gradeKey}`))
    .size;
  setShowMarkers(seriesCount <= 10);
}, [data]);
```

UI 토글 (기존 MA 토글 옆에 추가):

```typescript
<Tooltip title={showMarkers ? "극값 마커 숨기기" : "극값 마커 표시"}>
  <IconButton
    size="small"
    onClick={() => setShowMarkers((prev) => !prev)}
    sx={{
      color: showMarkers ? theme.palette.primary.main : theme.palette.text.disabled,
      border: `1px solid ${showMarkers ? theme.palette.primary.main : theme.palette.divider}`,
      borderRadius: 1,
    }}
  >
    <HeightIcon fontSize="small" />
  </IconButton>
</Tooltip>
```

`HeightIcon` (↕): `@mui/icons-material`에서 최고/최저 범위를 연상.

---

### Task 2: `useDrawAnalysisChart` 파라미터 확장

```typescript
type UseDrawAnalysisChartParams = {
  // ... 기존 필드
  showMarkers: boolean;
};
```

의존 배열에 `showMarkers` 추가:

```typescript
[
  data,
  height,
  mode,
  theme,
  containerWidth,
  containerHeight,
  maData,
  showMA,
  showMarkers,
];
```

`showMarkers`는 토글 빈도가 낮으므로 전체 재그리기 허용.

---

### Task 3: `drawExtremeMarkers()` 함수

#### `useDrawAnalysisChart.ts`

```typescript
type DrawExtremeMarkersParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  seriesList: AnalysisSeries[];
  xScale: d3.ScaleTime<number, number>;
  globalYScale: d3.ScaleLinear<number, number>;
  yValue: (d: WeeklyPriceDatum) => number;
  mode: ChartMode;
  isMobile: boolean;
  theme: Theme;
};

/**
 * 각 시리즈의 최고/최저 포인트에 마커를 표시합니다.
 */
const drawExtremeMarkers = ({
  subplotGroup,
  seriesList,
  xScale,
  globalYScale,
  yValue,
  mode,
  isMobile,
  theme,
}: DrawExtremeMarkersParams) => {
  const markerFontSize = isMobile ? "8px" : "10px";
  const markerOffset = isMobile ? 10 : 14;

  seriesList.forEach((series) => {
    if (series.data.length < 2) return;
    const seriesKey = `${series.region}-${series.gradeKey}`;

    let maxPoint = series.data[0];
    let minPoint = series.data[0];

    series.data.forEach((d) => {
      if (yValue(d) > yValue(maxPoint)) maxPoint = d;
      if (yValue(d) < yValue(minPoint)) minPoint = d;
    });

    // 최고점이 최저점과 같은 값이면 표시 안 함
    if (yValue(maxPoint) === yValue(minPoint)) return;

    // ▲ 최고가 마커
    drawSingleMarker({
      subplotGroup,
      point: maxPoint,
      type: "max",
      seriesKey,
      color: series.color,
      xScale,
      globalYScale,
      yValue,
      mode,
      markerFontSize,
      markerOffset,
      theme,
    });

    // ▼ 최저가 마커
    drawSingleMarker({
      subplotGroup,
      point: minPoint,
      type: "min",
      seriesKey,
      color: series.color,
      xScale,
      globalYScale,
      yValue,
      mode,
      markerFontSize,
      markerOffset,
      theme,
    });
  });
};
```

---

### Task 4: 개별 마커 렌더링

```typescript
type DrawSingleMarkerParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  point: WeeklyPriceDatum;
  type: "max" | "min";
  seriesKey: string;
  color: string;
  xScale: d3.ScaleTime<number, number>;
  globalYScale: d3.ScaleLinear<number, number>;
  yValue: (d: WeeklyPriceDatum) => number;
  mode: ChartMode;
  markerFontSize: string;
  markerOffset: number;
  theme: Theme;
};

const drawSingleMarker = ({
  subplotGroup,
  point,
  type,
  seriesKey,
  color,
  xScale,
  globalYScale,
  yValue,
  mode,
  markerFontSize,
  markerOffset,
  theme,
}: DrawSingleMarkerParams) => {
  const cx = xScale(new Date(point.date));
  const cy = globalYScale(yValue(point));
  const isMax = type === "max";

  // 마커 기호 (▲ 또는 ▼)
  const symbol = isMax ? "▲" : "▼";
  const yOffset = isMax ? -markerOffset : markerOffset;

  const markerGroup = subplotGroup
    .append("g")
    .attr("data-series-key", seriesKey)
    .attr("class", "extreme-marker");

  // 마커 기호
  markerGroup
    .append("text")
    .attr("x", cx)
    .attr("y", cy + yOffset)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", isMax ? "auto" : "hanging")
    .style("font-size", markerFontSize)
    .style("fill", color)
    .text(symbol);

  // 값 라벨
  const value = yValue(point);
  const unit = mode === "price" ? "원" : "kg";
  const label =
    value >= 10000
      ? `${(value / 10000).toFixed(1)}만${unit}`
      : `${value.toLocaleString()}${unit}`;

  markerGroup
    .append("text")
    .attr("x", cx)
    .attr("y", cy + yOffset + (isMax ? -10 : 10))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", isMax ? "auto" : "hanging")
    .style("font-size", markerFontSize)
    .style("fill", theme.palette.text.primary)
    .style("font-weight", "600")
    .text(label);
};
```

**라벨 포맷 규칙:**

- 10,000 이상: `1.5만원` (축약)
- 10,000 미만: `8,500원` (전체)
- 수량 모드: 동일 패턴, 단위만 `kg`

---

### Task 5: `drawSubplot()`에서 호출

```typescript
// 기존: seriesList, drawSeriesLineAndPoints, drawMAOverlay
// 신규: addCrosshair (Phase 1-1)

// 마커는 Crosshair overlay 전에 추가 (overlay가 최상위여야 하므로)
if (showMarkers) {
  drawExtremeMarkers({
    subplotGroup,
    seriesList,
    xScale,
    globalYScale,
    yValue,
    mode,
    isMobile,
    theme,
  });
}

// addCrosshair() — 반드시 맨 마지막
```

---

### Task 6: Phase 0-1(범례 토글)과 연동

마커에도 `data-series-key` 어트리뷰트를 부여하므로, 범례 토글 시 자동으로 opacity가 변경된다.

Task 4에서 이미 `data-series-key` 적용:

```typescript
const markerGroup = subplotGroup
  .append("g")
  .attr("data-series-key", seriesKey) // ← 범례 토글 연동
  .attr("class", "extreme-marker");
```

Phase 0-1의 `toggleSeries()`에서 `d3.selectAll([data-series-key="..."])` 으로 일괄 처리.

---

## 수정 파일 요약

| 파일                          | 변경 내용                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDrawAnalysisChart.ts`     | (1) `showMarkers` 파라미터 추가 (2) `drawExtremeMarkers()` 함수 (3) `drawSingleMarker()` 함수 (4) `drawSubplot()`에서 호출 (5) 의존 배열에 추가 |
| `DataAnalysisChart/index.tsx` | (1) `showMarkers` 상태 (2) 시리즈 수 기반 기본값 (3) 토글 IconButton (4) 훅에 전달                                                              |

---

## 엣지 케이스

| 케이스                       | 동작                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| 시리즈 데이터 1개            | 마커 미표시 (최고=최저)                                                                 |
| 최고가 = 최저가              | 마커 미표시                                                                             |
| 시리즈 > 10개 기본값         | `showMarkers` = false (사용자가 수동 ON 가능)                                           |
| 마커 라벨이 차트 상단 밖으로 | yOffset이 Y축 범위 밖일 수 있으나, SVG 클리핑 없으므로 표시됨. 마진(TOP=40) 내에서 수용 |
| 다크모드                     | `theme.palette.text.primary`로 라벨 색상 자동 대응, 마커 기호는 시리즈 color 사용       |
| 수량 모드에서 극값           | 동일 로직, 단위만 `kg`                                                                  |
| 범례 토글로 시리즈 숨김      | `data-series-key` 연동으로 마커도 함께 숨겨짐                                           |

---

## 테스트 계획

### 통합 테스트 (수동)

| #   | 시나리오                      | 확인 사항                          |
| --- | ----------------------------- | ---------------------------------- |
| 1   | 시리즈 3개 차트에서 마커 표시 | 각 시리즈에 ▲/▼ + 값 라벨 표시     |
| 2   | 가격 → 수량 모드 전환         | 마커 값이 수량으로 변경, 단위 `kg` |
| 3   | 시리즈 15개 → 기본 OFF        | 마커 미표시, 토글 버튼 비활성 색상 |
| 4   | 토글 클릭으로 ON              | 마커 표시                          |
| 5   | 범례 토글로 시리즈 숨김       | 해당 시리즈 마커도 숨겨짐          |
| 6   | 모바일에서 마커               | 폰트 8px, 오프셋 10px로 표시       |
| 7   | 다크모드                      | 라벨 색상 정상                     |
| 8   | 값 > 10000                    | "1.5만원" 축약 표시                |

---

## 의존성

- Phase 0-1(범례 토글)의 `data-series-key` 인프라 활용 (없어도 독립 동작)
- Phase 1-1(Crosshair)과 순서 의존: Crosshair overlay가 마커 위에 와야 함
- 외부 패키지 추가: 없음 (`HeightIcon`은 `@mui/icons-material`에 포함)
