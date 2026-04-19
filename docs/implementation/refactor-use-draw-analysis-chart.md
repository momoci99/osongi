# useDrawAnalysisChart 책임 분리 리팩토링

> **작업일**: 2026-04-19
> **대상 파일**: `src/components/DataAnalysis/DataAnalysisChart/useDrawAnalysisChart.ts`

---

## 배경

리팩토링 전 `useDrawAnalysisChart.ts`는 **1069줄**, 11개의 책임이 단일 파일에 혼재했다.
CLAUDE.md 규칙(컴포넌트 300줄 이하)을 위반하며, 변경 영향 범위가 과도하게 넓었다.

---

## 리팩토링 전 책임 목록

| # | 책임 | 위치 |
|---|---|---|
| 1 | 훅 오케스트레이션 (useEffect, refs, deps) | 훅 본체 |
| 2 | 레이아웃 계산 (margin, font, mobile 분기) | useEffect 내부 |
| 3 | 시리즈 가시성 토글 상태 | hiddenSeriesRef + toggleSeries |
| 4 | 빈 상태 메시지 | drawEmptyMessage |
| 5 | Overlay 모드 렌더링 | if (layout === "overlay") 분기 |
| 6 | Subplot 모드 렌더링 | else 분기 |
| 7 | 시리즈 라인 + 점 그리기 | drawSeriesLineAndPoints |
| 8 | 이동평균선 오버레이 | drawMAOverlay |
| 9 | 극값 마커 | drawExtremeMarkers |
| 10 | Subplot crosshair + 툴팁 | addCrosshair + getNearestDate + formatDateKorean |
| 11 | 범례 (클릭 토글 포함) | drawLegend |

---

## 분리 결과 파일 구조

```
DataAnalysisChart/
├── useDrawAnalysisChart.ts        ← 오케스트레이션만 (150줄)
├── seriesBuilder.ts               ← 기존 유지
└── renderers/
    ├── drawEmptyMessage.ts        ← 책임 #4
    ├── drawSeriesLineAndPoints.ts ← 책임 #7
    ├── drawMAOverlay.ts           ← 책임 #8
    ├── drawExtremeMarkers.ts      ← 책임 #9
    ├── drawLegend.ts              ← 책임 #11
    ├── drawSubplotCrosshair.ts    ← 책임 #10 (getNearestDate, formatDateKorean 포함)
    ├── drawSubplot.ts             ← 단일 연도 서브플롯
    ├── drawOverlayMode.ts         ← 책임 #5 (Overlay 분기 전체)
    └── drawSubplotMode.ts         ← 책임 #6 (Subplot 분기 전체)
```

---

## 단계별 작업 내역

### Step 1 — 순수 렌더러 추출
상태 의존 없는 순수 D3 렌더링 함수 5개를 `renderers/` 디렉토리로 이동:
- `drawEmptyMessage`, `drawSeriesLineAndPoints`, `drawMAOverlay`, `drawExtremeMarkers`, `drawLegend`

### Step 2 — Subplot crosshair 추출
`addCrosshair`, `getNearestDate`, `formatDateKorean`을 `drawSubplotCrosshair.ts`로 이동.
`hiddenSeriesRef`는 `RefObject`로 인자 전달.

### Step 3 — drawSubplot 추출
연도별 서브플롯 전체 로직(축, 틱, 시리즈, MA, 마커, crosshair 조합)을
`renderers/drawSubplot.ts`로 이동. 내부에서 Step 1~2 렌더러를 조합.

### Step 4 — Overlay/Subplot 모드 분리
`useEffect` 내 두 분기를 각각 전용 파일로 추출:
- `drawOverlayMode.ts`: 연도별 색상 오버레이, crosshair, 범례
- `drawSubplotMode.ts`: 서브플롯 반복, 범례

`toggleSeries`는 `onToggleSeries` 콜백으로 주입 (DI 방식).

### Step 5 — 훅 최종 정리
`useDrawAnalysisChart.ts`가 **오케스트레이션 전용**으로 정리됨:
- margin, fontSize 계산
- seasonData 필터링 + 빈 상태 처리
- `toggleSeries` 정의 (svgRef 클로저 필요 → 훅 내부 유지)
- `drawOverlayMode` / `drawSubplotMode` 호출
- 숨김 상태 복원 + SVG 높이 조정

> layout/fontSize 계산의 별도 파일 분리는 12줄 수준으로 과추상화 판단, 훅 내 유지.

---

## 리팩토링 후 규모

| 파일 | 줄 수 |
|------|------|
| `useDrawAnalysisChart.ts` (before) | 1,069 |
| `useDrawAnalysisChart.ts` (after) | 150 |
| 신규 `renderers/` 파일 합계 | ~670 |

---

## 부수 버그 수정

`drawOverlayMode`에 `isMobile` 파라미터 미전달 버그 발견 및 수정.
(범례가 항상 데스크탑 크기로 렌더링되던 문제)

---

## 설계 원칙

- 각 렌더러는 **순수 함수** — SVG selection을 인자로 받아 직접 그림
- 상태(`hiddenSeriesRef`, `svgRef`)는 훅에서만 소유, 렌더러는 `RefObject`로 읽기만 함
- `toggleSeries`는 `svgRef` 클로저를 필요로 하므로 훅 내부 정의 유지
- `onToggleSeries` 콜백으로 주입 → 렌더러가 훅 상태에 직접 의존하지 않음
