# 통계 지표 강화 + 시즌 리포트 — 상세 구현 명세

> **연관 문서**: [`impl-statistics-enhancement.md`](./impl-statistics-enhancement.md) (기획 개요)
>
> 이 문서는 기획 문서를 기반으로 실제 파일·함수·타입 수준의 구현 명세를 기술한다.

---

## 현재 코드베이스 파악

### 핵심 파일 경로

| 역할 | 경로 |
|---|---|
| KPI 계산 유틸 | `src/utils/analysis/kpi.ts` |
| 분석 유틸 re-export | `src/utils/analysis/index.ts` → `src/utils/analysisUtils.ts` |
| KPI UI 컴포넌트 | `src/components/DataAnalysis/AnalysisKPI.tsx` |
| 차트 D3 훅 | `src/components/DataAnalysis/DataAnalysisChart/useDrawAnalysisChart.ts` |
| 차트 시리즈 빌더 | `src/components/DataAnalysis/DataAnalysisChart/seriesBuilder.ts` |
| 메인 데이터 분석 페이지 | `src/pages/DataAnalysis.tsx` |
| 테스트 픽스처 | `src/utils/__tests__/fixtures.ts` |
| 기존 테스트 패턴 참고 | `src/utils/__tests__/analysisUtils.test.ts` |

### 현재 구조 제약 사항

- `calculateKPI()`는 단일 루프에서 가중평균·최대·최소만 계산. 가격 배열(`prices[]`) 수집 코드가 없어 표준편차·중앙값 추가를 위한 루프 수정이 필요하다.
- `AnalysisKPI.tsx`는 `interface AnalysisKPIProps` 사용 중 → 프로젝트 컨벤션(`type`)으로 수정 필요.
- `useDrawAnalysisChart.ts`는 연도별 서브플롯(year-based subplots) 구조. MA 오버레이는 `drawSubplot()` 내부에서 각 서브플롯 `<g>` 그룹에 추가해야 한다.
- `DataAnalysis.tsx`는 `useMemo` 패턴으로 파생 데이터를 관리. 신규 데이터도 동일 패턴으로 추가한다.

---

## Phase 1: 통계 지표 강화

### Task 1 — KPI 확장 (변동성 지표)

#### `src/utils/analysis/kpi.ts`

**타입 변경**

```typescript
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
  priceCV: number; // 변동계수 (%)
};

export type KPIComparison = {
  current: AnalysisKPI;
  previous: AnalysisKPI;
  changes: {
    avgPrice: number;
    totalQuantity: number;
    maxPrice: number;
    minPrice: number;
    tradingDays: number;
    // 신규 필드
    medianPrice: number;
    priceStdDev: number;
    priceCV: number;
  };
};
```

**`calculateKPI()` 수정 내용**

루프 내에서 `prices: number[]` 배열을 수집한다 (`quantity > 0 && unitPrice > 0` 조건 동일).

루프 종료 후 계산:
- **중앙값**: `prices.sort((a, b) => a - b)` 후 중간 인덱스. 짝수 개수면 두 중간값의 평균.
- **표준편차**: `√(Σ(xi - avgPrice)² / n)` — 가중평균(`avgPrice`)을 기준으로 계산.
- **변동계수**: `avgPrice > 0 ? (priceStdDev / avgPrice) * 100 : 0`

**`calculateKPIComparison()` 수정 내용**

`changes` 객체에 `medianPrice`, `priceStdDev`, `priceCV` 필드 추가 (동일한 `pctChange` 헬퍼 사용).

---

#### `src/components/DataAnalysis/AnalysisKPI.tsx`

1. `interface AnalysisKPIProps` → `type AnalysisKPIProps` 변경.
2. `comparison?.changes` 타입에 신규 3개 필드 포함.
3. KPI 카드 5개 → 8개 (중앙값·표준편차·변동계수 추가):
   - Grid `md: 2.4` → `md: 1.5` (8열 균등 배치)
   - **중앙값**: `${kpi.medianPrice.toLocaleString()}원`
   - **표준편차**: `±${kpi.priceStdDev.toLocaleString()}원`
   - **변동계수**: `${kpi.priceCV.toFixed(1)}%` (값이 높을수록 가격 불안정)
4. `ChangeIndicator`를 named export로 분리 (`export const ChangeIndicator`) — Task 5의 `GradeComparisonTable`에서 재사용.

---

#### 테스트: `src/utils/__tests__/kpi.test.ts` (신규)

| 케이스 | 검증 내용 |
|---|---|
| 정상 데이터 (홀수 개) | `medianPrice` 정확한 중간값 |
| 정상 데이터 (짝수 개) | `medianPrice` 두 중간값의 평균 |
| 단일 데이터 포인트 | `priceStdDev === 0`, `priceCV === 0` |
| 빈 데이터 (`[]`) | 모든 신규 필드 === 0, 오류 없음 |
| `calculateKPIComparison` | `changes.medianPrice` 변동률 정확성 |

---

### Task 2 — 이동평균선 오버레이

#### `src/utils/analysis/statistics.ts` (신규)

```typescript
import type { WeeklyPriceDatum } from "../../types/data";

export type MovingAverageDatum = {
  date: string;
  gradeKey: string;
  region: string;
  ma7: number | null;
  ma14: number | null;
};

/**
 * 등급+지역별 단순이동평균(SMA)을 계산한다.
 * 데이터 포인트가 window 수보다 적으면 해당 값을 null로 반환한다.
 */
export const calculateMovingAverages = (
  data: WeeklyPriceDatum[],
  windows: number[] = [7, 14]
): MovingAverageDatum[] => { ... };
```

구현 상세:
1. `data`를 `${gradeKey}__${region}` 복합 키로 그룹화 (`Map` 사용).
2. 각 그룹을 날짜 오름차순 정렬.
3. 각 인덱스 `i`에서 `windows` 배열의 각 `w`에 대해:
   - `i < w - 1`이면 `null`
   - 그렇지 않으면 `data[i - w + 1 .. i]`의 `unitPriceWon` 평균
4. 결과를 `MovingAverageDatum[]`으로 반환.

#### `src/utils/analysis/index.ts`

```typescript
export * from "./statistics";
```

#### `src/pages/DataAnalysis.tsx`

```typescript
// 추가 import
import { calculateMovingAverages } from "../utils/analysisUtils";

// 추가 상태
const [showMA, setShowMA] = useState(false);

// 추가 useMemo
const maData = useMemo(
  () => calculateMovingAverages(chartData),
  [chartData]
);

// ChartSection props 추가
<ChartSection
  ...
  maData={maData}
  showMA={showMA}
  onToggleMA={() => setShowMA((prev) => !prev)}
/>
```

#### `src/components/DataAnalysis/ChartSection.tsx`

- `maData`, `showMA`, `onToggleMA` props 추가.
- 차트 모드 토글 버튼 옆에 "이동평균" 토글 버튼 추가 (`showMA` 상태에 따라 `variant="contained"` / `"outlined"` 전환).
- `DataAnalysisChart`에 `maData`, `showMA` props 전달.

#### `src/components/DataAnalysis/DataAnalysisChart/index.tsx`

- `maData: MovingAverageDatum[]`, `showMA: boolean` props 받아 `useDrawAnalysisChart`로 전달.

#### `src/components/DataAnalysis/DataAnalysisChart/useDrawAnalysisChart.ts`

- `UseDrawAnalysisChartParams`에 `maData`, `showMA` 추가.
- `drawSubplot()` 시그니처에 `maData`, `showMA` 추가.
- `drawSeriesLineAndPoints()` 호출 루프 **이후** `drawMAOverlay()` 호출.

```typescript
/** 이동평균선을 서브플롯에 오버레이한다. */
const drawMAOverlay = ({
  subplotGroup, maData, year, xScale, globalYScale, colorScale, showMA, isMobile
}: DrawMAOverlayParams) => {
  if (!showMA) return;

  // 해당 연도 데이터만 필터링
  // gradeKey+region 별로 그룹화
  // ma7 → stroke-dasharray: "4,3", opacity: 0.55, stroke-width: 1
  // ma14 → stroke-dasharray: "8,4", opacity: 0.55, stroke-width: 1
  // null 값은 라인 끊김 처리 (d3.line().defined())
};
```

---

#### 테스트: `src/utils/__tests__/statistics.test.ts` (신규)

| 케이스 | 검증 내용 |
|---|---|
| window=7, 데이터 6개 | 모든 `ma7 === null` |
| window=7, 데이터 7개 | 마지막 항목 `ma7 === 평균` |
| window=14, 충분한 데이터 | 정확한 SMA 값 |
| 서로 다른 gradeKey+region | 그룹별 독립 계산 (교차 오염 없음) |

---

### Task 3 — 가격 분포 히스토그램

#### `src/utils/analysis/distribution.ts` (신규)

```typescript
import type { WeeklyPriceDatum } from "../../types/data";

export type DistributionBin = {
  x0: number;
  x1: number;
  count: number;
  gradeKey: string;
};

/**
 * Sturges' rule로 bin 수를 결정하고 등급별 가격 분포를 계산한다.
 */
export const calculatePriceDistribution = (
  data: WeeklyPriceDatum[],
  binCount?: number
): DistributionBin[] => { ... };
```

구현 상세:
1. 전체 가격 범위(`d3.extent`) 계산.
2. bin 수: `binCount ?? Math.ceil(1 + 3.322 * Math.log10(n))` (n = 전체 데이터 수).
3. `d3.bin().domain(extent).thresholds(binCount)` 생성.
4. 등급별로 분리하여 각각 bin 적용 → `DistributionBin[]` 생성.
5. 전 등급 결과를 합산하여 반환.

#### `src/utils/analysis/index.ts`

```typescript
export * from "./distribution";
```

#### `src/components/DataAnalysis/PriceDistributionChart.tsx` (신규)

```typescript
type PriceDistributionChartProps = {
  data: DistributionBin[];
  loading?: boolean;
};

const PriceDistributionChart = ({ data, loading }: PriceDistributionChartProps) => { ... };
```

D3 구현 상세:
- `useContainerSize` 훅으로 반응형 width 감지.
- X축: 가격대 (`d3.scaleLinear`, `원` 단위 포맷).
- Y축: 빈도 수.
- 등급별 색상: `getGradeColorMap(theme)` 재사용.
- 툴팁: `${x0.toLocaleString()}원 ~ ${x1.toLocaleString()}원 / ${gradeLabel} / ${count}건`.
- 300줄 이하 유지 — D3 렌더 로직은 별도 `useDrawDistributionChart` 훅으로 분리.

#### `src/pages/DataAnalysis.tsx`

```typescript
// 추가 import
import { calculatePriceDistribution } from "../utils/analysisUtils";
import PriceDistributionChart from "../components/DataAnalysis/PriceDistributionChart";

// 추가 useMemo
const distributionData = useMemo(
  () => calculatePriceDistribution(chartData),
  [chartData]
);

// 레이아웃 — 산점도 행 아래, TableSection 위에 삽입
<Grid container spacing={2} sx={{ mb: 2.5 }}>
  <Grid size={{ xs: 12 }}>
    <PriceDistributionChart data={distributionData} loading={loading} />
  </Grid>
</Grid>
```

---

#### 테스트: `src/utils/__tests__/distribution.test.ts` (신규)

| 케이스 | 검증 내용 |
|---|---|
| 빈 데이터 | 빈 배열 반환, 오류 없음 |
| n=10 | `binCount === ceil(1 + 3.322 * log10(10)) === 5` |
| 특정 가격 데이터 | bin 경계·count 정확성 |
| 복수 등급 | 등급별 분리 검증 |

---

## Phase 2: 시즌 리포트

### Task 4 — 시즌 리포트 데이터 생성

#### `src/utils/analysis/report.ts` (신규)

```typescript
import type { WeeklyPriceDatum } from "../../types/data";
import { calculateKPI, calculateRegionComparison, calculateGradeBreakdown } from "./kpi";

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
    priceChange: number | null; // 전년 대비 (%), null이면 비교 데이터 없음
    quantityShare: number;      // 거래량 점유율 (%)
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
    stableGrade: string;   // CV 최저 등급
    volatileGrade: string; // CV 최고 등급
  };
  yoyComparison: {
    avgPriceChange: number;
    quantityChange: number;
    tradingDaysChange: number;
  } | null;
  insights: string[];
};

/**
 * 필터링된 차트 데이터를 기반으로 시즌 리포트를 생성한다.
 * comparisonData가 없으면 yoyComparison은 null이 된다.
 */
export const generateSeasonReport = (
  data: WeeklyPriceDatum[],
  comparisonData: WeeklyPriceDatum[] | null,
  selectedGrades: string[]
): SeasonReport => { ... };

/**
 * SeasonReport를 기반으로 조건 기반 인사이트 문장을 생성한다. (최대 5개)
 */
export const generateInsights = (report: SeasonReport): string[] => {
  // 생성 조건:
  // 1. 전년 대비 가격 변동 — |avgPriceChange| >= 5% 일 때
  // 2. 최다 거래 등급 점유율
  // 3. 최고가 날짜·등급
  // 4. 가장 불안정한 등급 (volatileGrade + CV 값)
  // 5. 최고 평균가 지역
};
```

**재사용 기존 유틸**:
- `calculateKPI()` → `summary.avgPricePerKg`, `tradingDays`, `priceHighlights`
- `calculateRegionComparison()` → `regionAnalysis`
- `calculateGradeBreakdown()` → `gradeAnalysis.quantityShare`

#### `src/utils/analysis/index.ts`

```typescript
export * from "./report";
```

---

#### 테스트: `src/utils/__tests__/report.test.ts` (신규)

| 케이스 | 검증 내용 |
|---|---|
| 정상 데이터, 비교 없음 | `yoyComparison === null`, `insights.length > 0` |
| 정상 데이터 + 비교 데이터 | `yoyComparison` 필드 정확성 |
| 빈 데이터 | 기본값 반환, 오류 없음 |
| `generateInsights` | 가격 변동 < 5% → 해당 인사이트 미생성 |

---

### Task 5 — 시즌 리포트 UI

#### `src/components/DataAnalysis/SeasonReport/ReportSummaryCard.tsx` (신규)

```typescript
type ReportSummaryCardProps = {
  summary: SeasonReport["summary"];
  yoyComparison: SeasonReport["yoyComparison"];
};
```

- MUI `Grid` 3열 배치: 총 거래량 / 총 거래금액 / 평균단가.
- 평균단가 카드에 `ChangeIndicator` (전년 대비 `yoyComparison.avgPriceChange`) 표시.

#### `src/components/DataAnalysis/SeasonReport/InsightsList.tsx` (신규)

```typescript
type InsightsListProps = {
  insights: string[];
};
```

- `insights` 배열을 `•` 불릿 목록으로 렌더링.
- 빈 배열이면 `"분석할 데이터가 부족합니다"` 표시.

#### `src/components/DataAnalysis/SeasonReport/GradeComparisonTable.tsx` (신규)

```typescript
type GradeComparisonTableProps = {
  gradeAnalysis: SeasonReport["gradeAnalysis"];
};
```

- MUI `Table` (`size="small"`).
- 컬럼: 등급 / 평균단가 / 거래량 / 점유율 / 전년 대비.
- 전년 대비 셀: `ChangeIndicator` 재사용 (`AnalysisKPI.tsx`에서 named export).
- `priceChange === null`이면 "—" 표시.

#### `src/components/DataAnalysis/SeasonReport/index.tsx` (신규)

```typescript
type SeasonReportSectionProps = {
  report: SeasonReport | null;
  loading?: boolean;
};
```

- MUI `Accordion` — 기본 `expanded={false}`.
- `AccordionSummary`: "시즌 요약 리포트" 텍스트 + PDF 내보내기 버튼 (UI 표시만, 기능 추후).
- `AccordionDetails`: `ReportSummaryCard` → `InsightsList` → `GradeComparisonTable` 순.
- `loading === true`이면 스켈레톤 표시.
- `report === null`이면 Accordion 비활성화.

#### `src/pages/DataAnalysis.tsx`

```typescript
// 추가 import
import { generateSeasonReport } from "../utils/analysisUtils";
import SeasonReportSection from "../components/DataAnalysis/SeasonReport";

// 추가 useMemo
const comparisonChartData = useMemo(() => {
  if (!filters.comparisonEnabled || filteredComparisonData.length === 0) return null;
  return transformToChartData(filteredComparisonData, filters.grades);
}, [filteredComparisonData, filters]);

const seasonReport = useMemo(
  () => generateSeasonReport(chartData, comparisonChartData, filters.grades),
  [chartData, comparisonChartData, filters.grades]
);

// 레이아웃 — KPI 섹션 아래, 가격 추이 Grid 위에 삽입
<SeasonReportSection report={seasonReport} loading={loading} />
```

---

## 구현 순서 및 검증

### 순서

```
Task 1 (KPI 확장)
  → Task 2 (이동평균)
    → Task 3 (히스토그램)
      → Task 4 (리포트 데이터)
        → Task 5 (리포트 UI)
```

각 Task 완료 후 실행:
```bash
npm run lint
npm run build
```

### 최종 테스트

```bash
npx vitest run \
  src/utils/__tests__/kpi.test.ts \
  src/utils/__tests__/statistics.test.ts \
  src/utils/__tests__/distribution.test.ts \
  src/utils/__tests__/report.test.ts
```

### 브라우저 검증 항목

```bash
npm run dev
```

1. 데이터 분석 페이지 → 필터 적용 후 KPI 8개 카드 확인 (중앙값·표준편차·변동계수 포함)
2. "이동평균" 토글 버튼 클릭 → 차트 위 점선 오버레이 표시/숨김
3. 가격 분포 히스토그램 — 등급별 색상 및 툴팁 동작
4. "시즌 요약 리포트" Accordion 열기 → 인사이트 문장 및 등급 테이블 확인
5. 비교 기간 활성화 → 전년 대비 변동률(▲▼) 표시 확인

---

## 구현 진행 현황

| Task | 내용 | 상태 | 완료일 |
|------|------|------|--------|
| Task 1 | KPI 확장 (변동성 지표) | ✅ 완료 | 2026-04-19 |
| Task 2 | 이동평균선 오버레이 | ✅ 완료 | 2026-04-19 |
| Task 3 | 가격 분포 히스토그램 | ✅ 완료 | 2026-04-19 |
| Task 4 | 시즌 리포트 데이터 생성 | ✅ 완료 | 2026-04-19 |
| Task 5 | 시즌 리포트 UI | ✅ 완료 | 2026-04-19 |

### 주요 생성 파일

| 파일 | 설명 |
|------|------|
| `src/utils/analysis/kpi.ts` | `medianPrice`, `priceStdDev`, `priceCV` 추가 |
| `src/utils/analysis/statistics.ts` | `calculateMovingAverages()` SMA 계산 |
| `src/utils/analysis/distribution.ts` | `calculatePriceDistribution()` Sturges rule 기반 |
| `src/utils/analysis/report.ts` | `generateSeasonReport()`, `generateInsights()` |
| `src/components/DataAnalysis/AnalysisKPI.tsx` | KPI 카드 8개, `ChangeIndicator` named export |
| `src/components/DataAnalysis/ChartSection.tsx` | MA 토글 버튼 |
| `src/components/DataAnalysis/PriceDistributionChart.tsx` | D3 스택 히스토그램 |
| `src/components/DataAnalysis/SeasonReport/index.tsx` | Accordion 시즌 리포트 |
| `src/components/DataAnalysis/SeasonReport/ReportSummaryCard.tsx` | 요약 지표 카드 3개 |
| `src/components/DataAnalysis/SeasonReport/InsightsList.tsx` | 인사이트 불릿 목록 |
| `src/components/DataAnalysis/SeasonReport/GradeComparisonTable.tsx` | 등급별 비교 테이블 |
| `src/utils/__tests__/kpi.test.ts` | KPI 계산 단위 테스트 |
| `src/utils/__tests__/statistics.test.ts` | 이동평균 단위 테스트 |
| `src/utils/__tests__/distribution.test.ts` | 분포 계산 단위 테스트 (8개) |
| `src/utils/__tests__/report.test.ts` | 시즌 리포트 단위 테스트 |

### 알려진 이슈

- 다중 지역/조합 선택 시 이동평균선이 지역·등급 조합별로 각각 그려져 가독성 저하 (별도 개선 필요)

---

## 코딩 컨벤션 체크리스트

- [x] 타입 정의: `interface` 대신 `type` 사용
- [x] 컴포넌트: 화살표 함수 선언 (`const Foo = () => {}`)
- [x] export: `export default`를 파일 끝에 위치
- [x] 주석: JSDoc (`/** */`), `// ===` 구분선 금지
- [x] 컴포넌트 길이: 300줄 이하 (초과 시 훅/서브컴포넌트 분리)
- [x] 차트: D3.js 직접 구현 (래핑 라이브러리 금지)
