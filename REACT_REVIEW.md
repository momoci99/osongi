# React 컴포넌트 심층 리뷰

> 기준: Vercel React Best Practices (70 rules) · 대상: `src/components`, `src/pages`, `src/hooks`
> 작성일: 2026-05-30

## 전제 조건

- **React Compiler 활성** (`vite.config.ts:20`, `babel-plugin-react-compiler`). 자동 메모이제이션 적용됨 → `rerender-memo`, 인라인 핸들러 메모 등 수동 최적화 규칙 대부분 **무효(컴파일러가 처리)**.
- **Vite SPA (Next.js 아님)** → `server-*`, `async-api-routes`, `next/dynamic` 규칙 **해당 없음**.
- 따라서 실제 임팩트 있는 항목은 **번들 크기**, **명시적 `useMemo` 의존성**, **데이터 페칭 훅 안정성**, **D3 렌더링**에 집중됨.

---

## 🔴 Critical — 번들 크기

### 1. MUI 아이콘 배럴 임포트 (`bundle-barrel-imports`)
`@mui/icons-material` 배럴은 수천 개 아이콘 export. 트리셰이킹 실패 시 전체 포함.

- `src/components/GlobalNavbar.tsx:11` — `import { Brightness4, Brightness7, Menu, GitHub } from "@mui/icons-material"`
- `src/components/Navbar/RefreshButton.tsx`

**Fix:** 경로 직접 임포트. 프로젝트 내 다른 차트들은 이미 올바름 (`@mui/icons-material/FileDownload`).
```ts
import Brightness4 from "@mui/icons-material/Brightness4";
import MenuIcon from "@mui/icons-material/Menu";
```

### 2. `@mui/material` 배럴 임포트 46곳 (`bundle-barrel-imports`)
전 컴포넌트가 `from "@mui/material"` 사용. Vite ESM 트리셰이킹이 일부 잡아주나 MUI v7 배럴은 부작용 많아 불완전. dev 콜드스타트도 느려짐.

**Fix(택1):**
- 경로 임포트 `@mui/material/Box` (확실, 일괄 변경 필요)
- 또는 빌드에 배럴 최적화 플러그인 적용

### 3. 라우트 코드 분할 없음 (`bundle-dynamic-imports` 변형)
`src/App.tsx` — `Dashboard`, `DataAnalysis` 정적 임포트. `DataAnalysis`는 D3 차트 5종 + `@mui/x-date-pickers` + `date-fns` 끌고 옴. 대시보드 최초 진입자도 분석 페이지 코드 전부 다운로드.

**Fix:** `React.lazy` + `Suspense`로 라우트 분할.
```tsx
const DataAnalysis = lazy(() => import("./pages/DataAnalysis"));
```

### 4. D3 네임스페이스 임포트 27곳
`import * as d3 from "d3"` — 네임스페이스 임포트는 번들러 트리셰이킹 약화 가능. 실제 사용은 `select/pie/arc/scaleLinear/max/sum` 등 소수.

**Fix(선택):** 명명 임포트 `import { select, pie, arc, scaleLinear } from "d3"`. d3가 ESM이라 효과 검증 후 적용.

---

## 🟠 Medium-High — 데이터 페칭 훅

### 5. `useAuctionData` / `useAggregatedData` 의존성 불안정 (`rerender-dependencies`)
`src/hooks/useAuctionData.ts:48,90` — `fetchData = useCallback(..., [filters, isInitialized])`. `filters`가 객체. 호출부가 매 렌더 새 객체 전달 시 `fetchData` 재생성 → effect 재실행 → 과도한 refetch.

**Fix:** 원시값 의존성으로 분해하거나 `filters`를 안정 참조(메모/스토어)로 보장. 호출부 점검 필수.

### 6. `useAggregatedData` `useState<any>`
`src/hooks/useAuctionData.ts:79` — `any` 타입. 타입 안정성/자동완성 손실.

**Fix:** 집계 결과 타입 명시.

---

## 🟡 Medium — `useMemo` 의존성 (DataAnalysis)

`src/pages/DataAnalysis.tsx` — 다수 `useMemo`가 전체 `filters` 객체 의존. zustand `filters`는 어떤 필드 하나만 바뀌어도 참조 변경 → 무관한 계산까지 재실행. React Compiler는 **명시적 `useMemo` 배열을 덮어쓰지 않음** → 그대로 영향.

- `kpiComparison` (`:138`) deps `[kpi, filteredComparisonData, filters]` 인데 실제 사용은 `filters.grades` + `comparisonEnabled`.
- `filteredComparisonData` (`:117`) deps `[comparisonRawData, filters]`.

**Fix:** 필요한 원시 필드만 의존 (`filters.grades`, `filters.comparisonEnabled` 등). `filteredData = applyFilters(rawData, filters)`처럼 전체가 필요한 곳은 그대로 둠.

> 컴포넌트 본문 `advancedActiveCount`(`:64`)는 메모 불필요한 단순식 → 현행 유지 적절 (`rerender-simple-expression-in-memo`).

---

## 🟡 Medium — D3 렌더링

### 7. 리사이즈마다 전체 SVG 재구축 (`rendering` 일반)
`GradeBreakdownChart.tsx` · `ScatterPlotChart.tsx` — effect 의존성에 `containerWidth` 포함, 내부에서 `svg.selectAll("*").remove()` 후 전체 재생성 + 진입 트랜지션. `ResizeObserver`가 연속 width 변경 발생시키면 DOM 스래싱 + 애니메이션 반복.

**Fix:** width 디바운스, 또는 enter/update/exit join 패턴으로 부분 갱신. 최소한 리사이즈 시 트랜지션 생략.

### 8. `useContainerSize` 중복 정의
`src/hooks/useContainerSize.ts` 와 `src/utils/d3/useContainerSize.ts` 공존. 혼란/드리프트 위험.

**Fix:** 하나로 통합 후 재익스포트.

---

## 🟢 Low

### 9. `process.env.NODE_ENV` (Vite 비표준)
`src/components/DataInitializer.tsx:178` (+ `utils` 2곳). Vite 관용은 `import.meta.env.DEV`. 현재 정적 치환으로 동작하나 비표준.

### 10. 조건부 렌더 `&&` (`rendering-conditional-render`)
`DataInitializer.tsx:178`, `Dashboard.tsx`(`myRegion && regionData &&`), `DataAnalysis.tsx`(`isMobile &&`) 등. 모두 boolean 피연산자라 현재 안전(숫자 `0` 유출 없음). 규칙은 삼항 선호 — 우선순위 낮음.

### 11. `@vercel/analytics` 즉시 로드 (`bundle-defer-third-party`)
`main.tsx` — `<Analytics />` eager. 자체적으로 hydration 후 지연되어 임팩트 작음. 유지 가능.

---

## ⚪ 프로젝트 컨벤션 위반 (Vercel 규칙 외, CLAUDE.md 기준)

차트/테이블 컴포넌트 9개가 컨벤션 미준수:
- **`export default function Foo()`** 사용 → 규칙은 화살표 함수 + 파일 끝 `export default`.
- **`interface ...Props`** 사용 → 규칙은 `type`.

해당 파일: `GradeBreakdownChart`, `ScatterPlotChart`, `RegionComparisonSection`, `TableSection`, `EmptyState`, `SectionCard`, `Table/DataTableHeader`, `Table/DataTableBody`, `Table/DataTablePagination`.

---

## 우선순위 요약

| # | 항목 | 규칙 | 임팩트 | 노력 |
|---|------|------|--------|------|
| 1 | 아이콘 배럴 임포트 | bundle-barrel-imports | 높음 | 낮음 |
| 3 | 라우트 코드 분할 | bundle-dynamic-imports | 높음 | 중간 |
| 2 | MUI 배럴 46곳 | bundle-barrel-imports | 중상 | 중간 |
| 5 | 페칭 훅 의존성 | rerender-dependencies | 중상 | 낮음 |
| 6 | useMemo 과의존 | rerender-dependencies | 중간 | 낮음 |
| 7 | D3 리사이즈 재구축 | rendering | 중간 | 중간 |

**즉효 3종(노력 낮음·임팩트 높음):** #1 아이콘 임포트, #5 훅 의존성, #6 useMemo 의존성.
