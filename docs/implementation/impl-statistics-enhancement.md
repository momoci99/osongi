# 통계 지표 강화 + 시즌 리포트 구현 계획

## 목표

데이터 분석 페이지에 전문적인 통계 지표와 시즌 요약 리포트를 추가하여 사용자가 시장 동향을 보다 깊이 이해할 수 있도록 한다.

---

## Phase 1: 통계 지표 강화

### 1-1. KPI 확장 — 변동성 지표 추가

**변경 파일:**

- `src/utils/analysis/kpi.ts` — `AnalysisKPI` 타입 확장 + 계산 로직 추가
- `src/components/DataAnalysis/AnalysisKPI.tsx` — 새 카드 렌더링

**추가할 지표:**

| 지표          | 설명          | 계산식                        |
| ------------- | ------------- | ----------------------------- |
| `priceStdDev` | 가격 표준편차 | `√(Σ(xi - x̄)² / n)` (가중)    |
| `priceCV`     | 변동계수      | `stdDev / avgPrice * 100` (%) |
| `medianPrice` | 중앙값        | 가격 정렬 후 중간값           |

**구현 상세:**

```typescript
// kpi.ts — AnalysisKPI 타입 확장
export type AnalysisKPI = {
  // 기존 필드 유지
  avgPrice: number;
  totalQuantity: number;
  maxPrice: { value: number; date: string; grade: string };
  minPrice: { value: number; date: string; grade: string };
  tradingDays: number;
  // 신규 필드
  medianPrice: number;
  priceStdDev: number;
  priceCV: number; // coefficient of variation (%)
};
```

**계산 로직:**

- `calculateKPI()` 내부 루프에서 가격 배열 수집
- 루프 종료 후 표준편차, 중앙값 계산
- `KPIComparison.changes`에도 `medianPrice`, `priceStdDev`, `priceCV` 추가

### 1-2. 이동평균선 — 가격 추이 차트 오버레이

**변경 파일:**

- `src/utils/analysis/statistics.ts` — 신규 파일, 이동평균 계산 유틸
- `src/utils/analysis/index.ts` — export 추가
- `src/components/DataAnalysis/DataAnalysisChart/` 하위 D3 렌더링 훅 — 이동평균선 오버레이

**추가할 기능:**

| 이동평균 | 기간 | 용도      |
| -------- | ---- | --------- |
| 단기 MA  | 7일  | 최근 추세 |
| 중기 MA  | 14일 | 중기 추세 |

**구현 상세:**

```typescript
// statistics.ts
export type MovingAverageDatum = {
  date: string;
  gradeKey: string;
  ma7: number | null;
  ma14: number | null;
};

/**
 * 이동평균을 계산한다.
 * 단순이동평균(SMA) 사용.
 */
export const calculateMovingAverages = (
  data: WeeklyPriceDatum[],
  windows: number[]
): MovingAverageDatum[] => { ... };
```

**D3 렌더링:**

- 이동평균 라인을 점선(dashed)으로 차트 위에 오버레이
- 토글 버튼으로 MA 표시/숨김 제어
- 색상: 원본 등급 색상의 투명도(0.6) + 점선 스타일

### 1-3. 가격 분포 히스토그램

**신규 파일:**

- `src/utils/analysis/distribution.ts` — 분포 계산 유틸
- `src/components/DataAnalysis/PriceDistributionChart.tsx` — D3 히스토그램 컴포넌트

**기능:**

- 선택된 기간/등급의 가격을 구간(bin)으로 나누어 분포 시각화
- 등급별 색상으로 구분
- bin 개수: Sturges' rule (`1 + 3.322 * log10(n)`) 자동 계산

**구현 상세:**

```typescript
// distribution.ts
export type DistributionBin = {
  x0: number;          // bin 시작
  x1: number;          // bin 끝
  count: number;
  gradeKey: string;
};

export const calculatePriceDistribution = (
  data: WeeklyPriceDatum[],
  binCount?: number
): DistributionBin[] => { ... };
```

**DataAnalysis.tsx 배치:**

- 기존 산점도 행 아래, 테이블 위에 새 행 추가
- 전체 폭(12) 사용

---

## Phase 2: 시즌 요약 리포트

### 2-1. 리포트 데이터 생성

**신규 파일:**

- `src/utils/analysis/report.ts` — 리포트 데이터 생성 유틸

**생성할 인사이트:**

```typescript
export type SeasonReport = {
  period: { start: string; end: string };
  summary: {
    totalTradingDays: number;
    totalQuantityKg: number;
    totalAmountWon: number;
    avgPricePerKg: number;
  };
  gradeAnalysis: Array<{
    gradeKey: string;
    avgPrice: number;
    totalQuantity: number;
    priceChange: number | null; // 전년 대비 (%)
    quantityShare: number; // 거래량 점유율 (%)
  }>;
  regionAnalysis: Array<{
    region: string;
    avgPrice: number;
    totalQuantity: number;
    rank: number;
  }>;
  priceHighlights: {
    peakDate: string;
    peakPrice: number;
    peakGrade: string;
    troughDate: string;
    troughPrice: number;
    troughGrade: string;
  };
  volatility: {
    priceStdDev: number;
    priceCV: number;
    stableGrade: string; // CV가 가장 낮은 등급
    volatileGrade: string; // CV가 가장 높은 등급
  };
  yoyComparison: {
    avgPriceChange: number; // 전년 대비 평균가 변동 (%)
    quantityChange: number; // 전년 대비 거래량 변동 (%)
    tradingDaysChange: number;
  } | null;
  insights: string[]; // 자동 생성 텍스트 인사이트 배열
};
```

**자동 인사이트 생성 규칙:**

```typescript
/**
 * 조건 기반으로 인사이트 문장을 생성한다.
 */
export const generateInsights = (report: SeasonReport): string[] => {
  // 예시:
  // - 전년 대비 변동: "올해 평균 단가는 985,000원으로 전년 대비 12.3% 상승했습니다."
  // - 등급 점유율: "1등품이 전체 거래량의 35%를 차지하며 가장 많이 거래되었습니다."
  // - 변동성: "3등품(개산)의 가격 변동성이 가장 커 CV 45.2%를 기록했습니다."
  // - 지역: "경북 지역이 평균 단가 1,050,000원으로 가장 높은 시세를 형성했습니다."
  // - 피크: "10월 5일 1등품에서 최고가 1,500,000원이 기록되었습니다."
};
```

### 2-2. 리포트 UI 컴포넌트

**신규 파일:**

- `src/components/DataAnalysis/SeasonReport/index.tsx` — 리포트 섹션 메인
- `src/components/DataAnalysis/SeasonReport/ReportSummaryCard.tsx` — 요약 카드
- `src/components/DataAnalysis/SeasonReport/InsightsList.tsx` — 인사이트 목록
- `src/components/DataAnalysis/SeasonReport/GradeComparisonTable.tsx` — 등급별 비교 테이블

**레이아웃:**

```
┌────────────────────────────────────────────────────────┐
│ 📊 시즌 요약 리포트                        [PDF 내보내기] │
├─────────────┬──────────────┬───────────────────────────┤
│ 총 거래량    │ 총 거래금액   │ 평균 단가 (전년 대비 ▲%)  │
├─────────────┴──────────────┴───────────────────────────┤
│ 💡 주요 인사이트                                        │
│ • 올해 평균 단가는 985,000원으로 전년 대비 12.3% 상승     │
│ • 1등품이 전체 거래량의 35% 차지                         │
│ • 경북 지역이 최고 시세 형성                             │
│ • 10월 5일 1등품에서 최고가 1,500,000원 기록             │
├────────────────────────────────────────────────────────┤
│ 등급별 비교                                             │
│ ┌───────┬─────────┬────────┬──────────┬──────────────┐ │
│ │ 등급   │ 평균단가 │ 거래량  │ 점유율   │ 전년 대비    │ │
│ │ 1등품  │ 98만원  │ 500kg  │ 35%     │ ▲12%        │ │
│ │ ...   │ ...    │ ...    │ ...     │ ...         │ │
│ └───────┴─────────┴────────┴──────────┴──────────────┘ │
└────────────────────────────────────────────────────────┘
```

**DataAnalysis.tsx 배치:**

- KPI 섹션 아래, 차트 섹션 위에 삽입
- Accordion (접기/펼치기) 형태로 기본 접힌 상태

---

## 구현 진행 현황

| Task | 내용 | 상태 |
|------|------|------|
| Task 1 | KPI 확장 (변동성 지표) | ✅ 완료 |
| Task 2 | 이동평균선 오버레이 | ✅ 완료 |
| Task 3 | 가격 분포 히스토그램 | ✅ 완료 |
| Task 4 | 시즌 리포트 데이터 생성 | ✅ 완료 |
| Task 5 | 시즌 리포트 UI | ✅ 완료 |

---

## 구현 순서 (Task 단위)

### Task 1: KPI 확장 (변동성 지표) ✅

1. `kpi.ts` — `AnalysisKPI` 타입에 `medianPrice`, `priceStdDev`, `priceCV` 추가
2. `kpi.ts` — `calculateKPI()` 에서 가격 배열 수집 후 통계 계산
3. `kpi.ts` — `KPIComparison.changes`에 신규 필드 추가
4. `AnalysisKPI.tsx` — `interface` → `type` 컨벤션 수정, 카드 2행 레이아웃으로 분리 (1행: 기존 5개 `md:2.4`, 2행: 변동성 3개 `md:4`), 각 KPI 설명 텍스트 추가 (모바일 고려하여 툴팁 대신 항상 표시)
5. 테스트: `src/utils/__tests__/kpi.test.ts` — 6개 케이스 전체 통과

### Task 2: 이동평균선

1. `src/utils/analysis/statistics.ts` 생성 — SMA 계산 함수
2. `src/utils/analysis/index.ts` — export 추가
3. `DataAnalysis.tsx` — `useMemo`로 이동평균 계산
4. D3 차트 훅에 이동평균 라인 오버레이 추가
5. 토글 UI (MA 표시/숨김)
6. 테스트: `src/utils/__tests__/statistics.test.ts`

**알려진 문제 (별도 Task 예정):**
- 다중 지역/조합 선택 시 이동평균선이 지역·등급 조합별로 각각 그려져 차트가 복잡해지고 가독성 저하
- 개선 방향: MA는 등급(gradeKey)별로만 집계하거나, 단일 지역/조합 선택 시에만 활성화하는 UX 처리 필요

### Task 3: 가격 분포 히스토그램

1. `src/utils/analysis/distribution.ts` 생성 — 분포 계산
2. `src/components/DataAnalysis/PriceDistributionChart.tsx` — D3 히스토그램
3. `DataAnalysis.tsx` — `useMemo` + 레이아웃 배치
4. 테스트: `src/utils/__tests__/distribution.test.ts`

### Task 4: 시즌 리포트 데이터 생성

1. `src/utils/analysis/report.ts` 생성 — `generateSeasonReport()`, `generateInsights()`
2. 테스트: `src/utils/__tests__/report.test.ts`

### Task 5: 시즌 리포트 UI

1. `src/components/DataAnalysis/SeasonReport/` 디렉터리 생성
2. `index.tsx` — 리포트 섹션 메인 (Accordion)
3. `ReportSummaryCard.tsx` — 요약 카드
4. `InsightsList.tsx` — 인사이트 목록
5. `GradeComparisonTable.tsx` — 등급별 비교 테이블
6. `DataAnalysis.tsx` — 리포트 섹션 배치

---

## 기술 제약사항

CLAUDE.md의 규칙 및 코딩 컨벤션을 따른다.
