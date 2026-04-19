# Phase 0-2: 시리즈 과부하 경고 — 상세 구현 명세

> **연관 문서**: [`chart-enhancement-plan.md`](../planning/chart-enhancement-plan.md), [`impl-chart-phase0-1-legend-toggle.md`](./impl-chart-phase0-1-legend-toggle.md)
>
> 시리즈 수가 많을 때 안내 메시지를 표시하여 사용자에게 가독성 문제와 해결 방법(범례 토글)을 안내한다.
> 기존 계획의 0-2(경고)와 0-3(시리즈 수 표시)을 통합한다.

---

## 현재 코드 구조 파악

### `ChartSection.tsx`

```typescript
<Typography variant="body2" color="text.secondary">
  {loading ? "로딩 중..." : `${filteredDataLength}개 레코드`}
</Typography>
```

- 레코드 수만 표시, 시리즈 수는 미표시
- 경고 메시지 영역 없음

### 시리즈 수 계산

현재 시리즈 수를 알 수 있는 곳:

1. **`buildYearSeries()`** — 연도별로 `region-gradeKey` 조합 수 반환. 차트 내부에서만 실행.
2. **`collectLegendItems()`** — 전체 연도에 걸친 unique 조합. 차트 내부에서만 실행.
3. **`chartData` (WeeklyPriceDatum[])** — ChartSection의 prop. `region`과 `gradeKey` 필드 접근 가능.

**방안 3을 채택**: 부모(`ChartSection`)에서 prop 기반으로 직접 계산. 차트 내부 의존 없음.

```typescript
const seriesCount = new Set(chartData.map((d) => `${d.region}-${d.gradeKey}`))
  .size;
```

---

## 구현 명세

### Task 1: 시리즈 수 계산 유틸 함수

#### `src/utils/analysis/convert.ts` (또는 `seriesBuilder.ts`)

별도 함수로 추출하여 재사용:

```typescript
/**
 * 차트 데이터에서 고유 시리즈(지역-등급 조합) 수를 계산합니다.
 */
export const countUniqueSeries = (data: WeeklyPriceDatum[]): number =>
  new Set(data.map((d) => `${d.region}-${d.gradeKey}`)).size;
```

한 줄이지만 함수로 추출하는 이유:

- ChartSection과 DataAnalysisChart 양쪽에서 사용 가능성
- 테스트 가능한 순수 함수
- 시리즈 key 형식(`${region}-${gradeKey}`)이 `buildYearSeries()`와 일관성 유지

---

### Task 2: ChartSection에 경고 메시지 추가

#### `src/components/DataAnalysis/ChartSection.tsx`

**상수:**

```typescript
const SERIES_WARNING_THRESHOLD = 20;
```

**컴포넌트 내부:**

```typescript
import { Box, Typography, Alert } from "@mui/material";
import { countUniqueSeries } from "../../utils/analysis/convert";

const ChartSection = ({ chartData, loading, filteredDataLength, ... }) => {
  const seriesCount = useMemo(
    () => countUniqueSeries(chartData),
    [chartData]
  );

  return (
    <SectionCard sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", ... }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          가격 및 수량 변동 추이
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {loading
            ? "로딩 중..."
            : `${filteredDataLength}개 레코드 · ${seriesCount}개 시리즈`}
        </Typography>
      </Box>

      {!loading && seriesCount > SERIES_WARNING_THRESHOLD && (
        <Alert
          severity="info"
          variant="outlined"
          sx={{ mb: 1.5, py: 0.5 }}
        >
          현재 {seriesCount}개 시리즈가 표시 중입니다. 범례를 클릭하여 관심 시리즈만 남겨보세요.
        </Alert>
      )}

      {/* ... 기존 차트/로딩/빈 상태 렌더링 */}
    </SectionCard>
  );
};
```

**설계 결정:**

| 결정         | 선택                                       | 이유                                                  |
| ------------ | ------------------------------------------ | ----------------------------------------------------- |
| MUI 컴포넌트 | `Alert` severity="info" variant="outlined" | 기존 디자인 시스템 활용, 시각적 구분 명확             |
| 임계치       | 20개                                       | 일반적 차트 가독성 한계. 조정 가능 상수로 분리        |
| 닫기 버튼    | 없음                                       | 매번 표시하여 범례 토글 사용을 유도. 경고가 아닌 안내 |
| 위치         | 타이틀 바 아래, 차트 위                    | 차트 보기 전에 인지                                   |
| 다크모드     | `Alert` outlined가 자동 대응               | 추가 처리 불필요                                      |

---

### Task 3: `useMemo`로 성능 보호

`countUniqueSeries`는 `chartData`가 변경될 때만 재계산:

```typescript
const seriesCount = useMemo(() => countUniqueSeries(chartData), [chartData]);
```

`chartData`가 수백~수천 행일 수 있으나 `Set` 연산은 O(n)이므로 useMemo면 충분.

---

## 수정 파일 요약

| 파일                                                             | 변경 내용                                                                                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/components/DataAnalysis/ChartSection.tsx`                   | (1) `Alert` import 추가 (2) `seriesCount` 계산 (3) 경고 메시지 조건부 렌더링 (4) 레코드 수 옆에 시리즈 수 표시 |
| `src/components/DataAnalysis/DataAnalysisChart/seriesBuilder.ts` | (1) `countUniqueSeries()` 함수 export 추가                                                                     |

---

## 엣지 케이스

| 케이스                     | 동작                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| 시리즈 0개 (빈 데이터)     | `EmptyState` 렌더링, 경고 미표시                                                                          |
| 시리즈 정확히 20개         | 임계치 초과가 아니므로 경고 미표시 (> 20)                                                                 |
| 로딩 중                    | `loading=true`일 때 경고 미표시                                                                           |
| 범례 토글로 시리즈 숨긴 후 | 경고는 **전체** 시리즈 수 기준 (숨긴 수 아님). 숨긴 상태는 시각적 opacity만 변경하므로 `chartData`는 불변 |

---

## 테스트 계획

### 단위 테스트 (Vitest)

```typescript
// seriesBuilder.test.ts
describe("countUniqueSeries", () => {
  it("고유 지역-등급 조합 수를 반환한다", () => {
    const data: WeeklyPriceDatum[] = [
      { date: "2024-09-01", region: "홍천", gradeKey: "grade1", ... },
      { date: "2024-09-01", region: "홍천", gradeKey: "grade1", ... }, // 중복
      { date: "2024-09-02", region: "양구", gradeKey: "grade2", ... },
    ];
    expect(countUniqueSeries(data)).toBe(2);
  });

  it("빈 배열은 0을 반환한다", () => {
    expect(countUniqueSeries([])).toBe(0);
  });
});
```

### 통합 테스트 (수동)

| #   | 시나리오                        | 확인 사항                                   |
| --- | ------------------------------- | ------------------------------------------- |
| 1   | 단일 지역 + 1등급 (시리즈 < 20) | 경고 미표시, "N개 레코드 · M개 시리즈" 표시 |
| 2   | 경북 전체 + 3등급 (시리즈 39개) | Alert 경고 표시                             |
| 3   | 다크모드에서 경고               | `Alert` outlined 다크모드 색상 정상         |
| 4   | 모바일에서 경고                 | Alert 텍스트 줄바꿈 정상                    |

---

## 의존성

- **Phase 0-1 (범례 토글)과 독립적으로 구현 가능** — 경고 메시지만 먼저 표시하고, 범례 토글 구현 후 "범례를 클릭하여" 문구가 실제 동작하게 됨
- 외부 패키지 추가: 없음 (`Alert`는 MUI에 포함)
