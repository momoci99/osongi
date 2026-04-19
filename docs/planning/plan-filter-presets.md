# 필터 추천 프리셋 기능 구현 계획

## 개요

`FilterDrawer` 상단에 도메인 특화 프리셋 칩을 제공하여 사용자가 자주 쓰는 분석 패턴을 빠르게 적용할 수 있게 한다.

---

## 프리셋 목록

| ID | 레이블 | 조건 |
|---|---|---|
| `current-season` | 올해 시즌 전체 | 당해연도 8/1 ~ 11/30, 전체 등급/지역 |
| `last-season` | 작년 시즌 전체 | 전년도 8/1 ~ 11/30, 전체 등급/지역 |
| `recent-30days` | 최근 30일 | 오늘 기준 -29일 ~ 오늘 |
| `grade1-only` | 1등품만 | 날짜 유지, grades = `['grade1']` |
| `yoy-comparison` | 올해 vs 작년 비교 | 당해연도 8/1 ~ 11/30, comparisonEnabled=true, 비교기간=전년도 동기간 |

---

## 파일 구조

### 신규 생성

```
src/const/filterPresets.ts
  - 프리셋 타입 정의 (FilterPreset)
  - 프리셋 생성 함수 5개 (날짜를 런타임에 계산)
  - FILTER_PRESETS 배열 export

src/components/DataAnalysis/Filters/PresetChips.tsx
  - 프리셋 칩 목록 UI
  - 현재 filters와 일치하는 프리셋을 활성 상태로 표시
  - Props: filters, onApply(preset)

src/const/__tests__/filterPresets.test.ts
  - 각 프리셋 함수가 올바른 날짜/등급/비교 설정을 반환하는지 검증
```

### 수정

```
src/components/DataAnalysis/FilterDrawer.tsx
  - content 영역 상단에 <PresetChips> 추가
  - onFiltersChange를 preset apply 핸들러로 연결

src/components/DataAnalysis/Filters/PresetChips.test.tsx  (신규)
  - 칩 렌더링, 클릭 시 onApply 호출 검증
  - 활성 프리셋 하이라이트 검증
```

---

## 타입 설계

```ts
// src/const/filterPresets.ts

type FilterPreset = {
  id: string;
  label: string;
  /** 현재 filters를 받아 새 filters를 반환 */
  apply: (current: AnalysisFilters) => AnalysisFilters;
};
```

`apply`에 현재 `filters`를 주입하는 이유: `grade1-only` 프리셋처럼 날짜는 유지하고 일부 필드만 덮어써야 하는 경우가 있기 때문.

---

## UI 설계

```
FilterDrawer
├── Header (필터 제목 + 닫기 버튼)
├── Content
│   ├── [NEW] PresetChips          ← 칩 목록 (가로 스크롤)
│   ├── Divider
│   └── FilterControls             ← 기존 상세 필터
└── Footer (초기화 버튼)
```

`PresetChips` 칩 스타일:
- 비활성: MUI `Chip` variant="outlined"
- 활성(현재 필터와 일치): variant="filled", color="primary"
- 모바일에서 칩이 넘치면 가로 스크롤 (`overflowX: 'auto'`)

---

## 프리셋 활성화 판별 로직

날짜·등급·비교 설정을 비교하는 `isPresetActive(preset, filters)` 유틸 함수를 `filterPresets.ts`에 포함.  
날짜 비교는 `isSameDate`(기존 유틸) 활용.

---

## 테스트 범위

| 파일 | 테스트 항목 |
|---|---|
| `filterPresets.test.ts` | 각 프리셋이 올바른 날짜·등급·비교 값을 반환하는지 |
| `filterPresets.test.ts` | `isPresetActive`가 일치/불일치를 정확히 판별하는지 |
| `PresetChips.test.tsx` | 5개 칩이 렌더링되는지 |
| `PresetChips.test.tsx` | 칩 클릭 시 `onApply`가 올바른 preset으로 호출되는지 |
| `PresetChips.test.tsx` | 활성 프리셋 칩에 filled 스타일이 적용되는지 |

---

## 구현 순서

1. `src/const/filterPresets.ts` — 프리셋 정의 + `isPresetActive`
2. `src/const/__tests__/filterPresets.test.ts` — 단위 테스트
3. `src/components/DataAnalysis/Filters/PresetChips.tsx` — UI 컴포넌트
4. `src/components/DataAnalysis/Filters/PresetChips.test.tsx` — 컴포넌트 테스트
5. `src/components/DataAnalysis/FilterDrawer.tsx` — PresetChips 통합
