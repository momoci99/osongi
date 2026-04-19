# Phase 0-3: 차트 인라인 높이 확장 — 상세 구현 명세

> **연관 문서**: [`chart-enhancement-plan.md`](../planning/chart-enhancement-plan.md)
>
> "차트 확대" / "차트 축소" 텍스트 버튼으로 차트 높이를 토글하여 데이터가 밀집된 차트의 가독성을 개선한다.

---

## 현재 코드 구조 파악

### 차트 높이 전달 흐름

```
DataAnalysis.tsx
  └─ ChartSection (height prop 없음, 내부에서 CHART_LAYOUT.DEFAULT_HEIGHT 사용)
      └─ DataAnalysisChart (height={CHART_LAYOUT.DEFAULT_HEIGHT})
          └─ containerRef Box (height: { xs: 300, sm: 400, md: height })
              └─ ResizeObserver → containerSize.height
                  └─ useDrawAnalysisChart (containerHeight)
```

- `CHART_LAYOUT.DEFAULT_HEIGHT = 400` (Numbers.ts)
- `CHART_LAYOUT.MIN_HEIGHT = 300`
- `DataAnalysisChart/index.tsx` 116행: `height: { xs: 300, sm: 400, md: height }`
- ResizeObserver가 높이 변화를 감지하여 차트 자동 리렌더

### fullScreen Dialog 기각 사유

- 모달이라 필터 패널 접근 불가
- 필터 변경 → 닫기 → 수정 → 다시 열기 반복 발생

---

## 구현 명세

### Task 1: EXPANDED_HEIGHT 상수 추가

#### `src/const/Numbers.ts`

```typescript
export const CHART_LAYOUT = {
  DEFAULT_HEIGHT: 400,
  EXPANDED_HEIGHT: 700,
  MIN_HEIGHT: 300,
  MOBILE_BREAKPOINT: 768,
} as const;
```

---

### Task 2: ChartSection에 확장 상태 + 버튼 추가

#### `src/components/DataAnalysis/ChartSection.tsx`

**상태:**

```typescript
const [expanded, setExpanded] = useState(false);
const chartHeight = expanded
  ? CHART_LAYOUT.EXPANDED_HEIGHT
  : CHART_LAYOUT.DEFAULT_HEIGHT;
```

**UI — 타이틀 바 우측에 텍스트 버튼 추가:**

```typescript
import { Box, Typography, Button, Alert } from "@mui/material";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";

// 타이틀 바 우측 영역
<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
  <Button
    size="small"
    variant="text"
    startIcon={expanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
    onClick={() => setExpanded((prev) => !prev)}
    sx={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
  >
    {expanded ? "차트 축소" : "차트 확대"}
  </Button>
  <Typography variant="body2" color="text.secondary">
    {loading ? "로딩 중..." : `${filteredDataLength}개 레코드 · ${seriesCount}개 시리즈`}
  </Typography>
</Box>
```

**설계 결정:**

| 결정        | 선택                             | 이유                                                         |
| ----------- | -------------------------------- | ------------------------------------------------------------ |
| 아이콘      | `UnfoldMore` / `UnfoldLess`      | "위아래로 펼치기" 의미가 높이 확장에 가장 직관적             |
| 텍스트 병행 | "차트 확대" / "차트 축소"        | 고령 사용자(40~70대)가 아이콘만으로 기능 인지 어려움         |
| 버튼 위치   | 타이틀 바 우측, 레코드 수 좌측   | 차트 조작 버튼이 타이틀 영역에 집약                          |
| 확장 높이   | 700px                            | DEFAULT(400) 대비 1.75배. 범례 포함 시 실질 차트 영역 약 2배 |
| 모바일      | 동일 높이로 적용. xs에서도 700px | 모바일에서 세로 공간은 스크롤로 확보 가능                    |

**height prop 전달:**

```typescript
<DataAnalysisChart
  data={chartData}
  height={chartHeight}
  mode={chartMode}
  onModeChange={onChartModeChange}
  maData={maData}
/>
```

---

### Task 3: DataAnalysisChart 컨테이너 높이 반영

#### `DataAnalysisChart/index.tsx` — containerRef Box

현재 코드:

```typescript
<Box
  ref={containerRef}
  sx={{
    width: "100%",
    height: { xs: 300, sm: 400, md: height },
    minHeight: 300,
  }}
>
```

`height` prop이 이미 전달되므로 **반응형 분기를 수정**:

```typescript
<Box
  ref={containerRef}
  sx={{
    width: "100%",
    height: { xs: Math.min(height, 500), sm: height, md: height },
    minHeight: CHART_LAYOUT.MIN_HEIGHT,
  }}
>
```

- `xs`(모바일): 확장 시에도 최대 500px로 제한 (모바일 뷰포트 과점 방지)
- `sm` 이상: prop 높이 그대로 적용
- ResizeObserver가 높이 변화를 감지 → `useDrawAnalysisChart` 자동 리렌더

---

## 수정 파일 요약

| 파일                                                      | 변경 내용                                                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/const/Numbers.ts`                                    | `CHART_LAYOUT.EXPANDED_HEIGHT = 700` 추가                                                 |
| `src/components/DataAnalysis/ChartSection.tsx`            | (1) `expanded` 상태 (2) "차트 확대/축소" 버튼 (3) `chartHeight` 계산 (4) height prop 전달 |
| `src/components/DataAnalysis/DataAnalysisChart/index.tsx` | 컨테이너 Box height 반응형 분기 수정                                                      |

---

## 엣지 케이스

| 케이스                            | 동작                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 확장 상태에서 필터 변경           | 확장 상태 유지 (데이터만 변경)                                                                        |
| 확장 상태에서 페이지 이동 후 복귀 | React 상태 초기화 → 기본(축소) 상태                                                                   |
| 빈 데이터 (EmptyState)            | EmptyState의 height에도 `chartHeight` 적용하여 확장 시 빈 영역이 적절히 커짐                          |
| 범례가 많아 SVG 전체 높이 > 700px | `useDrawAnalysisChart` 내부의 `svg.attr("height", totalHeight)` 가 범례 포함 높이로 오버라이드 → 정상 |

---

## 테스트 계획

### 통합 테스트 (수동)

| #   | 시나리오                   | 확인 사항                        |
| --- | -------------------------- | -------------------------------- |
| 1   | "차트 확대" 클릭           | 높이 400 → 700px, 차트 리렌더    |
| 2   | "차트 축소" 클릭           | 높이 700 → 400px 복원            |
| 3   | 모바일 (< 768px)에서 확장  | 높이 최대 500px 적용             |
| 4   | 확장 + 다크모드 전환       | 확장 상태 유지, 차트 정상 리렌더 |
| 5   | 확장 + 가격↔수량 모드 전환 | 확장 높이 유지                   |
| 6   | 빈 데이터에서 "차트 확대"  | EmptyState 높이도 확장           |

---

## 의존성

- Phase 0-1, 0-2와 독립적으로 구현 가능
- 외부 패키지 추가: 없음 (`UnfoldMore/UnfoldLess`는 `@mui/icons-material`에 포함)
