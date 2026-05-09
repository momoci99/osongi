# 필터 UX 개선 — 상세 구현 계획

> 상위 설계: [`filter-ux-redesign.md`](./filter-ux-redesign.md)

---

## 1. 개요

### 목표
- 일반 필터(프리셋·날짜·등급) → 페이지 상단 인라인 바
- 고급 필터(지역·조합·비교) → 모달 다이얼로그
- FAB → 모바일 한정, 고급 필터 모달 트리거

### 비목표
- 필터 데이터 구조(`AnalysisFilters`) 변경 없음
- 필터 적용 로직(`applyFilters`) 변경 없음
- 차트/테이블 컴포넌트 변경 없음

---

## 2. 작업 순서 (단계별)

### Phase 1 — 스토어 리팩터링
**파일:** `src/stores/useAnalysisFilterStore.ts`

변경:
- `drawerOpen` → `advancedDialogOpen` (boolean, 기본값 `false`)
- `toggleDrawer` → `toggleAdvancedDialog`
- `setDrawerOpen` → `setAdvancedDialogOpen`
- 영속 키(`name`)는 `osongi-analysis-filters` 유지

마이그레이션:
- `partialize`로 dialog open 상태는 영속화 제외 (페이지 진입 시 항상 닫힘)
  ```ts
  persist(..., {
    name: "osongi-analysis-filters",
    partialize: (state) => ({ filters: state.filters }),
    storage: { ... },
  })
  ```

테스트 업데이트:
- `src/stores/__tests__/useAnalysisFilterStore.test.ts`
- `drawerOpen` describe → `advancedDialogOpen`로 명명 변경
- 기본값 단언: `true` → `false`
- 메서드 호출명 변경

### Phase 2 — 일반 필터 컴포넌트 신규 작성
**신규 파일:** `src/components/DataAnalysis/InlineFilterBar.tsx`

Props:
```ts
type InlineFilterBarProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  onOpenAdvanced: () => void;
  advancedActiveCount: number;
};
```

구조:
```tsx
<Paper sx={{ p: 2, mb: 2.5 }} variant="outlined">
  <Stack spacing={1.5}>
    <PresetChips filters={filters} onApply={onFiltersChange} />
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <DateRangePickerField ... direction="row" />
      </Box>
      <Box sx={{ minWidth: 200 }}>
        {/* 등급 Select (FilterControls에서 추출) */}
      </Box>
      <Button
        variant="outlined"
        startIcon={<TuneIcon />}
        onClick={onOpenAdvanced}
      >
        고급 필터
        {advancedActiveCount > 0 && <Badge badgeContent={advancedActiveCount} color="primary" />}
      </Button>
    </Stack>
  </Stack>
</Paper>
```

`advancedActiveCount` 계산 (호출자에서):
```ts
const count =
  filters.regions.length +
  filters.unions.length +
  (filters.comparisonEnabled ? 1 : 0);
```

### Phase 3 — 고급 필터 모달 신규 작성
**신규 파일:** `src/components/DataAnalysis/AdvancedFilterDialog.tsx`

Props:
```ts
type AdvancedFilterDialogProps = {
  open: boolean;
  onClose: () => void;
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  onResetAdvanced: () => void;
};
```

구조:
```tsx
<Dialog
  open={open}
  onClose={onClose}
  maxWidth="sm"
  fullWidth
  fullScreen={isMobile}
>
  <DialogTitle>고급 필터</DialogTitle>
  <DialogContent dividers>
    <Stack spacing={2.5}>
      <RegionSelect filters={...} onFiltersChange={handleFiltersChange} />
      <UnionSelect filters={...} onFiltersChange={onFiltersChange} availableUnions={...} />
      <Divider />
      <ComparisonToggle filters={...} onFiltersChange={onFiltersChange} dateDirection="column" />
    </Stack>
    {/* Snackbar (조합 자동 해제 알림) — FilterControls에서 이전 */}
  </DialogContent>
  <DialogActions>
    <Button onClick={onResetAdvanced}>고급 필터 초기화</Button>
    <Box sx={{ flex: 1 }} />
    <Button onClick={onClose} variant="contained">완료</Button>
  </DialogActions>
</Dialog>
```

`onResetAdvanced` 동작:
```ts
onFiltersChange({
  ...filters,
  regions: [],
  unions: [],
  comparisonEnabled: false,
  comparisonStartDate: null,
  comparisonEndDate: null,
});
```

조합 자동 해제 토스트:
- 기존 `FilterControls.tsx:35-45`의 `handleFiltersChange` 로직 그대로 이전
- `availableUnions` 계산도 동일 (`FilterControls.tsx:47-58`)

### Phase 4 — 페이지 통합
**파일:** `src/pages/DataAnalysis.tsx`

수정 항목:
1. import 변경
   - 제거: `Fab`, `FilterListIcon`, `TuneIcon`(FAB용), `FilterDrawer`, `FILTER_DRAWER`
   - 추가: `InlineFilterBar`, `AdvancedFilterDialog`
   - `Fab`은 모바일용으로 유지

2. 스토어 훅
   ```ts
   const { filters, setFilters, resetFilters, advancedDialogOpen, toggleAdvancedDialog, setAdvancedDialogOpen } =
     useAnalysisFilterStore();
   ```

3. FAB 관련 state 제거
   - `FILTER_FAB_SEEN_KEY` 제거
   - `isFilterFabExtended` state 제거
   - `handleFilterFabClick` 제거

4. 메인 박스 sx 단순화
   - `marginRight: drawerOpen && !isMobile ? FILTER_DRAWER.WIDTH : 0` 제거
   - `transition` 제거 (레이아웃 시프트 없음)

5. JSX 구조
   ```tsx
   <Container maxWidth="xl">
     <Box sx={{ py: 3 }}>
       <Typography variant="h4" ...>데이터 분석</Typography>
       <Typography variant="body2" ...>설명</Typography>

       <InlineFilterBar
         filters={filters}
         onFiltersChange={setFilters}
         onOpenAdvanced={() => setAdvancedDialogOpen(true)}
         advancedActiveCount={advancedActiveCount}
       />

       <Box sx={{ mb: 2.5 }}>
         <ActiveFilterSummary filters={filters} onFiltersChange={setFilters} />
       </Box>

       <AnalysisKPISection ... />
       {/* ... 나머지 동일 ... */}
     </Box>
   </Container>

   <AdvancedFilterDialog
     open={advancedDialogOpen}
     onClose={() => setAdvancedDialogOpen(false)}
     filters={filters}
     onFiltersChange={setFilters}
     onResetAdvanced={handleResetAdvanced}
   />

   {isMobile && (
     <Fab
       color="primary"
       onClick={() => setAdvancedDialogOpen(true)}
       aria-label="고급 필터 열기"
       sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1200 }}
     >
       <TuneIcon />
     </Fab>
   )}
   ```

6. `advancedActiveCount` 계산 (useMemo)
   ```ts
   const advancedActiveCount = useMemo(
     () =>
       filters.regions.length +
       filters.unions.length +
       (filters.comparisonEnabled ? 1 : 0),
     [filters.regions, filters.unions, filters.comparisonEnabled],
   );
   ```

### Phase 5 — 정리
**제거 파일:**
- `src/components/DataAnalysis/FilterDrawer.tsx`
- `src/components/DataAnalysis/FilterControls.tsx`
  - 등급 Select 로직은 `InlineFilterBar` 내부로 이전
  - 토스트/조합 정리 로직은 `AdvancedFilterDialog`로 이전
  - `RegionSelect`/`UnionSelect`/`ComparisonToggle`은 그대로 유지(다른 컴포넌트가 직접 import)

**수정 파일:**
- `src/const/Numbers.ts` — `FILTER_DRAWER.WIDTH` 미사용 시 항목 제거 (다른 사용처 grep 후 결정)

검색 명령:
```bash
grep -rn "FILTER_DRAWER" src/
grep -rn "FilterDrawer" src/
grep -rn "FilterControls" src/
```

---

## 3. 테스트 계획

### 3.1 스토어 테스트
**파일:** `src/stores/__tests__/useAnalysisFilterStore.test.ts`

- `drawerOpen` describe 블록 → `advancedDialogOpen`
- 기본값 `false` 단언으로 변경
- 메서드명 변경: `toggleDrawer` → `toggleAdvancedDialog`, `setDrawerOpen` → `setAdvancedDialogOpen`

### 3.2 신규 컴포넌트 테스트

**파일:** `src/components/DataAnalysis/__tests__/InlineFilterBar.test.tsx`
- 프리셋 칩 클릭 시 `onFiltersChange` 호출 확인
- 날짜 변경 시 `onFiltersChange` 호출 확인
- 등급 다중선택 동작
- "고급 필터" 버튼 클릭 시 `onOpenAdvanced` 호출
- `advancedActiveCount > 0`일 때 뱃지 표시

**파일:** `src/components/DataAnalysis/__tests__/AdvancedFilterDialog.test.tsx`
- `open=true`일 때 렌더 (지역/조합/비교 모드 노출)
- `open=false`일 때 미렌더
- 지역 선택 시 조합 옵션 갱신
- 지역 해제로 조합 자동 정리 시 토스트 노출
- 비교 토글 활성화 시 비교 날짜 필드 노출
- "고급 필터 초기화" 버튼 → 지역/조합/비교만 초기화 (날짜·등급 보존)
- "완료" 버튼 → `onClose` 호출

### 3.3 기존 테스트 유지
- `PresetChips.test.tsx` — 변경 없음
- `RegionSelect`, `UnionSelect`, `ComparisonToggle`, `DateRangePicker` — 변경 없음

### 3.4 검증 명령
```bash
npm run lint
npm run test
npm run build
```

---

## 4. 파일 변경 요약

| 작업 | 경로 |
|------|------|
| 신규 | `src/components/DataAnalysis/InlineFilterBar.tsx` |
| 신규 | `src/components/DataAnalysis/AdvancedFilterDialog.tsx` |
| 신규 | `src/components/DataAnalysis/__tests__/InlineFilterBar.test.tsx` |
| 신규 | `src/components/DataAnalysis/__tests__/AdvancedFilterDialog.test.tsx` |
| 수정 | `src/pages/DataAnalysis.tsx` |
| 수정 | `src/stores/useAnalysisFilterStore.ts` |
| 수정 | `src/stores/__tests__/useAnalysisFilterStore.test.ts` |
| 수정 | `src/const/Numbers.ts` (조건부) |
| 삭제 | `src/components/DataAnalysis/FilterDrawer.tsx` |
| 삭제 | `src/components/DataAnalysis/FilterControls.tsx` |

---

## 5. 컴포넌트 의존 관계

```
DataAnalysis (page)
├── InlineFilterBar
│   ├── PresetChips                  (existing)
│   ├── DateRangePickerField         (existing)
│   └── (등급 Select inline)
├── AdvancedFilterDialog
│   ├── RegionSelect                 (existing)
│   ├── UnionSelect                  (existing)
│   └── ComparisonToggle             (existing)
├── ActiveFilterSummary              (existing, 위치 유지)
└── Fab (mobile only)
```

---

## 6. UX 디테일

### 일반 필터 바
- 데스크톱: 1행 레이아웃 (날짜 ─ 등급 ─ [고급 필터])
- 모바일: 세로 스택 (프리셋 가로 스크롤 → 날짜 row → 등급 → [고급 필터] full-width)
- 프리셋 영역은 항상 첫 줄

### 고급 필터 모달
- 데스크톱: maxWidth="sm" (600px) 중앙 모달
- 모바일: `fullScreen={isMobile}` — 전체 화면, 상단 close 버튼
- ESC/백드롭 클릭으로 닫기
- "완료" 버튼은 변경 사항 자동 적용 후 닫기 (실시간 적용이므로 명시적 적용 불필요)

### 활성 카운트 뱃지
- 지역/조합 개수 + 비교 모드(1) 합산
- 0이면 비표시
- 9 초과 시 "9+"

### FAB (모바일)
- 단순 circular, TuneIcon
- 펄스 애니메이션 제거 (사용성 단순화)
- `aria-label="고급 필터 열기"`

---

## 7. 잠재 이슈 & 대응

| 이슈 | 대응 |
|------|------|
| 영속 스토어 마이그레이션 — 기존 `drawerOpen: true` 키가 localStorage에 저장됨 | `partialize`로 `filters`만 영속, dialog 상태 제외 → 자동 해결 |
| 등급 Select 추출 시 GRADE_OPTIONS, TEST_IDS import 누락 | InlineFilterBar에 동일 import 추가 |
| FilterDrawer 삭제 후 다른 import 잔존 | `grep "FilterDrawer"` 사후 확인 |
| 모달 fullScreen 모바일에서 close 버튼 미배치 | DialogTitle에 IconButton(CloseIcon) 우측 배치 |
| 비교 모드 활성화 시 모달이 길어짐 | DialogContent `dividers`로 스크롤 처리 |

---

## 8. 검증 체크리스트

- [ ] `npm run lint` 통과
- [ ] `npm run test` 통과
- [ ] `npm run build` 통과
- [ ] `npm run dev` — 데스크톱
  - [ ] 헤더 아래 InlineFilterBar 노출
  - [ ] FAB 미노출
  - [ ] 프리셋/날짜/등급 변경 시 데이터 갱신
  - [ ] "고급 필터" 클릭 → 모달 오픈
  - [ ] 지역 선택 시 조합 옵션 갱신
  - [ ] 지역 해제 시 조합 자동 정리 토스트
  - [ ] 비교 모드 ON → 비교 날짜 필드 노출
  - [ ] "고급 필터 초기화" → 지역/조합/비교만 초기화
  - [ ] "완료" → 모달 닫힘, 필터 유지
  - [ ] 활성 카운트 뱃지 표시
- [ ] DevTools 모바일 뷰
  - [ ] FAB 표시
  - [ ] FAB 클릭 → fullScreen 모달
  - [ ] InlineFilterBar 세로 스택 레이아웃
- [ ] localStorage
  - [ ] 새로고침 후 필터 영속화
  - [ ] 모달 상태는 영속화 X (항상 닫힘)
- [ ] 접근성
  - [ ] Tab 순서: 프리셋 → 날짜 → 등급 → 고급 버튼
  - [ ] 모달 ESC 닫기
  - [ ] aria-label 확인
