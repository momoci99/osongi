# 필터 UX 개선 — 일반/고급 필터 분리

## Context

데이터 분석 페이지(`src/pages/DataAnalysis.tsx`) 우측 드로어 + FAB 구조 사용성 부족. 단순 시세 조회(날짜·등급)에도 FAB 클릭 → 드로어 열기 필요. 드로어 열면 우측 300px 차지로 차트 레이아웃 이동.

자주 쓰는 필터(프리셋·날짜·등급) 상단 노출, 심층 분석용(지역·조합·비교)은 모달로 분리. FAB는 모바일에서만 유지.

---

## 필터 분류

| 구분 | 필터 | 위치 |
|------|------|------|
| 일반 | 프리셋 칩, 날짜 범위, 등급 | 상단 인라인 바 |
| 고급 | 지역, 조합, 비교 모드 | 모달 다이얼로그 |

---

## 변경 파일

### 신규
- `src/components/DataAnalysis/InlineFilterBar.tsx` — 상단 일반 필터 바
  - `PresetChips` 재사용 (기존 `src/components/DataAnalysis/Filters/PresetChips.tsx`)
  - `DateRangePicker` 재사용 (기존 `src/components/DataAnalysis/Filters/DateRangePicker.tsx`, `direction="row"`)
  - 등급 다중선택 — 기존 `FilterControls.tsx:60-101` Grade Select 로직 추출/재사용
  - 우측에 "고급 필터" 버튼 + 활성 카운트 뱃지
- `src/components/DataAnalysis/AdvancedFilterDialog.tsx` — 고급 필터 모달
  - MUI `Dialog` (maxWidth="sm", fullWidth, mobile fullScreen)
  - `RegionSelect` 재사용 (`src/components/DataAnalysis/Filters/RegionSelect.tsx`)
  - `UnionSelect` 재사용 (`src/components/DataAnalysis/Filters/UnionSelect.tsx`)
  - `ComparisonToggle` 재사용 (`src/components/DataAnalysis/Filters/ComparisonToggle.tsx`)
  - 푸터: 초기화 + 닫기 버튼

### 수정
- `src/pages/DataAnalysis.tsx`
  - `FilterDrawer` import 제거
  - FAB 로직: 데스크톱 제거. 모바일(`isMobile === true`)에서만 렌더, 클릭 시 `AdvancedFilterDialog` 오픈
  - `FILTER_FAB_SEEN_KEY` localStorage 로직 제거 (extended 변형 불필요)
  - `marginRight: drawerOpen ? FILTER_DRAWER.WIDTH` 제거 — 레이아웃 시프트 없음
  - 상단 헤더 아래에 `<InlineFilterBar />` 배치
  - `<AdvancedFilterDialog />` 추가
  - `ActiveFilterSummary` 위치 유지 (상단 요약은 그대로)
- `src/stores/useAnalysisFilterStore.ts`
  - `drawerOpen` / `toggleDrawer` / `setDrawerOpen` → `advancedDialogOpen` / `toggleAdvancedDialog` / `setAdvancedDialogOpen`로 명명 변경
  - persist 마이그레이션 키 동일 유지 (drawerOpen → advancedDialogOpen 매핑 또는 새 키)

### 제거 (또는 deprecate)
- `src/components/DataAnalysis/FilterDrawer.tsx` — 삭제
- `src/components/DataAnalysis/FilterControls.tsx` — InlineFilterBar/AdvancedFilterDialog로 분리 후 삭제 검토 (vertical/horizontal 레이아웃 분기 불필요해짐)
- `src/const/Numbers.ts:25-27` `FILTER_DRAWER.WIDTH` 사용처 정리

---

## 레이아웃 (데스크톱)

```
┌──────────────────────────────────────────────┐
│ 데이터 분석                                  │
│ 필터를 조합하여...                            │
├──────────────────────────────────────────────┤
│ [올해시즌] [작년] [최근30일] [1등품만]  ...  │  ← PresetChips
│ 시작일 ─ 종료일    등급 [▼ 1,2,3,등외]  [고급▼]│  ← DateRange + Grade + Advanced
├──────────────────────────────────────────────┤
│ 활성 필터: [지역×3] [조합×2] [비교 ON]      │  ← ActiveFilterSummary
├──────────────────────────────────────────────┤
│ KPI · 차트 · 테이블 ...                      │
└──────────────────────────────────────────────┘
```

모바일: InlineFilterBar 압축 (프리셋 가로 스크롤 + 날짜만, 등급은 고급 모달로 이동 검토 또는 그대로 유지). FAB → 고급 필터 모달.

---

## 모달 구조

```
┌─ 고급 필터 ─────────────────┐
│ 지역  [▼ 다중선택]          │
│ 조합  [▼ 지역 종속 다중]    │
│ ─────────────────────────── │
│ 비교 모드  [Switch]          │
│   [올해 vs 작년] [지난주]... │
│   비교 시작 ─ 비교 종료      │
├─────────────────────────────┤
│ [초기화]            [닫기]  │
└─────────────────────────────┘
```

---

## 검증

1. `npm run dev` 실행 → `/data-analysis` 진입
2. 데스크톱:
   - FAB 미노출 확인
   - 상단 프리셋 칩 클릭 → 날짜/필터 변경 반영
   - 날짜 변경 → 데이터 재로드
   - 등급 다중선택 → 차트 업데이트
   - "고급 필터" 버튼 → 모달 오픈, 지역/조합/비교 조작 가능
   - 모달 닫기 → 필터 적용 유지
   - 초기화 → 기본값 복원
3. 모바일 (DevTools 반응형):
   - FAB 표시 확인
   - 클릭 시 고급 필터 모달(fullScreen) 오픈
   - 상단 InlineFilterBar 가로 스크롤/줄바꿈 정상
4. localStorage:
   - 새로고침 후 필터 상태 영속화 확인 (`osongi-analysis-filters`)
5. 테스트:
   - `npm run test` — 기존 필터 관련 테스트 업데이트 (FilterDrawer 테스트 제거, InlineFilterBar/AdvancedFilterDialog 추가)
   - `npm run lint`
   - `npm run build`
6. 접근성:
   - 키보드 Tab 순서: 프리셋 → 날짜 → 등급 → 고급 버튼
   - 모달 ESC로 닫기 동작
   - aria-label 확인

---

## 재사용 컴포넌트 정리

| 컴포넌트 | 경로 | 신규 사용처 |
|----------|------|-------------|
| PresetChips | `src/components/DataAnalysis/Filters/PresetChips.tsx` | InlineFilterBar |
| DateRangePicker | `src/components/DataAnalysis/Filters/DateRangePicker.tsx` | InlineFilterBar (`direction="row"`) |
| RegionSelect | `src/components/DataAnalysis/Filters/RegionSelect.tsx` | AdvancedFilterDialog |
| UnionSelect | `src/components/DataAnalysis/Filters/UnionSelect.tsx` | AdvancedFilterDialog |
| ComparisonToggle | `src/components/DataAnalysis/Filters/ComparisonToggle.tsx` | AdvancedFilterDialog |
| ActiveFilterSummary | `src/components/DataAnalysis/Filters/ActiveFilterSummary.tsx` | DataAnalysis (위치 유지) |

신규 코드 최소화. 기존 필터 하위 컴포넌트 모두 재사용.
