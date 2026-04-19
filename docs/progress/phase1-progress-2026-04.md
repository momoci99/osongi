# Phase 1 진행 기록 (2026년 4월)

`planning-review-2026-04.md`의 우선순위 1~3(모두 "낮음" 난이도)을 한 사이클로 묶어 처리한 Phase 1 작업 기록.

커밋: `0aefb9d feat: Phase 1 기본 품질 개선` (6 files changed, +404 / -33)

---

## 완료된 항목

### 1. 로딩 진행률 UI 연결

**기존 문제**: `DataInitializer.tsx`는 `<CircularProgress size={40} />`만 표시. `dataLoader`가 내부적으로 0~100% progress를 추적(다운로드 0~50%, IndexedDB 저장 50~100%)하고 있었지만 UI까지 연결이 안 돼 있었음.

**변경**:
- `src/components/DataInitializer.tsx` — LinearProgress로 교체, 단계 라벨("데이터 다운로드 중..." / "로컬 저장소에 반영 중...")과 % 표시
- `getLoadingPhaseLabel()` 헬퍼 추가 — progress 범위에 따라 적절한 문구 반환
- 에러 카드 스타일도 함께 정돈 (rounded corner, 테두리 컬러 통일)

### 2. 전역 에러 바운더리

**변경**:
- `src/components/ErrorBoundary.tsx` 신설 — React class 컴포넌트 기반 폴백 UI. `getDerivedStateFromError`로 state 전환, 폴백에서는 에러 메시지와 "새로고침" 버튼 제공
- `src/App.tsx` — `<ErrorBoundary>`로 트리 전체 래핑
- 비동기 에러(네트워크 등)는 ErrorBoundary가 잡지 못하므로 별도 처리 필요 — 이 부분이 스낵바 보류로 이어짐 (아래 참조)

### 3. 수동 데이터 새로고침

**기존 문제**: `dataLoader.forceUpdate()`가 존재했지만 이걸 호출하면 `isInitialized=false, isLoading=true`로 되어 **전체 로딩 화면으로 회귀**함. 사용자가 읽던 맥락을 통째로 날려서 "시즌 중 수시 확인" 니즈에 맞지 않음.

**변경**:
- `src/utils/dataLoader.ts`에 `softRefresh()` 메서드 추가
  - `isLoading`/`isInitialized`를 건드리지 않고 `isRefreshing` 별도 플래그로 관리
  - 전체 dataset을 다운로드한 뒤 로컬 `metadata.version`과 JSON 본문의 `version` 필드로 직접 비교
  - 일치하면 `{ updated: false }` 반환, 다르면 IDB에 저장 후 `{ updated: true }`
- `DataLoadingState`에 `isRefreshing: boolean`, `latestDataDate?: string` 필드 추가
- `src/hooks/useAuctionData.ts` — `softRefresh`를 hook의 반환값으로 노출
- `src/components/GlobalNavbar.tsx` — RefreshIcon 버튼 추가
  - 갱신 중이면 `CircularProgress` 스피너, 아니면 `RefreshIcon`
  - `updated=true`일 때는 즉시 `window.location.reload()` — 로딩 화면에서 새 데이터 자연스럽게 반영
  - `updated=false`일 때는 스피너가 돌아갔다 돌아오는 것만으로 피드백

**주의**: `fetchServerVersion`은 HTTP ETag/Last-Modified를 반환하지만 로컬 `metadata.version`은 JSON 본문의 ISO 타임스탬프라 네임스페이스가 다르다. 버전 비교는 반드시 다운로드 후 `dataset.version`으로 해야 매번 "업데이트 있음"으로 오판되지 않음. 이 함정은 pre-existing `initialize()` 경로에서도 존재하지만 "localAge < maxAge" 빠른 경로로 가려져 있었음.

### 4. 데이터 기준일 표시

**변경**:
- `DataLoadingState`에 `latestDataDate` 필드 추가 — `metadata.dateRangeLatest`(해당 dataset이 포함하는 가장 최근 auction 날짜)에서 채움
- `GlobalNavbar.tsx`에 고정 배지 — "● 기준 MM/DD" 형태, 툴팁에는 full date("2025-11-12")
- 전체 날짜("2025-11-12")는 모바일에서 좁으니 배지는 MM/DD만, 툴팁으로 보강
- 데스크톱에서만 표시(`display: { xs: "none", sm: "flex" }`)

---

## 검증

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 회귀 0건 (pre-existing 2건만 남음: `DataAnalysis.tsx:18`, `tableUtils.test.ts:8`) |
| `npm run lint` | ✅ 12 errors / 19 warnings 모두 pre-existing. 수정 후 오히려 1건 감소(unused `hasCompletedOnboarding` 제거분) |
| `npm run build` | ✅ 9.18s, 청크 사이즈 경고는 기존과 동일 |
| `npx vitest run` | ✅ 151/151 통과 (7 test files) |
| 브라우저 실동작 | ✅ 로딩 프로그레스, 기준일 배지, 새로고침 스피너, softRefresh "이미 최신" 처리 모두 확인 |

---

## 보류된 것: 전역 스낵바 알림

원래 Phase 1 범위에 "에러 UI(토스트)"가 포함돼 있었지만, MUI Snackbar와 React StrictMode의 조합이 예상 외로 깊은 이슈를 보여 **최소 구현으로 축소**하고 Phase 2 이후로 미뤘다.

### 겪은 증상 (순서대로 하나씩 고치면서 다음 증상이 나타남)

1. **초기 구현**: 스토어(`useSnackbarStore`)를 만들고 `<GlobalSnackbar>`를 App 루트에 마운트. 클릭 → `showSnackbar(...)` → 스낵바가 나타나야 하는데 **DOM에 아예 마운트되지 않음**.
2. **`key={current?.key}` 제거 후**: 스낵바가 mount는 되지만 onClose가 `reason=timeout`으로 **즉시** 발동(autoHideDuration 4000ms를 무시). StrictMode의 effect 중복 실행과 MUI Snackbar 내부 timer가 간섭.
3. **타이머 수동 관리로 전환**: `setTimeout`을 직접 관리했더니 실제로는 정확히 4002ms에 발동(performance.now 기반 측정). 하지만 Snackbar 자체가 DOM에 안 보임.
4. **Snackbar 버리고 고정 위치 `<Fade>` + `<Alert>`**: Alert는 DOM에 들어오지만 Fade enter 트랜지션이 걸리지 않아 `opacity: 0` 상태로 정지.
5. **Fade 제거, CSS keyframe으로 교체**: 이번엔 `mounted=true, visible=false` 초기 상태에서 "언마운트 effect"가 200ms 후 발동해 즉시 dismiss 되는 race condition.
6. **로직 극단 단순화 (`current` 있으면 그냥 렌더)**: 직접 콘솔에서 `window.__snackbarStore.getState().show(...)`를 부르면 정상 동작하지만, 클릭 핸들러의 `handleRefresh` 경로에서는 여전히 DOM에 반영되지 않음. React 구독/selector 재진입 쪽 문제로 추정되지만 원인 특정 실패.

### 내린 결정 (사용자 합의)

- `src/components/GlobalSnackbar.tsx`, `src/stores/useSnackbarStore.ts` 삭제
- 새로고침 버튼 피드백은 **스피너만**:
  - `isRefreshing=true` → `CircularProgress`
  - `isRefreshing=false` → `RefreshIcon`
  - `updated=true` → 즉시 `window.location.reload()` (새 로딩 화면이 피드백)
  - `updated=false` → 스피너가 스르륵 사라지는 것만으로 충분
  - 에러 → `console.error`만 (사용자는 스피너가 돌아갔다 돌아오는 것으로 "뭔가 해봤음"을 인지)

### Phase 2 이후 재검토 방향

- MUI Snackbar 디버그 재시도 대신 **검증된 외부 라이브러리** 도입(예: `react-hot-toast`, 번들 +~3KB)
- 또는 새로고침 버튼 옆에 작은 정적 텍스트("방금 갱신됨" / "2분 전 갱신") 고정 표시로 스낵바 의존 없애기

---

## 다음 Phase 후보

기획 문서 우선순위 기준:

| 순위 | 항목 | 난이도 | 비고 |
|------|------|--------|------|
| 4 | 비교 프리셋 (전년 동기 등) | 중간 | 데이터 분석 페이지 사용성 직접 개선 |
| 5 | 차트/테이블 내보내기 | 중간 | PNG/SVG/CSV. D3 SVG는 직렬화 쉬움 |
| 6 | 모바일 정보 우선순위 조정 | 중간 | |
| 7 | 알림 기능 | 높음 | 이 시점에 스낵바 인프라도 함께 정리 |

Phase 1의 basic quality 개선은 "들어올 수 있는 입구"를 다졌고, 다음 단계는 "머물 이유"를 만드는 쪽. 현 상태에서 **4(비교 프리셋)** 또는 **5(내보내기)**가 조합 관계자 니즈에 가장 직결된다. 재방문 동기 부여(7번 알림)까지 가려면 위 두 개로 먼저 "보고서에 쓸 수 있는 도구" 포지션을 확보한 뒤가 순서상 자연스럽다.

---

## 참고

- 원본 기획: `docs/planning-review-2026-04.md`
- 이 문서는 Phase 1 구현 후 회고·기록용. 향후 Phase 진행 시 유사한 포맷으로 별도 파일로 남길 것