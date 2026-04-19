# Phase 1-1: Crosshair (수직선 + 값 패널) — 상세 구현 명세

> **연관 문서**: [`chart-enhancement-plan.md`](../planning/chart-enhancement-plan.md)
>
> 마우스/터치 이동 시 수직선을 표시하고, 해당 날짜의 모든 시리즈 값을 한번에 표시한다.
> "같은 날 지역별 가격이 얼마였나?" — 현재 불가능한 횡단면 비교를 가능하게 한다.

---

## 현재 코드 구조 파악

### 기존 인터랙션: 포인트 호버 툴팁

```typescript
// drawSeriesLineAndPoints() 내부
subplotGroup
  .append("circle")
  .on("mouseenter", function (event) {
    const tooltip = createD3Tooltip(theme);
    tooltip.html(`<div><strong>${series.region} ${grade}</strong></div>...`);
  })
  .on("mouseleave", () => removeD3Tooltip());
```

- **단일 포인트**만 호버 가능
- 같은 날짜의 다른 시리즈 값을 보려면 각각 호버해야 함
- `createD3Tooltip()`: body에 div 추가, pointer-events: none

### 서브플롯 구조

```
svg
├─ g (year=2023, translate(xOffset, TOP))
│  ├─ text "2023년"
│  ├─ g (xAxis)
│  ├─ g (yAxis)     ← yearIndex === 0일 때만
│  ├─ path (series line)
│  ├─ circle (data point) × N
│  └─ path (MA line)
├─ g (year=2024, translate(xOffset, TOP))
│  └─ ... 동일 구조
└─ g (legend)
```

각 서브플롯은 독립적인 `xScale` (시간 스케일)을 가짐.

---

## 구현 명세

### 핵심 아키텍처

각 서브플롯에 투명 overlay `rect`를 추가하고, `mousemove`/`touchmove` 이벤트에서:

1. 마우스 X 좌표 → `xScale.invert()` → 가장 가까운 날짜 탐색 (bisector)
2. 수직선 표시 (해당 날짜의 X 위치)
3. 그 날짜에 해당하는 모든 시리즈의 값을 패널에 표시

---

### Task 1: 서브플롯별 Crosshair 요소 추가

#### `useDrawAnalysisChart.ts` — `drawSubplot()` 확장

`drawSubplot()`이 시리즈 렌더링 후, 가장 위에 Crosshair 레이어를 추가한다.
(SVG 순서상 뒤에 추가해야 overlay가 이벤트를 받음)

```typescript
/** 서브플롯에 crosshair 인터랙션을 추가합니다. */
const addCrosshair = ({
  subplotGroup,
  yearData,
  seriesList,
  xScale,
  globalYScale,
  yValue,
  subplotWidth,
  subplotHeight,
  isMobile,
  fontSize,
  theme,
}: AddCrosshairParams) => {
  // 1. 수직선 (초기 숨김)
  const crosshairLine = subplotGroup
    .append("line")
    .attr("class", "crosshair-line")
    .attr("y1", 0)
    .attr("y2", subplotHeight)
    .attr("stroke", theme.palette.text.secondary)
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3")
    .attr("opacity", 0);

  // 2. 투명 overlay rect (이벤트 수신용)
  const overlay = subplotGroup
    .append("rect")
    .attr("class", "crosshair-overlay")
    .attr("width", subplotWidth)
    .attr("height", subplotHeight)
    .attr("fill", "transparent")
    .style("cursor", "crosshair");

  // 3. 날짜별 데이터 인덱스 (bisector용)
  const uniqueDates = [...new Set(yearData.map((d) => d.date))]
    .sort()
    .map((s) => new Date(s));

  const bisect = d3.bisector<Date, Date>((d) => d).left;

  // 4. 이벤트 핸들러
  const handleMove = (event: MouseEvent | TouchEvent) => {
    const [mouseX] = d3.pointer(event, overlay.node()!);
    const hoveredDate = xScale.invert(mouseX);
    const index = bisect(uniqueDates, hoveredDate);
    const nearestDate = getNearestDate(uniqueDates, index, hoveredDate);

    if (!nearestDate) return;

    // 수직선 위치 업데이트
    const xPos = xScale(nearestDate);
    crosshairLine.attr("x1", xPos).attr("x2", xPos).attr("opacity", 0.6);

    // 툴팁 내용 생성
    showCrosshairTooltip({
      event,
      nearestDate,
      seriesList,
      yValue,
      theme,
      isMobile,
    });
  };

  overlay
    .on("mousemove", handleMove)
    .on("touchmove", (event: TouchEvent) => {
      event.preventDefault(); // 스크롤 방지
      handleMove(event);
    })
    .on("mouseleave", () => {
      crosshairLine.attr("opacity", 0);
      removeD3Tooltip();
    })
    .on("touchend", () => {
      crosshairLine.attr("opacity", 0);
      removeD3Tooltip();
    });
};
```

---

### Task 2: 가장 가까운 날짜 탐색

```typescript
/**
 * bisect 결과에서 가장 가까운 날짜를 반환합니다.
 */
const getNearestDate = (
  dates: Date[],
  index: number,
  target: Date,
): Date | null => {
  if (dates.length === 0) return null;

  const d0 = dates[index - 1];
  const d1 = dates[index];

  if (!d0) return d1;
  if (!d1) return d0;

  return target.getTime() - d0.getTime() > d1.getTime() - target.getTime()
    ? d1
    : d0;
};
```

---

### Task 3: Crosshair 툴팁 내용

기존 단일 포인트 툴팁과 달리, **해당 날짜의 모든 활성 시리즈 값**을 한 번에 표시한다.

```typescript
const showCrosshairTooltip = ({
  event,
  nearestDate,
  seriesList,
  yValue,
  theme,
  isMobile,
}: ShowCrosshairTooltipParams) => {
  const dateStr = formatDateKorean(nearestDate);
  const tooltip = createD3Tooltip(theme);

  // 해당 날짜의 시리즈별 값 수집
  const entries = seriesList
    .map((series) => {
      const seriesKey = `${series.region}-${series.gradeKey}`;
      const point = series.data.find(
        (d) => new Date(d.date).toDateString() === nearestDate.toDateString(),
      );
      if (!point) return null;
      return {
        seriesKey,
        region: series.region,
        gradeKey: series.gradeKey,
        color: series.color,
        value: yValue(point),
        point,
      };
    })
    .filter(Boolean);

  // HTML 생성
  const header = `<div style="font-weight:bold;margin-bottom:4px">${dateStr}</div>`;
  const rows = entries
    .map((e) => {
      const grade = GradeKeyToKorean[e.gradeKey] || e.gradeKey;
      return `<div style="display:flex;align-items:center;gap:6px">
        <span style="width:8px;height:8px;border-radius:50%;background:${e.color};display:inline-block"></span>
        <span>${e.region} ${grade}</span>
        <span style="margin-left:auto;font-weight:600">${e.value.toLocaleString()}</span>
      </div>`;
    })
    .join("");

  const maxRows = isMobile ? 8 : 15;
  const truncated = entries.length > maxRows;
  const displayRows = truncated
    ? rows.slice(0, maxRows) +
      `<div style="color:gray">... 외 ${entries.length - maxRows}개</div>`
    : rows;

  tooltip.html(header + displayRows);

  // 위치 (화면 밖 방지)
  const [mouseX, mouseY] = d3.pointer(event, document.body);
  const tooltipWidth = 220;
  const flipX = mouseX + tooltipWidth > window.innerWidth - 20;
  tooltip
    .style("left", (flipX ? mouseX - tooltipWidth - 10 : mouseX + 15) + "px")
    .style("top", Math.max(10, mouseY - 10) + "px")
    .style("max-height", isMobile ? "200px" : "400px")
    .style("overflow-y", "auto")
    .style("min-width", "180px");
};
```

---

### Task 4: Phase 0-1(범례 토글)과 연동

Crosshair 툴팁에서 **숨겨진 시리즈는 제외**해야 한다.

`hiddenSeriesRef`를 `addCrosshair`에 전달:

```typescript
const entries = seriesList
  .filter((s) => !hiddenSeriesRef?.current?.has(`${s.region}-${s.gradeKey}`))
  .map((series) => { ... });
```

Phase 0-1이 아직 구현되지 않았다면 이 필터는 no-op (ref 없으면 전체 표시).

---

### Task 5: `drawSubplot()`에서 `addCrosshair` 호출

#### `useDrawAnalysisChart.ts` — `drawSubplot()` 맨 마지막에 추가

```typescript
// 기존: seriesList.forEach → drawSeriesLineAndPoints
// 기존: if (showMA) → drawMAOverlay

// 신규: Crosshair (가장 마지막에 추가해야 overlay가 최상위)
addCrosshair({
  subplotGroup,
  yearData,
  seriesList,
  xScale,
  globalYScale,
  yValue,
  subplotWidth,
  subplotHeight,
  isMobile,
  fontSize,
  theme,
});
```

---

### Task 6: 기존 포인트 호버 툴팁과 공존

**문제**: Crosshair overlay가 최상위이므로 개별 circle의 mouseenter가 발생하지 않음.

**해결 방안 2가지:**

| 방안                                           | 설명                                                          | 채택        |
| ---------------------------------------------- | ------------------------------------------------------------- | ----------- |
| A. circle 이벤트 제거, Crosshair로 대체        | Crosshair 패널이 더 풍부한 정보를 제공하므로 개별 호버 불필요 | ✅ **채택** |
| B. overlay에 pointer-events: none, circle 유지 | Crosshair와 개별 호버 공존. 구현 복잡                         | ❌          |

**채택 이유**: Crosshair는 개별 호버 툴팁의 상위호환. 같은 날짜의 모든 시리즈를 한번에 보여줌.

→ `drawSeriesLineAndPoints()`에서 `mouseenter`/`mouseleave` 이벤트를 제거한다.
→ circle에 `pointer-events: none` 추가 (overlay가 이벤트를 받도록).

```typescript
subplotGroup
  .append("circle")
  .attr("data-series-key", seriesKey)
  // ... 기존 attr
  .style("pointer-events", "none"); // 신규
// mouseenter, mouseleave 제거
```

---

## 수정 파일 요약

| 파일                      | 변경 내용                                                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDrawAnalysisChart.ts` | (1) `addCrosshair()` 함수 추가 (2) `getNearestDate()` 헬퍼 추가 (3) `showCrosshairTooltip()` 추가 (4) `drawSubplot()`에서 호출 (5) `drawSeriesLineAndPoints()`에서 개별 호버 이벤트 제거 |
| `d3Tooltip.ts`            | 변경 없음 (기존 `createD3Tooltip`/`removeD3Tooltip` 재사용)                                                                                                                              |

---

## 타입 정의

```typescript
type AddCrosshairParams = {
  subplotGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  yearData: WeeklyPriceDatum[];
  seriesList: AnalysisSeries[];
  xScale: d3.ScaleTime<number, number>;
  globalYScale: d3.ScaleLinear<number, number>;
  yValue: (d: WeeklyPriceDatum) => number;
  subplotWidth: number;
  subplotHeight: number;
  isMobile: boolean;
  fontSize: { title: string; axis: string; legend: string; message: string };
  theme: Theme;
  hiddenSeriesRef?: React.RefObject<Set<string>>;
};

type ShowCrosshairTooltipParams = {
  event: MouseEvent | TouchEvent;
  nearestDate: Date;
  seriesList: AnalysisSeries[];
  yValue: (d: WeeklyPriceDatum) => number;
  theme: Theme;
  isMobile: boolean;
};
```

---

## 엣지 케이스

| 케이스                                 | 동작                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------- |
| 특정 날짜에 일부 시리즈만 데이터 있음  | 데이터 있는 시리즈만 툴팁에 표시                                       |
| 모든 시리즈가 숨겨진 상태 (Phase 0-1)  | 수직선만 표시, 툴팁 내용 없음 또는 "표시할 데이터가 없습니다"          |
| 서브플롯 간 마우스 이동                | 각 서브플롯의 overlay가 독립적이므로 자연스럽게 전환                   |
| 모바일 터치                            | `touchmove`에 `preventDefault()` → 스크롤 방지. `touchend`에서 cleanup |
| 시리즈 > 15개 (PC) 또는 > 8개 (모바일) | 툴팁 행 수 제한 + "외 N개" 표시                                        |
| 차트 영역 밖으로 마우스 이동           | `mouseleave`에서 수직선 + 툴팁 제거                                    |
| 날짜 데이터가 1개뿐인 서브플롯         | bisector가 유일한 날짜 반환, 정상 동작                                 |

---

## 성능 고려

- `mousemove`는 고빈도 이벤트. `seriesList.find()`가 시리즈 수 × 포인트 수만큼 탐색.
- **최적화**: `drawSubplot` 시 날짜별 lookup Map을 미리 생성:

```typescript
const dateMap = new Map<string, Map<string, WeeklyPriceDatum>>();
seriesList.forEach((series) => {
  const key = `${series.region}-${series.gradeKey}`;
  series.data.forEach((d) => {
    const dateKey = new Date(d.date).toDateString();
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
    dateMap.get(dateKey)!.set(key, d);
  });
});
```

Crosshair 이벤트에서 `dateMap.get(nearestDate.toDateString())`으로 O(1) 조회.

---

## 테스트 계획

### 통합 테스트 (수동)

| #   | 시나리오                            | 확인 사항                             |
| --- | ----------------------------------- | ------------------------------------- |
| 1   | PC에서 서브플롯 위 마우스 이동      | 수직선 + 다중 시리즈 툴팁 표시        |
| 2   | 서브플롯 밖으로 마우스 이동         | 수직선 + 툴팁 사라짐                  |
| 3   | 모바일에서 차트 터치 + 드래그       | 수직선 이동, 스크롤 방지              |
| 4   | 모바일에서 터치 해제                | 수직선 + 툴팁 사라짐                  |
| 5   | 시리즈 20개 + Crosshair             | 툴팁 행 수 제한, "외 N개" 표시        |
| 6   | 범례 토글로 시리즈 숨김 + Crosshair | 숨긴 시리즈는 툴팁에서 제외           |
| 7   | 다크모드 Crosshair                  | 수직선 색상, 툴팁 배경 테마 대응      |
| 8   | 2개 연도 서브플롯 간 마우스 이동    | 각 서브플롯에서 독립적 crosshair 동작 |

---

## 의존성

- **Phase 0-1과 연동 가능하지만 독립 구현 가능**: `hiddenSeriesRef`가 없으면 전체 시리즈 표시
- 기존 `createD3Tooltip`/`removeD3Tooltip` 재사용
- 외부 패키지 추가: 없음
