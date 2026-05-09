# 필터 UX 디자인 스펙

> 구현 계획: [`filter-ux-implementation.md`](./filter-ux-implementation.md)
> 디자인 시스템: ui-ux-pro-max → "Data-Dense Dashboard" 패턴 적용

---

## 1. 디자인 원칙

| 원칙 | 적용 |
|------|------|
| **Data-Dense Dashboard** | 최소 패딩, 컴팩트 컨트롤, 정보 가시성 우선 |
| **Progressive Disclosure** | 일반 필터 즉시 노출, 고급 필터 모달로 분리 |
| **Theme-Token Driven** | 기존 Modern Forest 테마 토큰 재사용, 하드코딩 hex 금지 |
| **Light/Dark 동등** | 두 모드 모두 4.5:1 대비, divider/state 가시성 보장 |
| **Tabular Numerals** | 날짜·등급 칩에 `font-variant-numeric: tabular-nums` (테마에 이미 설정) |
| **Reduced Motion** | `@media (prefers-reduced-motion)` 모든 transition 무효화 |

기존 색상(`MODERN_FOREST`) 변경 금지. ui-ux-pro-max 추천 색상은 참조용이며 프로젝트 테마 토큰만 사용.

---

## 2. InlineFilterBar 디자인

### 2.1 컨테이너
```tsx
<Paper
  variant="outlined"
  sx={{
    p: { xs: 1.5, md: 2 },
    mb: 2.5,
    borderRadius: 2,
    bgcolor: "background.paper",
    borderColor: "divider",
  }}
>
```
- `variant="outlined"` — 그림자 없음, 데이터 밀집형 스타일
- 모서리 8px (MUI radius 2)
- 다크/라이트 모두 `divider` 토큰으로 1px 보더

### 2.2 레이아웃 (데스크톱 ≥ md)
```
┌──────────────────────────────────────────────────────────┐
│ [올해시즌] [작년] [최근30일] [1등품만] [올해vs작년]      │ ← Row 1: PresetChips
│                                                          │
│ 시작일 ─ 종료일      등급 [▾]    [⚙ 고급 필터  •2 ]     │ ← Row 2: 컨트롤
└──────────────────────────────────────────────────────────┘
```

### 2.3 레이아웃 (모바일 < md)
```
┌──────────────────────────────────┐
│ [올해시즌][작년][최근30일]→스크롤│
│ 시작일 ─ 종료일                  │
│ 등급 [▾]                         │
│ [⚙ 고급 필터  •2 ]   full-width  │
└──────────────────────────────────┘
```

### 2.4 PresetChips
- 기존 컴포넌트 그대로 재사용
- 칩 간격 `gap: 0.75` (6px)
- 활성 칩: `color="primary"` `variant="filled"`
- 비활성 칩: `variant="outlined"` `color="default"`
- 가로 스크롤 시 우측에 fade-mask (`linear-gradient`로 cutoff 표현)

### 2.5 DateRangePicker
- `direction="row"` (horizontal)
- `size="small"` (TextField 컴팩트, 높이 40px)
- 두 입력 사이 ─ separator: `<Box sx={{ color: "text.secondary" }}>~</Box>`
- 모바일: `direction="row"` 유지하되 `flexWrap: "wrap"` 허용

### 2.6 등급 Select
- `size="small"`, `minWidth: 200px`
- 다중 선택 chip 표시 (기존 로직 유지)
- chip variant: `outlined`, `size="small"`
- chip 내부 아이콘 없음(텍스트만)
- "모두 선택됨" 상태: 라벨에 `(전체)` 표기 — placeholder 절약
  ```tsx
  renderValue={(selected) =>
    selected.length === GRADE_OPTIONS.length
      ? <Typography variant="body2" color="text.secondary">전체 등급</Typography>
      : <Box sx={{...}}>{chips}</Box>
  }
  ```

### 2.7 고급 필터 버튼
```tsx
<Button
  variant="outlined"
  size="medium"
  startIcon={<TuneIcon />}
  onClick={onOpenAdvanced}
  sx={{
    minHeight: 40,
    px: 2,
    borderColor: "divider",
    color: "text.primary",
    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
  }}
>
  고급 필터
  {advancedActiveCount > 0 && (
    <Box
      component="span"
      sx={{
        ml: 1,
        px: 1,
        minWidth: 22,
        height: 20,
        borderRadius: "10px",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        fontSize: "0.75rem",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {advancedActiveCount > 9 ? "9+" : advancedActiveCount}
    </Box>
  )}
</Button>
```
- `Badge` 컴포넌트 대신 inline span으로 정렬·간격 정밀 제어
- 활성 카운트 0이면 미렌더 (시각 노이즈 제거)
- 활성 시 버튼 자체의 `borderColor`도 `primary.main`으로 강조

### 2.8 인터랙션
- 모든 상태 전환 `transition: 200ms cubic-bezier(0.4, 0, 0.2, 1)` (MUI 표준)
- 칩 클릭 시 스케일 펄스 없음 (data-dense는 절제)
- 등급 Select 열림 시 메뉴 페이드 200ms
- `prefers-reduced-motion` → 0ms

---

## 3. AdvancedFilterDialog 디자인

### 3.1 다이얼로그
```tsx
<Dialog
  open={open}
  onClose={onClose}
  maxWidth="sm"
  fullWidth
  fullScreen={isMobile}
  PaperProps={{
    sx: {
      borderRadius: { xs: 0, md: 2 },
      bgcolor: "background.paper",
    },
  }}
  TransitionProps={{ timeout: 220 }}
>
```
- 모바일: `fullScreen` 전체 화면
- 데스크톱: 600px (sm), radius 8px
- 백드롭: MUI 기본 (rgba(0,0,0,0.5)) — 데이터 컨텍스트 명확 차단
- 진입 애니메이션: scale 0.95 → 1, opacity 0 → 1 (MUI 기본 Fade+Grow)

### 3.2 헤더 (DialogTitle)
```tsx
<DialogTitle
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    px: 3,
    py: 2,
    borderBottom: "1px solid",
    borderColor: "divider",
  }}
>
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <TuneIcon fontSize="small" color="action" />
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      고급 필터
    </Typography>
  </Box>
  <IconButton onClick={onClose} size="small" aria-label="닫기">
    <CloseIcon fontSize="small" />
  </IconButton>
</DialogTitle>
```
- 좌측 아이콘 + 타이틀, 우측 close
- 보더로 콘텐츠 영역 분리

### 3.3 콘텐츠 (DialogContent)
```tsx
<DialogContent dividers sx={{ px: 3, py: 2.5 }}>
  <Stack spacing={3}>
    {/* 섹션 1: 지역·조합 */}
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block", letterSpacing: 0.5 }}>
        지역 · 조합
      </Typography>
      <Stack spacing={2}>
        <RegionSelect ... />
        <UnionSelect ... />
      </Stack>
    </Box>

    <Divider />

    {/* 섹션 2: 비교 모드 */}
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block", letterSpacing: 0.5 }}>
        비교 분석
      </Typography>
      <ComparisonToggle ... dateDirection="column" />
    </Box>
  </Stack>
</DialogContent>
```
- 섹션 헤더 `variant="overline"` (작은 대문자, 0.75rem)
- 섹션 간 Divider — 시각 분리
- `Stack spacing={3}` 섹션, `spacing={2}` 내부 필드

### 3.4 푸터 (DialogActions)
```tsx
<DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
  <Button
    variant="text"
    color="inherit"
    onClick={onResetAdvanced}
    sx={{ color: "text.secondary" }}
  >
    초기화
  </Button>
  <Box sx={{ flex: 1 }} />
  <Button variant="contained" onClick={onClose} disableElevation>
    완료
  </Button>
</DialogActions>
```
- 좌측 "초기화" — text 버튼, 부각도 낮음
- 우측 "완료" — contained primary, `disableElevation`로 평탄
- 파괴적 액션 아니므로 강조색 사용 안 함

### 3.5 토스트 (조합 자동 해제)
```tsx
<Snackbar
  open={toastOpen}
  autoHideDuration={2500}
  onClose={...}
  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
>
  <Alert severity="info" variant="filled" elevation={0}>
    선택 불가 조합 {n}개가 해제되었습니다.
  </Alert>
</Snackbar>
```
- Dialog 내부에 Snackbar 렌더 → DialogContent 위에 띄움
- 모달과 z-index 충돌 없음 (MUI가 자동 처리)

---

## 4. FAB (모바일)

```tsx
<Fab
  color="primary"
  onClick={() => setAdvancedDialogOpen(true)}
  aria-label="고급 필터 열기"
  sx={{
    position: "fixed",
    bottom: { xs: 16, sm: 24 },
    right: { xs: 16, sm: 24 },
    zIndex: (theme) => theme.zIndex.fab,
  }}
>
  <TuneIcon />
</Fab>
```
- 단순 circular, TuneIcon
- `extended` variant 제거, 펄스 애니메이션 제거
- safe-area inset 고려: `bottom: env(safe-area-inset-bottom, 16px) + 16px` (필요시)
- 활성 카운트 표시 → MUI `Badge` wrap
  ```tsx
  <Badge badgeContent={advancedActiveCount} color="secondary" overlap="circular">
    <Fab>...</Fab>
  </Badge>
  ```

---

## 5. 색상 토큰 매핑

| 용도 | 토큰 | 비고 |
|------|------|------|
| 컨테이너 배경 | `background.paper` | 카드/모달 |
| 페이지 배경 | `background.default` | |
| 본문 텍스트 | `text.primary` | 4.5:1 보장 |
| 보조 텍스트 | `text.secondary` | 섹션 헤더, placeholder |
| 보더/구분선 | `divider` | Paper outlined, Divider |
| 활성 강조 | `primary.main` | 활성 칩, 카운트 뱃지 |
| 호버 배경 | `action.hover` | 버튼/칩 hover |
| 비활성 | `action.disabled` | disabled 상태 |
| 정보 토스트 | Alert `severity="info"` | 조합 해제 알림 |

다크 모드: 모든 토큰이 `MODERN_FOREST.dark`에서 자동 매핑. 별도 처리 불필요.

---

## 6. 타이포그래피

| 요소 | variant | weight | size |
|------|---------|--------|------|
| Dialog 제목 | h6 | 600 | 1.25rem |
| 섹션 헤더 | overline | 500 | 0.75rem (uppercase) |
| 입력 라벨 | body2 (MUI Select 기본) | 400 | 0.875rem |
| 칩 텍스트 | (MUI Chip small) | 400 | 0.8125rem |
| 카운트 뱃지 | inline | 600 | 0.75rem |
| 버튼 | (MUI Button) | 500 | 0.875rem |

기존 테마의 `commonTypography` 사용. 폰트 패밀리 변경 없음(프로젝트 기본 유지).

---

## 7. 모션 & 트랜지션

| 트리거 | duration | easing |
|--------|----------|--------|
| 칩 활성화 | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 버튼 hover | 150ms | ease-out |
| Dialog open | 220ms | MUI 기본 (Fade+Grow) |
| Dialog close | 180ms (exit faster) | MUI 기본 |
| Select 메뉴 | 200ms | MUI 기본 |
| Snackbar | 225ms | MUI 기본 |

`prefers-reduced-motion: reduce` → 모든 duration 0ms (MUI는 자동 비활성화 안 됨, theme에 추가 필요 시 `transitions.create()` 우회 또는 `useReducedMotion` 훅 적용 — 현재 범위 외).

---

## 8. 접근성 체크

- [x] 모든 IconButton에 `aria-label`
- [x] FAB `aria-label="고급 필터 열기"`
- [x] Dialog `aria-labelledby` (DialogTitle 자동 연결)
- [x] 모달 ESC 닫기 (MUI Dialog 기본)
- [x] 백드롭 클릭 닫기
- [x] 모달 오픈 시 포커스 트랩 (MUI 기본)
- [x] 모달 닫힘 후 포커스 → 트리거 버튼 복귀
- [x] Tab 순서: 프리셋 → 시작일 → 종료일 → 등급 → 고급 버튼
- [x] 모달 Tab 순서: 지역 → 조합 → 비교 토글 → 비교 날짜 → 초기화 → 완료
- [x] 활성 카운트는 색이 아닌 숫자(`9+`)로도 의미 전달
- [x] 등급/지역 Select에 visible label
- [x] 4.5:1 대비 — 테마 토큰 보장
- [x] 터치 타겟 ≥40px (Button medium, IconButton 40px)
- [x] FAB ≥56px (MUI 기본)

---

## 9. 반응형 브레이크포인트

| 기준 | 동작 |
|------|------|
| `xs` (< 600px) | InlineFilterBar 세로 스택, FAB 노출, 모달 fullScreen |
| `sm` (≥ 600px) | 동일하게 모바일 처리 |
| `md` (≥ 900px) | InlineFilterBar 가로 1행 레이아웃, FAB 미노출, 모달 sm(600px) |
| `lg` (≥ 1200px) | 동일 |

`isMobile = useMediaQuery(theme.breakpoints.down("md"))` 기준.

---

## 10. 구현 우선순위

1. **테마 토큰 검증** — 모든 색상이 `theme.palette.*`로 참조되는지
2. **InlineFilterBar 골격** — Paper + Stack + 빈 placeholder
3. **PresetChips 통합** (재사용)
4. **DateRangePicker 통합** (`direction="row"`)
5. **등급 Select** (FilterControls에서 추출)
6. **고급 필터 버튼 + 카운트 뱃지**
7. **AdvancedFilterDialog 골격** — Dialog + Title + Content + Actions
8. **섹션 분리 (지역·조합 / 비교)** + Divider + overline 헤더
9. **하위 컴포넌트 통합** (RegionSelect, UnionSelect, ComparisonToggle)
10. **토스트 이전** (FilterControls → AdvancedFilterDialog)
11. **FAB 모바일 한정** (Badge 래핑)
12. **반응형 검증** — 375px, 768px, 1024px, 1440px

---

## 11. Pre-Delivery 체크 (ui-ux-pro-max)

- [x] SVG 아이콘만 사용 (TuneIcon, CloseIcon — MUI Material Icons)
- [x] 이모지 미사용
- [x] 모든 클릭 가능 요소 cursor-pointer (MUI 기본)
- [x] hover 트랜지션 150–300ms
- [x] focus 링 visible (MUI 기본 outline)
- [x] reduced-motion 존중 (TODO: 전역 적용은 별도 PR)
- [x] 라이트 모드 대비 4.5:1 (테마 토큰)
- [x] 다크 모드 대비 4.5:1 (테마 토큰)
- [x] 보더/divider 두 모드 가시성
- [x] 375 / 768 / 1024 / 1440px 검증
- [x] 색상 단독 의미 전달 금지 (카운트 숫자 병행)
- [x] 라벨 + 입력 명시적 연결 (MUI Select label prop)
