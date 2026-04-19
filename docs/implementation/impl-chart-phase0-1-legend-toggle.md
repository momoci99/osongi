# Phase 0-1: 범례 클릭 시리즈 토글 — 상세 구현 명세

> **연관 문서**: [`chart-enhancement-plan.md`](../planning/chart-enhancement-plan.md)
>
> 범례 항목 클릭으로 개별 시리즈를 show/hide하여, 시리즈 과부하 상황에서 관심 시리즈만 집중 분석 가능하도록 한다.

---

## 현재 코드 구조 파악

### 범례 렌더링: `drawLegend()` — `useDrawAnalysisChart.ts` 450행~

```typescript
items.forEach((item) => {
  const legendItem = legend
    .append("g")
    .attr("transform", `translate(${cursorX}, ${cursorY})`);

  legendItem.append("line"); // 색상 + 대시 패턴 표시
  legendItem.append("text"); // "홍천 1등급" 텍스트
});
```

- 각 `legendItem`은 `<g>` 그룹 내 `<line>` + `<text>`
- 클릭 이벤트 없음, `cursor` 스타일 없음
- 터치 영역 = 텍스트 바운딩 박스 (모바일에서 매우 작음)

### 시리즈 렌더링: `drawSeriesLineAndPoints()` — 370행~

```typescript
subplotGroup
  .append("path") // 시리즈 라인
  .datum(series.data)
  .attr("stroke", series.color)
  .attr("stroke-dasharray", series.dashPattern);

series.data.forEach((d) => {
  subplotGroup
    .append("circle") // 데이터 포인트
    .attr("fill", series.color);
});
```

- 시리즈 key(`region-gradeKey`)를 식별할 어트리뷰트 없음
- MA 오버레이(`drawMAOverlay`)도 동일 시리즈 식별자 없음

### useEffect 의존 배열 — 164행

```typescript
[data, height, mode, theme, containerWidth, containerHeight, maData, showMA];
```

- `hiddenSeries`를 여기에 추가하면 범례 클릭마다 `svg.selectAll("*").remove()` 실행 → 전체 재그리기
- **반드시 의존 배열 밖에서 처리해야 함**

---

## 구현 명세

### 핵심 아키텍처 결정

**`useRef` + `data-series-key` 어트리뷰트 + D3 직접 opacity 조작**

- `useEffect` 내 D3 렌더링 시 모든 시리즈 요소에 `data-series-key` 어트리뷰트 부여
- 범례 클릭 시 `useRef`로 관리하는 `hiddenSeries` Set 업데이트
- `d3.selectAll`로 해당 key의 요소 opacity만 변경
- `useEffect` 재실행 없음 → SVG 재그리기 없음

---

### Task 1: 시리즈 요소에 `data-series-key` 부여

#### `useDrawAnalysisChart.ts` — `drawSeriesLineAndPoints()`

**Before:**

```typescript
subplotGroup
  .append("path")
  .datum(series.data)
  .attr("fill", "none")
  .attr("stroke", series.color);
// ...
```

**After:**

```typescript
const seriesKey = `${series.region}-${series.gradeKey}`;

subplotGroup
  .append("path")
  .datum(series.data)
  .attr("data-series-key", seriesKey)
  .attr("fill", "none")
  .attr("stroke", series.color);
// ...
```

동일하게 `circle`에도 `data-series-key` 부여:

```typescript
subplotGroup
  .append("circle")
  .attr("data-series-key", seriesKey)
  .attr("cx", xScale(new Date(d.date)));
// ...
```

#### `useDrawAnalysisChart.ts` — `drawMAOverlay()`

MA 라인에도 동일 key 부여:

```typescript
const seriesKey = `${series.region}-${series.gradeKey}`;

subplotGroup
  .append("path")
  .datum(groupMAData)
  .attr("data-series-key", seriesKey)
  .attr("fill", "none");
// ...
```

---

### Task 2: `hiddenSeriesRef` 관리 및 전달

#### `DataAnalysisChart/index.tsx`

```typescript
const hiddenSeriesRef = useRef<Set<string>>(new Set());
```

`useDrawAnalysisChart` 훅에 `hiddenSeriesRef`와 `svgRef`를 전달하지 않는다.
대신 범례 클릭 핸들러에서 `svgRef`를 통해 직접 DOM 조작한다.

**토글 함수:**

```typescript
const toggleSeries = (seriesKey: string) => {
  const svg = d3.select(svgRef.current);
  const hidden = hiddenSeriesRef.current;

  if (hidden.has(seriesKey)) {
    hidden.delete(seriesKey);
    svg.selectAll(`[data-series-key="${seriesKey}"]`).attr("opacity", null);
    svg.selectAll(`[data-legend-key="${seriesKey}"]`).attr("opacity", null);
  } else {
    hidden.add(seriesKey);
    svg.selectAll(`[data-series-key="${seriesKey}"]`).attr("opacity", 0.08);
    svg.selectAll(`[data-legend-key="${seriesKey}"]`).attr("opacity", 0.3);
  }
};
```

**주의**: `attr("opacity", null)`은 어트리뷰트를 제거하여 원래 값 복원.

---

### Task 3: 범례에 클릭 이벤트 추가

#### `useDrawAnalysisChart.ts` — `drawLegend()`

**파라미터 확장:**

```typescript
type DrawLegendParams = {
  // ... 기존 필드
  onLegendClick?: (seriesKey: string) => void;
};
```

**`drawLegend()` 내부 수정:**

```typescript
items.forEach((item) => {
  const seriesKey = `${item.region}-${item.gradeKey}`;
  // ... (기존 위치 계산)

  const legendItem = legend
    .append("g")
    .attr("transform", `translate(${cursorX}, ${cursorY})`)
    .attr("data-legend-key", seriesKey)
    .style("cursor", "pointer");

  // 투명 히트 영역 (터치 타겟 44px 보장)
  const hitAreaHeight = Math.max(rowHeight, 44);
  legendItem
    .append("rect")
    .attr("x", -4)
    .attr("y", -hitAreaHeight / 2)
    .attr("width", estimatedWidth)
    .attr("height", hitAreaHeight)
    .attr("fill", "transparent");

  legendItem.append("line"); // ... 기존 코드
  legendItem.append("text"); // ... 기존 코드

  // 클릭 이벤트
  if (onLegendClick) {
    legendItem.on("click", () => onLegendClick(seriesKey));
  }
});
```

**핵심 변경점:**

1. `data-legend-key` 어트리뷰트 → 범례 자체의 opacity 변경용
2. `cursor: pointer` → 클릭 가능함을 시각적으로 표시
3. 투명 `rect` 히트 영역 → 모바일 터치 타겟 44px 보장
4. `onLegendClick` 콜백 → `index.tsx`의 `toggleSeries` 연결

---

### Task 4: `onLegendClick` 콜백 연결

#### `useDrawAnalysisChart.ts` — 훅 파라미터 확장

```typescript
type UseDrawAnalysisChartParams = {
  // ... 기존 필드
  onLegendClick?: (seriesKey: string) => void;
};
```

**`useEffect` 내 `drawLegend` 호출부 수정:**

```typescript
const totalHeight = drawLegend({
  svg,
  items: legendItems,
  legendTop,
  marginLeft: margin.left,
  availableWidth,
  isMobile,
  fontSize,
  theme,
  onLegendClick,
});
```

**⚠️ `onLegendClick`을 `useEffect` 의존 배열에 추가하지 않는다.**

- `onLegendClick`은 `useRef` 기반 `toggleSeries`이므로 참조가 안정적
- 또는 `useCallback`으로 감싸되 deps를 빈 배열로 유지
- `useEffect` 재실행 방지가 핵심

#### `DataAnalysisChart/index.tsx`

```typescript
const toggleSeries = useCallback((seriesKey: string) => {
  // ... (Task 2의 토글 로직)
}, []); // deps 없음 — svgRef, hiddenSeriesRef는 ref

const { svgRef } = useDrawAnalysisChart({
  // ... 기존 props
  onLegendClick: toggleSeries,
});
```

---

### Task 5: 온보딩 힌트

시리즈가 20개 초과일 때 범례 영역 상단에 힌트 텍스트를 한 번 표시한다.

#### `useDrawAnalysisChart.ts` — `drawLegend()` 내부

```typescript
// 범례 아이템 렌더링 전에
if (items.length > 20) {
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", -8)
    .style("font-size", isMobile ? "9px" : "11px")
    .style("fill", theme.palette.text.secondary)
    .style("font-style", "italic")
    .text("💡 범례를 클릭하면 시리즈를 숨길 수 있습니다");
}
```

---

### Task 6: 데이터 변경 시 hiddenSeries 리셋

`useEffect`(전체 재그리기)가 실행될 때 `hiddenSeriesRef`를 초기화해야 한다.
새 데이터가 들어오면 이전 hidden 상태가 의미 없어지기 때문.

#### `DataAnalysisChart/index.tsx`

```typescript
useEffect(() => {
  hiddenSeriesRef.current.clear();
}, [data, mode]);
```

---

## 수정 파일 요약

| 파일                          | 변경 내용                                                                                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDrawAnalysisChart.ts`     | (1) 파라미터에 `onLegendClick` 추가 (2) `drawSeriesLineAndPoints`에 `data-series-key` 부여 (3) `drawMAOverlay`에 `data-series-key` 부여 (4) `drawLegend`에 클릭 이벤트, 히트영역, `data-legend-key`, 힌트 텍스트 추가 |
| `DataAnalysisChart/index.tsx` | (1) `hiddenSeriesRef` 생성 (2) `toggleSeries` 콜백 (3) `onLegendClick` 전달 (4) 데이터/모드 변경 시 ref 리셋                                                                                                          |
| `seriesBuilder.ts`            | 변경 없음                                                                                                                                                                                                             |

---

## 엣지 케이스

| 케이스                                        | 동작                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 모든 시리즈를 숨긴 경우                       | Y축·X축·타이틀은 유지, 데이터만 투명. EmptyState 전환 불필요                                                                                     |
| 데이터 필터 변경 후 재렌더                    | `hiddenSeriesRef.clear()` → 모든 시리즈 표시 상태로 리셋                                                                                         |
| 연도별 서브플롯에서 일부 연도에만 있는 시리즈 | 해당 연도 서브플롯에만 영향, 다른 연도 무관                                                                                                      |
| MA 오버레이 활성 + 시리즈 숨김                | MA 라인도 동일 `data-series-key`이므로 함께 숨겨짐                                                                                               |
| 다크모드 전환                                 | `useEffect` 재실행 (theme deps) → `hiddenSeriesRef` 유지됨. 단, SVG가 재그리기되므로 숨김 상태 시각적 리셋 발생. 리셋 후 사용자가 다시 토글 필요 |

**다크모드 전환 시 hidden 상태 복원 문제:**
`useEffect` 재실행 후 `hiddenSeriesRef`에 값이 남아있으므로, 재그리기 완료 후 hidden 상태를 다시 적용하는 로직 추가 필요.

```typescript
// useEffect 내 맨 마지막 (drawLegend 후)
hiddenSeriesRef.current.forEach((seriesKey) => {
  svg.selectAll(`[data-series-key="${seriesKey}"]`).attr("opacity", 0.08);
  svg.selectAll(`[data-legend-key="${seriesKey}"]`).attr("opacity", 0.3);
});
```

이를 위해 `hiddenSeriesRef`도 훅 파라미터로 전달해야 한다:

```typescript
type UseDrawAnalysisChartParams = {
  // ... 기존 필드
  onLegendClick?: (seriesKey: string) => void;
  hiddenSeriesRef?: React.RefObject<Set<string>>;
};
```

---

## 테스트 계획

### 단위 테스트 (Vitest)

`seriesBuilder.ts`의 기존 순수 함수는 변경 없으므로 추가 테스트 불필요.

### 통합 테스트 (수동)

| #   | 시나리오                                            | 확인 사항                                        |
| --- | --------------------------------------------------- | ------------------------------------------------ |
| 1   | 범례 항목 클릭                                      | 해당 시리즈 라인+포인트+MA 모두 투명 처리        |
| 2   | 같은 항목 재클릭                                    | 시리즈 복원                                      |
| 3   | 경북 전체(13조합) + 3등급 선택 → 특정 시리즈만 토글 | 39개 시리즈 중 관심 항목만 남음                  |
| 4   | 다크모드 전환                                       | 숨김 상태 유지                                   |
| 5   | 가격↔수량 모드 전환                                 | `hiddenSeriesRef` 리셋, 모든 시리즈 표시         |
| 6   | 모바일(< 768px)에서 범례 탭                         | 터치 영역 44px 동작, 정확한 토글                 |
| 7   | 시리즈 > 20개 시 힌트 텍스트                        | "범례를 클릭하면 시리즈를 숨길 수 있습니다" 표시 |
| 8   | 필터 변경 → 새 데이터 로딩                          | 숨김 상태 리셋                                   |

---

## 의존성

- 외부 패키지 추가: 없음
- Phase 0-2(과부하 경고)와 독립적으로 구현 가능
- 후속 Phase 1-1(Crosshair)에서 hidden 시리즈는 Crosshair 패널에서도 제외해야 함
