# 오송이 프로젝트 테스트 코드 작성 계획

## Context

현재 프로젝트에 단위 테스트가 전무한 상태. Vitest가 설치되어 있지만 Storybook 브라우저 테스트 프로젝트만 구성되어 있고, 순수 유틸리티 함수와 비즈니스 로직에 대한 테스트가 없음. 핵심 비즈니스 로직(KPI 계산, 필터링, 데이터 변환)의 안정성 확보를 위해 단계적으로 테스트를 도입한다.

---

## Phase 0: Vitest 설정 및 인프라

### 0.1 `vite.config.ts` 수정
기존 `test.projects` 배열에 unit test 프로젝트 추가:

```ts
{
  extends: true,
  test: {
    name: "unit",
    include: ["src/**/*.test.ts"],
    environment: "jsdom",
    globals: true,
  },
},
```

### 0.2 `package.json` 스크립트 추가

```json
"test": "vitest run --project unit",
"test:watch": "vitest --project unit",
"test:coverage": "vitest run --project unit --coverage"
```

---

## Phase 1: 순수 유틸리티 함수 (최우선)

모킹 불필요, 핵심 비즈니스 로직. 총 ~100개 테스트 케이스.

### 1.0 공유 픽스처: `src/utils/__tests__/fixtures.ts`
- `createMockAuctionRecord(overrides?)` — MushroomAuctionDataRaw 기본값 팩토리
- `createMockWeeklyPriceDatum(overrides?)` — WeeklyPriceDatum 팩토리
- `createMockAuctionDBRecord(overrides?)` — AuctionRecord(DB 포맷) 팩토리
- `SAMPLE_GRADES`, `SAMPLE_ALL_GRADES` 상수

### 1.1 `src/utils/__tests__/analysisUtils.test.ts` (~55개 케이스)

| 함수 | 주요 테스트 |
|------|------------|
| `getDefaultDateRange()` | 시즌 중(8-12월) → 최근 7일, 시즌 외 → 작년 10/1-7. `vi.useFakeTimers()` 사용 |
| `generateDateRange()` | 3일 → 3개 Date, 같은 날 → 1개, start > end → 빈 배열 |
| `isMushroomSeason()` | 8월=true, 12월=true, 7월=false, 1월=false |
| `getDateOnly()` | 시간 제거 확인 |
| `isSameDate()` | 같은 날 다른 시간=true, 다른 날=false |
| `isDateInRange()` | 경계값(start/end 포함), 범위 밖, 시간 무시 |
| `applyFilters()` | 지역/조합/날짜 개별 필터, 복합 필터, 빈 필터=pass-through |
| `calculateKPI()` | 가중평균 계산, 빈 데이터=0, minPrice 초기값 처리 |
| `calculateKPIComparison()` | 변동률 계산, previous=0이면 change=0 |
| `calculateGradeBreakdown()` | 비중 합=1.0, 0수량 제외 |
| `transformToScatterData()` | 유효 데이터만 변환, quantity/unitPrice=0 제외 |
| `calculateRegionComparison()` | 가중평균, avgPrice 내림차순 정렬 |
| `getComparisonDateRange()` | 1년 전 동일 날짜 |
| `transformToChartData()` | 날짜순 정렬, 콤마 숫자 파싱, 중복 키 처리 |
| `convertAuctionRecordToRaw()` | 필드 매핑, 숫자→문자열 변환 |

### 1.2 `src/utils/__tests__/chartUtils.test.ts` (~28개 케이스)

| 함수 | 주요 테스트 |
|------|------------|
| `getGradeDashPattern()` | 6개 등급 패턴 매핑, 미지 키 → 기본값 |
| `getGradeColor()` | 인덱스 매핑, palette 길이 modulo |
| `getGradeColorMap/Array()` | `createAppTheme("light")` 사용하여 실제 테마 테스트 |
| `filterMushroomSeasonData()` | 시즌 내/외 필터링 |
| `groupDataByYear()` | 연도별 그룹화 |
| `createDataSeries()` | region-grade 복합키 그룹화, 색상 할당 |
| `getResponsiveSettings()` | 모바일(<768)/데스크톱 마진·폰트 |
| `calculateTickInterval()` | 기간별·디바이스별 간격 계산 |

### 1.3 `src/utils/__tests__/tableUtils.test.ts` (~16개 케이스)

| 함수 | 주요 테스트 |
|------|------------|
| `getGradeName()` | 6개 등급 한글명, 미지 키 → 키 반환 |
| `formatNumber()` | 천단위 구분자 |
| `formatPrice()` | "N원" 형식 |
| `transformToTableData()` | 날짜 내림차순, 등급순 정렬, 0값 제외, 콤마 파싱 |

---

## Phase 2: Zustand Store

### 2.1 `src/stores/__tests__/useSettingsStore.test.ts` (~14개 케이스)

| 항목 | 주요 테스트 |
|------|------------|
| 초기 상태 | themeMode="dark", myRegion=null, displayMode="default" |
| `toggleThemeMode()` | dark↔light 토글 |
| `setMyRegion()` | 지역 설정 시 myUnion=null 초기화 |
| `completeOnboarding()` | 플래그 true 설정 |
| `toggleDisplayMode()` | default↔large 토글 |

각 테스트 전 `useSettingsStore.setState()` 로 초기화.

---

## Phase 3: 커스텀 훅 (향후)

`@testing-library/react` 설치 필요. Phase 1-2 완료 후 진행.
- `useContainerSize` — ResizeObserver 모킹
- `useAuctionData` — dataLoader 모킹 (복잡도 높음)

---

## 파일 구조

```
src/
  utils/__tests__/
    fixtures.ts                 # 공유 테스트 데이터
    analysisUtils.test.ts       # ~55 케이스
    chartUtils.test.ts          # ~28 케이스
    tableUtils.test.ts          # ~16 케이스
  stores/__tests__/
    useSettingsStore.test.ts    # ~14 케이스
```

---

## 구현 순서

1. `vite.config.ts` + `package.json` 설정
2. `fixtures.ts` 공유 테스트 데이터
3. `analysisUtils.test.ts` (가장 많은 비즈니스 로직)
4. `tableUtils.test.ts`
5. `chartUtils.test.ts`
6. `useSettingsStore.test.ts`

---

## 기술 참고사항

- `getDefaultDateRange()` 테스트 시 `vi.useFakeTimers()` + `vi.setSystemTime()` 필수
- `chartUtils`의 테마 의존 함수는 `createAppTheme("light")` (`src/theme.ts`) 직접 import하여 테스트
- 한국어 `describe`/`it` 블록명 사용 (프로젝트 규칙)
- 타입 정의 시 `interface` 대신 `type` 사용 (프로젝트 규칙)
- `parseGradeData`는 private 함수 → `calculateKPI` 등을 통해 간접 테스트 (콤마 포함 문자열 데이터 사용)
- `loadDateData()`는 HTTP fetch 의존 → 단위 테스트 제외, E2E에서 커버

---

## 검증

각 테스트 파일 완성 후:
1. `npx vitest run --project unit` — 전체 패스 확인
2. `npx vitest run --project unit --coverage` — 대상 파일 90%+ 라인 커버리지
3. `npm run lint` — ESLint 통과
4. `npx vitest run --project storybook` — 기존 Storybook 테스트 회귀 없음 확인

---

## 수정 대상 파일

- `vite.config.ts` — unit test 프로젝트 추가
- `package.json` — test 스크립트 추가

## 새로 생성할 파일

- `src/utils/__tests__/fixtures.ts`
- `src/utils/__tests__/analysisUtils.test.ts`
- `src/utils/__tests__/chartUtils.test.ts`
- `src/utils/__tests__/tableUtils.test.ts`
- `src/stores/__tests__/useSettingsStore.test.ts`
