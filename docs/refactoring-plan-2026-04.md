# 컴포넌트 리팩터링 계획 (2026-04)

## 배경

- 기능 개선에 앞서 거대 컴포넌트/유틸 파일들을 분해해 유지보수성을 확보한다.
- **목표 라인 수: 파일당 300 라인 이하** (엄격한 상한이 아닌 희망치. 차트 draw 훅 등 불가피한 경우는 예외).
- 기존 단위 테스트(`chartUtils`, `tableUtils`, `analysisUtils`, `useSettingsStore`)는 그대로 통과해야 한다.
- 컴포넌트의 외부 동작/Props 시그니처는 변경하지 않는다. 내부 구현만 재배치한다.
- D3 차트는 계속 직접 구현. 래핑 라이브러리 도입 금지.

## 현황 (2026-04-15 기준)

| 파일                                                         | 라인 | 성격           |
| ------------------------------------------------------------ | ---- | -------------- |
| `utils/dataLoader.ts`                                        | 653  | 서비스 클래스  |
| `components/DataAnalysis/DataAnalysisChart.tsx`              | 508  | D3 차트        |
| `components/Dashboard/DashboardChartWeeklyPriceQuantity.tsx` | 504  | D3 차트        |
| `components/Dashboard/DashboardChartWeeklyToggle.tsx`        | 495  | D3 차트        |
| `utils/analysisUtils.ts`                                     | 482  | 순수 함수 모음 |
| `pages/Dashboard.tsx`                                        | 452  | 페이지 (혼재)  |
| `components/Dashboard/SeasonOffDashboard.tsx`                | 440  | 섹션 혼재      |
| `components/Dashboard/DashboardChartGradePerKg.tsx`          | 325  | D3 차트        |
| `components/GlobalNavbar.tsx`                                | 317  | 네비바 혼재    |
| `components/DataAnalysis/AnalysisFilters.tsx`                | 317  | 필터 폼        |
| `components/Dashboard/DashboardChartGradePerPrice.tsx`       | 314  | D3 차트        |

## 결정사항

- **진행 순서**: Phase 0 → 4 → 1 → 3 → 2 → 6 → 5 (위험도 오름차순)
- **300 라인은 소프트 타깃**. 초과해도 치명적이지 않음, 가능한 한 지킨다.
- `DashboardChartGradePerKg` / `DashboardChartGradePerPrice` 는 **통합하지 않고 각각 독립 분해**한다.
- 각 Phase 종료 시 `npm run lint`, `npm run build`, `vitest` 로 회귀 확인.
- Phase 단위로 커밋을 쪼개어 롤백 가능성 확보.

---

## Phase 0 — 공통 D3 헬퍼 추출

후속 차트 리팩터링의 기반. 차트 5개가 공통으로 반복하는 로직을 헬퍼로 뽑는다.

**신규 파일 (`src/utils/d3/`)**

- `useContainerSize.ts` — `ResizeObserver` 기반 width/height 훅. 현재 3개 차트에 중복되어 있음.
- `chartMargins.ts` — 모바일/데스크톱 margin + `isMobile` 계산. `chartUtils.getResponsiveSettings` 와 중복되는 부분은 단일화 검토.
- `dropShadowFilter.ts` — SVG `drop-shadow` filter defs 생성 헬퍼. 2개 차트가 같은 코드 반복.
- `timeAxisTicks.ts` — `DashboardChartWeeklyToggle` 의 스마트 tick 선택 로직 (7/31/92/200일 분기) 추출. 순수 함수라 vitest 추가 가능.
- `legendLayout.ts` — 범례 wrap 계산 + 아이템 렌더러. `DataAnalysisChart` 의 cursorX/cursorY 기반 wrap 로직을 일반화.

**기존 유지**

- `utils/d3Tooltip.ts`, `utils/chartUtils.ts` 는 현 위치에서 그대로 사용.

**리스크**

- 낮음. 신규 파일만 추가하며 기존 컴포넌트는 수정하지 않음.

---

## Phase 4 — `utils/analysisUtils.ts` 분해 (482 → 파일당 ≤ 200)

이미 내부가 섹션별로 정리되어 있어 분리가 용이. **공개 API 경로를 보존**하기 위해 배럴 사용.

```
utils/analysis/
  filters.ts       // applyFilters, AnalysisFilters type
  kpi.ts           // calculateKPI, calculateKPIComparison, AnalysisKPI, KPIComparison
  breakdown.ts     // calculateGradeBreakdown, GradeBreakdown
  scatter.ts       // transformToScatterData, ScatterDatum
  region.ts        // calculateRegionComparison
  dateRange.ts     // getDefaultDateRange, generateDateRange, isMushroomSeason,
                   // isDateInRange, getComparisonDateRange, isSameDate, getDateOnly
  convert.ts       // convertAuctionRecordToRaw, transformToChartData
  index.ts         // 재수출
```

- 기존 `utils/analysisUtils.ts` 는 `export * from "./analysis";` 한 줄만 남기거나 삭제 후 import 경로를 정리한다.
- `utils/__tests__/analysisUtils.test.ts` (722 라인) 는 수정하지 않는다. 필요 시 import 경로만 갱신.

**리스크**

- 중간. 호출처가 많다. 배럴 유지 시 체감 리스크는 작음.

---

## Phase 1 — 차트 컴포넌트 리팩터링 (5개 파일)

각 차트를 아래 구조로 분해. Phase 0 헬퍼를 최대한 활용.

```
components/<Area>/<ChartName>/
  index.tsx           // props, JSX, 훅 호출 (~80 라인)
  useDraw<Name>.ts    // D3 draw 로직 (~180 라인)
  seriesBuilder.ts    // 데이터 그룹핑/정렬 (~60 라인, 순수 함수)
```

### 1.1 `DashboardChartWeeklyToggle`

- `useDrawWeeklyToggle` + `timeAxisTicks`(공통) + `legendLayout` 활용
- `chartMode` 상태는 컨테이너 컴포넌트에 유지

### 1.2 `DashboardChartWeeklyPriceQuantity`

- `useDrawPriceQuantity` 훅
- `priceQuantityScales.ts` — 이중 Y축 스케일 계산 분리

### 1.3 `DataAnalysisChart`

- **연도별 서브플롯 구조는 반드시 유지** (CLAUDE.md 제약)
- `yearSubplot.ts` — 개별 서브플롯 draw 함수
- `gradeSortOrder.ts` — 등급 정렬 상수 (현재 두 곳에 중복)

### 1.4 `DashboardChartGradePerKg`

- `useDrawGradeBarKg` 훅으로 draw 분리
- gradient defs 생성부도 같이 이동

### 1.5 `DashboardChartGradePerPrice`

- 1.4 와 동일 패턴, 독립 파일 유지 (통합하지 않음)

**리스크**

- 중간. 시각적 회귀 가능. Phase 완료 후 Storybook / 브라우저 수동 확인.

---

## Phase 3 — `SeasonOffDashboard.tsx` 분해 (440 → ~80)

4개 시각 섹션 + fetch 가 혼재. 각 섹션을 파일로 분리.

- `hooks/useSeasonOffData.ts` — season/yearly manifest fetch + 파싱
- `components/Dashboard/SeasonOff/SeasonSummaryCards.tsx`
- `components/Dashboard/SeasonOff/YearlyTrendBars.tsx`
- `components/Dashboard/SeasonOff/MonthlyPatternList.tsx`
- `components/Dashboard/SeasonOff/RegionRankingList.tsx`
- `components/Dashboard/SeasonOffDashboard.tsx` — 레이아웃 shell 만 담당
- `types/seasonOff.ts` — `SeasonSummary`, `MonthlyPattern`, `RegionRanking`, `SeasonManifest`, `YearlyEntry`, `YearlyManifest` 이동

**리스크**

- 낮음. 섹션 간 결합도 낮음.

---

## Phase 2 — `pages/Dashboard.tsx` 분해 (452 → ~150)

현재 시즌 판정, 데이터 fetch, 지역 선택, 지역 브레이크다운 테이블, KPI, 차트 섹션이 한 파일에 몰려 있음.

- `hooks/useDashboardManifests.ts` — daily/weekly fetch + refresh (~60)
- `components/Dashboard/DashboardHeader.tsx` — 타이틀 + refresh + 지역 셀렉터 (~80)
- `components/Dashboard/RegionBreakdownTable.tsx` — `regionData` 테이블 전체 (~120)
- `components/Dashboard/DashboardKpiRow.tsx` — 4개 KPI 카드 (~60)
- `components/Dashboard/DashboardCharts.tsx` — 등급별 + 주간 차트 그리드 (~40)
- `utils/isInSeason.ts` — 함수 추출 (테스트 가능)

**리스크**

- 중간. 페이지 전체에 영향. Phase 완료 후 시즌 중/외 브라우저 수동 확인.

---

## Phase 6 — 나머지 소규모 정리

### 6.1 `GlobalNavbar.tsx` (317 → ~150)

- `components/Navbar/NavItems.tsx`
- `components/Navbar/DataDateBadge.tsx`
- `components/Navbar/RefreshButton.tsx`
- `components/Navbar/MobileDrawer.tsx`

### 6.2 `AnalysisFilters.tsx` (317 → ~200)

- `components/DataAnalysis/Filters/RegionSelect.tsx`
- `components/DataAnalysis/Filters/UnionSelect.tsx`
- `components/DataAnalysis/Filters/DateRangePicker.tsx`
- `components/DataAnalysis/Filters/ComparisonToggle.tsx`

**리스크**

- 낮음.

---

## Phase 5 — `utils/dataLoader.ts` 분해 (653 → ~250)

데이터 파이프라인 핵심이라 가장 마지막. 서비스 클래스는 유지하되 도우미를 외부로 추출.

- `dataLoader/versionCheck.ts` — `fetchServerVersion` (HEAD → Range → full 3단계)
- `dataLoader/validation.ts` — `validateLocalData`, `getLocalMetadata`
- `dataLoader/download.ts` — `downloadCompleteDataset` (스트리밍 + progress)
- `dataLoader/persistence.ts` — `saveToIndexedDB`, `performDatabaseReset`
- `dataLoader/aggregations.ts` — `queryByDateRange`, `getAggregatedData`
- `dataLoader/index.ts` — `DataLoaderService` 클래스 + 상태 관리 (~250)

**수동 QA 체크리스트 (Phase 5 종료 직후)**

1. 첫 방문 (IndexedDB 비움 후) → 전체 다운로드 진행률 확인
2. 재방문 (최신) → 빠른 경로로 초기화 완료
3. 재방문 (로컬 오래됨) → 서버 버전 체크 후 유지
4. Force update → DB 리셋 후 재다운로드
5. 오프라인 → 로컬 데이터 사용
6. 수동 새로고침 (`softRefresh`) → 새 버전 감지 시 reload, 동일 시 idle 복귀

**리스크**

- 높음. 회귀 시 앱 초기화가 깨질 수 있음. 가장 마지막에 수행.

---

## 진행 상태 (2026-04-17 갱신)

- [x] Phase 0 — 공통 D3 헬퍼 추출 ✅
  - `src/utils/d3/` 하위 5개 헬퍼 + `__tests__/` 완료
- [x] Phase 4 — `analysisUtils.ts` 분해 ✅
  - `src/utils/analysis/` 하위 8개 모듈 + 배럴 완료. 원본은 `export * from "./analysis"` 한 줄로 축소
- [x] Phase 1 — 차트 컴포넌트 리팩터링 ✅ (5/5 완료)
  - [x] 1.1 `DashboardChartWeeklyToggle` → 폴더 분해 완료 (`index.tsx`, `useDrawWeeklyToggle.ts`, `seriesBuilder.ts`)
  - [x] 1.2 `DashboardChartWeeklyPriceQuantity` → 폴더 분해 완료 (`index.tsx`, `useDrawPriceQuantity.ts`, `seriesBuilder.ts`)
  - [x] 1.3 `DataAnalysisChart` → 폴더 분해 완료 (`index.tsx`, `useDrawAnalysisChart.ts`, `seriesBuilder.ts`)
  - [x] 1.4 `DashboardChartGradePerKg` → 폴더 분해 완료 (`index.tsx`, `useDrawGradeBarKg.ts`, `chartHelpers.ts`)
  - [x] 1.5 `DashboardChartGradePerPrice` → 폴더 분해 완료 (`index.tsx`, `useDrawGradeBarPrice.ts`, `chartHelpers.ts`)
- [ ] Phase 3 — `SeasonOffDashboard` 분해
- [ ] Phase 2 — `Dashboard` 페이지 분해
- [ ] Phase 6 — Navbar / AnalysisFilters 정리
- [ ] Phase 5 — `dataLoader` 분해
