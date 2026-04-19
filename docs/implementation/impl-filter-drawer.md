# 데이터 분석 필터 사이드 Drawer 전환

> 데이터 분석 페이지의 필터 UI를 상단 인라인 배치에서 사이드/하단 Drawer로 전환하여,
> 필터 조건 변경과 차트/데이터 변화를 동시에 확인할 수 있도록 개선한다.

**상태: ✅ 구현 완료**

---

## 목적

현재 필터가 페이지 최상단에 위치하여 조건 변경 시 스크롤을 올려야 하고,
차트나 데이터 변화를 실시간으로 확인하기 어렵다.
사이드 Drawer로 이동하면 필터 조작과 시각화 확인을 동시에 수행할 수 있다.

## 완료 기준

- [x] Desktop(md↑): persistent Drawer(300px)가 우측에 열리고, 메인 콘텐츠가 자동으로 좌측으로 밀림
- [x] Mobile(md↓): SwipeableDrawer(하단 Bottom Sheet)로 열리며, 전체 너비 사용, 스와이프/외부 클릭으로 닫힘
- [x] FAB 버튼(`FilterListIcon`)으로 Drawer 토글 가능. Drawer 열려있으면 FAB 숨김
- [x] Drawer 닫혀있어도 `ActiveFilterSummary` Chip이 메인 영역 상단에 표시되어 현재 필터 상태 확인 가능
- [x] Drawer 열림 상태가 localStorage에 영속화되어 새로고침 시 사용자 선호 유지
- [x] Dark mode / Light mode 양쪽에서 정상 렌더링
- [x] 모바일 가로 스크롤 없음

## 변경 파일 목록

| 파일                                                       | 변경 유형                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/stores/useAnalysisFilterStore.ts`                     | 수정 — `drawerOpen` 상태 및 토글 액션 추가                         |
| `src/components/DataAnalysis/FilterControls.tsx`           | **신규** — 필터 입력 UI 추출 (vertical/horizontal layout 지원)     |
| `src/components/DataAnalysis/FilterDrawer.tsx`             | **신규** — Drawer 래퍼 (Desktop: persistent, Mobile: Bottom Sheet) |
| `src/components/DataAnalysis/AnalysisFilters.tsx`          | 수정 — FilterControls 재사용으로 리팩토링                          |
| `src/components/DataAnalysis/Filters/DateRangePicker.tsx`  | 수정 — `direction` prop 추가 (row/column)                          |
| `src/components/DataAnalysis/Filters/ComparisonToggle.tsx` | 수정 — `dateDirection` prop 추가                                   |
| `src/pages/DataAnalysis.tsx`                               | 수정 — 레이아웃 변경, FAB 추가, overflow 제어                      |
| `src/const/Numbers.ts`                                     | 수정 — `FILTER_DRAWER.WIDTH` 상수 추가                             |
| `src/stores/__tests__/useAnalysisFilterStore.test.ts`      | 수정 — `drawerOpen` 관련 테스트 3개 추가                           |

---

## 구현 세부사항

### 1. `useAnalysisFilterStore.ts` — Drawer 상태 추가

기존 zustand store에 `drawerOpen` 필드를 추가한다. `persist` 대상에 포함하여 새로고침 시에도 유지한다.

```typescript
// 추가할 상태 및 액션
type AnalysisFilterState = {
  // ... 기존 필드
  drawerOpen: boolean;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
};
```

- 기본값: `true` (Desktop에서 첫 진입 시 Drawer 열림)
- `toggleDrawer()`: `set((s) => ({ drawerOpen: !s.drawerOpen }))`

### 2. `FilterControls.tsx` — 필터 입력 UI 추출 (신규)

`AnalysisFilters.tsx`의 Grid 내부 필터 입력부를 독립 컴포넌트로 추출한다.

```typescript
type FilterControlsProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  onResetFilters: () => void;
  layout: "vertical" | "horizontal";
};
```

**포함 요소:**

- `RegionSelect` — 지역 다중 선택
- `UnionSelect` — 조합 다중 선택 (availableUnions 내부 계산)
- Grade `FormControl` — 등급 다중 선택
- `DateRangePickerField` — 기간 선택
- `ComparisonToggle` — 비교 모드
- `Snackbar` — 조합 자동 해제 알림
- availableUnions 계산 로직 (`REGION_UNION_MAP` 기반)

**layout 분기:**

- `"horizontal"`: 기존 Grid 2열 배치 (현재 AnalysisFilters의 레이아웃)
- `"vertical"`: Stack 세로 배치 (Drawer 내부용, 각 필터 간 `spacing={2}`)

### 3. `FilterDrawer.tsx` — Drawer 래퍼 (신규)

```typescript
type FilterDrawerProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  onResetFilters: () => void;
  open: boolean;
  onClose: () => void;
};
```

**레이아웃 구조:**

```
┌─────────────────────┐
│ 필터    [X 닫기버튼] │  ← 상단 고정
├─────────────────────┤
│ <FilterControls     │  ← 스크롤 가능 영역
│   layout="vertical" │
│   ...props />       │
│                     │
│                     │
├─────────────────────┤
│      [초기화]       │  ← 하단 sticky
└─────────────────────┘
```

**반응형 분기:**

- `useMediaQuery(theme.breakpoints.down("md"))` → **SwipeableDrawer `anchor="bottom"`** (Bottom Sheet)
  - 전체 화면 너비, `maxHeight: 85vh`, 둥근 상단 모서리(16px)
  - 상단 드래그 핸들(Puller) 포함
  - 스와이프 또는 외부 탭으로 닫기 가능
- 그 외 → `Drawer variant="persistent"`, `anchor="right"`, width `300px`

**Desktop Drawer Paper 스타일:**

```typescript
PaperProps={{
  sx: {
    width: FILTER_DRAWER.WIDTH,
    bgcolor: theme.palette.background.paper,
    borderLeft: `1px solid ${theme.palette.divider}`,
  },
}}
```

기존 `src/components/Navbar/MobileDrawer.tsx`의 Drawer 패턴을 참고한다.

### 3-1. `DateRangePicker.tsx` — `direction` prop 추가

```typescript
type DateRangePickerFieldProps = {
  // ... 기존 props
  direction?: "row" | "column"; // 기본값 "row"
};
```

- vertical layout(Bottom Sheet/Drawer)에서 `direction="column"` 전달 → DatePicker 2개 세로 배치
- horizontal layout에서는 기존 가로 배치 유지

### 3-2. `ComparisonToggle.tsx` — `dateDirection` prop 추가

```typescript
type ComparisonToggleProps = {
  // ... 기존 props
  dateDirection?: "row" | "column"; // 기본값 "row"
};
```

- `dateDirection="column"` 시 비교 DatePicker도 세로 배치 + `minWidth` 제거

### 4. `AnalysisFilters.tsx` — 리팩토링

내부 Grid 필터 영역을 `<FilterControls layout="horizontal" />` 호출로 대체한다.
`SectionCard` 래퍼, 타이틀, 모바일 접기/열기 토글, `ActiveFilterSummary`는 유지.

> 이 컴포넌트 자체는 당장 사용하지 않게 되지만, 삭제하지 않고 유지한다.
> 향후 다른 페이지에서 인라인 필터가 필요할 때 재사용 가능.

### 5. `DataAnalysis.tsx` — 페이지 레이아웃 변경

**변경 전:**

```
<Container>
  <AnalysisFiltersComponent />    ← 상단 인라인
  <KPI />
  <Charts />
  <Table />
</Container>
```

**변경 후:**

```tsx
<Box sx={{ display: "flex", overflow: "hidden" }}>
  <Box
    component="main"
    sx={{
      flexGrow: 1,
      minWidth: 0,
      transition: "margin 225ms cubic-bezier(0, 0, 0.2, 1)",
      marginRight: drawerOpen && !isMobile ? `${FILTER_DRAWER.WIDTH}px` : 0,
    }}
  >
    <Container maxWidth="xl">
      <헤더 />
      <ActiveFilterSummary /> ← Drawer 외부에 독립 배치
      <KPI />
      <Charts />
      <Table />
    </Container>
  </Box>
  <FilterDrawer />
</Box>;

{
  !drawerOpen && (
    <Fab
      color="primary"
      sx={{ position: "fixed", bottom: 24, right: 24 }}
      onClick={toggleDrawer}
    >
      <FilterListIcon />
    </Fab>
  );
}
```

**핵심 변경점:**

- `AnalysisFiltersComponent` 제거 → `FilterDrawer` + 독립 `ActiveFilterSummary`로 대체
- `Container`를 `Box(flex)` 안으로 이동
- `marginRight` transition으로 Drawer 열림/닫힘 시 부드러운 레이아웃 전환
- FAB는 Drawer가 닫혀있을 때만 표시
- `minWidth: 0` + `overflow: "hidden"` — flex 자식의 콘텐츠 넘침 방지 (모바일 가로 스크롤 해결)

---

## 검증

1. `npm run build` — 타입 에러 없이 빌드 성공 ✅
2. `npm run lint` — 에러 0 (기존 warning만 유지) ✅
3. `npm run test` — 197개 전체 통과 (drawerOpen 테스트 3개 포함) ✅
4. 수동 검증:
   - Desktop: Drawer 열린 상태에서 필터 변경 → 차트 즉시 반영
   - Desktop: Drawer 닫기 → FAB 표시, 메인 콘텐츠 전체 너비 확장
   - Mobile: FAB → Bottom Sheet(하단 시트) 올라옴 → 스와이프/외부 탭으로 닫힘
   - Mobile: DatePicker 세로 배치로 입력 공간 충분
   - Mobile: 가로 스크롤 없음
   - Dark / Light mode 양쪽 렌더링
   - 새로고침 후 Drawer 열림 상태 유지 확인

## 설계 결정

- **FilterControls 추출**: Drawer와 AnalysisFilters 양쪽에서 재사용 가능하도록 분리
- **persistent vs Bottom Sheet**: `md` breakpoint 기준 — Desktop은 persistent Drawer, Mobile은 SwipeableDrawer(anchor=bottom)로 전체 너비 활용
- **Drawer 너비 300px**: Select/DatePicker 최소 요구 사이즈(~280px) 고려. `FILTER_DRAWER.WIDTH` 상수로 관리
- **Bottom Sheet 최대 높이 85vh**: 상단 컨텍스트를 일부 유지하면서 충분한 필터 공간 제공
- **DatePicker direction prop**: vertical layout에서 `direction="column"`으로 세로 배치 → 모바일 입력 공간 최대화
- **Store persist**: `drawerOpen`을 localStorage에 저장하여 사용자 선호 유지
- **FAB 아이콘**: `FilterListIcon` 사용 (MUI 표준 패턴)
- **가로 스크롤 방지**: `minWidth: 0` + `overflow: "hidden"` — flex 자식의 콘텐츠 넘침 방지

## 제외 범위

- 필터 로직 변경 (기존 필터링 동작 그대로 유지)
- 새 필터 항목 추가
- `filter-review-2026-04-19.md`에서 지적된 데이터 불일치(예청/예천, 의성 등) 수정
