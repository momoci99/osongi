# 오송이 (Osongi) — 프로젝트 소개

## 1. 프로젝트 개요

**프로젝트명**: 오송이 (Osongi)  
**목적**: 산림조합중앙회의 송이버섯 공판 시세 데이터를 시각화하는 SPA  
**배포**: Vercel (GitHub push 시 자동 배포)

### 핵심 기능

- 실시간 공판 시세 대시보드 (시즌: 9월~11월)
- 다차원 데이터 분석 도구 (필터, 비교, 통계)
- 2013년~현재까지 역사 데이터 제공 (IndexedDB 캐싱)
- 비시즌 대시보드 (과거 시즌 요약, 카운트다운)

### 주요 사용자

| 페르소나           | 특성            | 주요 관심사       |
| ------------------ | --------------- | ----------------- |
| 채취자·농가        | 40~70대, 모바일 | 시세 빠르게 확인  |
| 조합 관계자·분석가 | PC 사용자       | 통계 분석, 보고서 |

---

## 2. 기술 스택

| 분야       | 기술                | 버전        |
| ---------- | ------------------- | ----------- |
| 프레임워크 | React + TypeScript  | 19 + TS 5.8 |
| 빌드       | Vite                | 7.1         |
| 라우팅     | React Router        | 7.10        |
| UI         | MUI (Material UI)   | 7.3         |
| 상태 관리  | Zustand             | 5.0         |
| 로컬 DB    | Dexie (IndexedDB)   | 4.2         |
| 차트       | D3.js               | 7.9         |
| 날짜       | date-fns            | 4.1         |
| 검증       | Zod                 | 4.0         |
| 테스트     | Vitest + Playwright | 3.2 + 1.59  |
| UI 테스트  | Storybook           | 9.1         |
| 배포       | Vercel              | —           |

---

## 3. 프로젝트 구조

```
osongi/
├── public/
│   ├── auction-data/                # 공판 원본 데이터 (JSON 스냅샷)
│   │   ├── 2013/ ~ 2025/           #   연/월/일.json
│   │   └── complete-dataset.json    #   빌드 시 생성된 통합 데이터
│   └── auction-stats/               # 통계 매니페스트
│       ├── daily-manifest.json
│       ├── weekly-manifest.json
│       ├── season-manifest.json
│       └── yearly-manifest.json
│
├── src/
│   ├── main.tsx                     # 진입점
│   ├── App.tsx                      # 루트 컴포넌트 (라우팅)
│   ├── theme.ts                     # MUI 테마 (Light/Dark)
│   │
│   ├── types/                       # 타입 정의
│   │   ├── data.ts                  #   MushroomAuctionDataRaw 등
│   │   ├── DailyData.ts             #   DailyDataType (Zod)
│   │   └── seasonOff.ts             #   비시즌 타입
│   │
│   ├── components/
│   │   ├── GlobalNavbar.tsx          # 전역 네비게이션
│   │   ├── DataInitializer.tsx       # 데이터 초기화
│   │   ├── Dashboard/               # 대시보드 컴포넌트
│   │   ├── DataAnalysis/            # 분석 컴포넌트
│   │   ├── Navbar/                  # 네비 서브컴포넌트
│   │   └── common/                  # 공통 (SectionCard, EmptyState)
│   │
│   ├── pages/                       # 페이지
│   │   ├── Dashboard.tsx
│   │   └── DataAnalysis.tsx
│   │
│   ├── stores/                      # Zustand 스토어
│   │   ├── useSettingsStore.ts      #   테마, 지역, 디스플레이 모드
│   │   └── useAnalysisFilterStore.ts #  분석 필터 (localStorage 영속화)
│   │
│   ├── hooks/                       # 커스텀 훅
│   │   ├── useAuctionData.ts
│   │   ├── useDashboardManifests.ts
│   │   ├── useChartExport.ts
│   │   ├── useContainerSize.ts
│   │   └── useSeasonOffData.ts
│   │
│   ├── utils/
│   │   ├── dataLoader/              # 데이터 로드 핵심 (fetch → IndexedDB 캐싱)
│   │   ├── analysis/                # 분석 유틸리티 (KPI, 통계, 분포 등)
│   │   ├── d3/                      # D3 헬퍼 (마진, 범례, 축)
│   │   └── __tests__/
│   │
│   ├── const/                       # 상수 (등급, 지역, 조합 맵)
│   └── stories/                     # Storybook
│
├── scripts/                         # 빌드 스크립트
│   ├── generate-stats.ts
│   └── generate-complete-dataset.ts
│
├── tests/                           # E2E 테스트
├── docs/                            # 문서 (계획, 구현, 가이드)
├── vite.config.ts                   # 빌드 설정 (청크 분할, 압축)
├── vercel.json                      # Vercel 배포 (SPA 리라이트)
└── CLAUDE.md                        # AI 개발 지침
```

---

## 4. 라우팅

| 경로             | 컴포넌트       | 설명                   |
| ---------------- | -------------- | ---------------------- |
| `/`              | `Dashboard`    | 대시보드 (기본 페이지) |
| `/data-analysis` | `DataAnalysis` | 데이터 분석            |

모든 라우트는 `src/App.tsx`에서 `<Routes>`로 관리합니다.

---

## 5. 데이터 모델

### 원본 데이터 (`MushroomAuctionDataRaw`)

```typescript
{
  region: string;           // 지역
  union: string;            // 조합명
  date?: string;            // 스냅샷 날짜
  auctionQuantity: {
    untilYesterday: string; // 전일까지 공판량 (kg)
    today: string;          // 금일 공판량 (kg)
    total: string;          // 누계 (kg)
  };
  auctionAmount: {
    untilYesterday: string; // 전일까지 금액 (원)
    today: string;          // 금일 금액 (원)
    total: string;          // 누계 (원)
  };
  grade1:          { quantity: string; unitPrice: string };
  grade2:          { quantity: string; unitPrice: string };
  grade3Stopped:   { quantity: string; unitPrice: string };
  grade3Estimated: { quantity: string; unitPrice: string };
  gradeBelow:      { quantity: string; unitPrice: string };
  mixedGrade:      { quantity: string; unitPrice: string };
}
```

### 등급 체계

| 키                | 한글              |
| ----------------- | ----------------- |
| `grade1`          | 1등품             |
| `grade2`          | 2등품             |
| `grade3Stopped`   | 3등품(생장정지품) |
| `grade3Estimated` | 3등품(개산품)     |
| `gradeBelow`      | 등외품            |
| `mixedGrade`      | 혼합품            |

### 지역 및 조합

```
강원: 홍천, 양구, 인제, 고성, 양양, 강릉, 삼척
경북: 의성, 안동, 청송, 영덕, 포항, 청도, 상주, 문경, 예천, 영주, 봉화, 울진, 영천
경남: 거창
```

---

## 6. 데이터 파이프라인

```
산림조합중앙회 웹사이트
    ↓  Playwright 자동화 (GitHub Actions, 시즌 중 매시간)
개별 JSON: /public/auction-data/YYYY/MM/DD.json
    ↓  빌드 시 스크립트 실행
통합 데이터: /public/auction-data/complete-dataset.json
매니페스트: /public/auction-stats/*.json
    ↓  Vercel 배포
클라이언트 fetch
    ↓
IndexedDB 캐싱 (Dexie) — 오프라인/저속 네트워크 지원
```

---

## 7. 상태 관리

### Zustand 스토어

**`useSettingsStore`** — 사용자 설정 (localStorage 영속화)

```typescript
{
  themeMode: "dark" | "light"; // 라이트/다크 모드
  myRegion: RegionType | null; // 사용자 지역
  myUnion: string | null; // 사용자 조합
  hasCompletedOnboarding: boolean; // 온보딩 완료 여부
  displayMode: "default" | "large"; // 글씨 크기 모드
}
```

**`useAnalysisFilterStore`** — 분석 필터 (localStorage 영속화)

```typescript
{
  filters: {
    regions: string[];
    unions: string[];
    grades: string[];
    startDate: Date;
    endDate: Date;
    comparisonEnabled: boolean;
    comparisonStartDate: Date | null;
    comparisonEndDate: Date | null;
  };
}
```

---

## 8. 테마

### 색상 토큰 (Modern Forest)

| 토큰    | 라이트    | 다크      |
| ------- | --------- | --------- |
| 배경    | `#FAFAF9` | `#171412` |
| 텍스트  | `#1C1917` | `#FAF9F7` |
| Primary | `#166534` | `#22C55E` |
| Accent  | `#B45309` | `#FBBF24` |

### 등급별 컬러

| 등급            | 색상 계열 |
| --------------- | --------- |
| grade1          | 초록      |
| grade2          | 파랑      |
| grade3Stopped   | 주황      |
| grade3Estimated | 보라      |
| gradeBelow      | 빨강      |
| mixedGrade      | 회색      |

### 폰트

Pretendard → Noto Sans KR → system-ui

---

## 9. 주요 명령어

```bash
# 개발
npm run dev                    # 개발 서버 (localhost:5173)
npm run build                  # 프로덕션 빌드
npm run lint                   # ESLint

# 테스트
npm run test                   # Vitest 단위 테스트
npm run test:watch             # Watch 모드
npm run test:coverage          # 커버리지
npm run test:e2e               # Playwright E2E

# Storybook
npm run storybook              # 개발 서버 (포트 6006)

# 데이터
npm run collect-data           # 공판 데이터 수집
npm run collect-data:recent    # 최근 7일
npm run generate-stats         # 통계 매니페스트 생성
npm run generate-complete-dataset  # 통합 데이터셋 생성
```

---

## 10. 코딩 컨벤션

| 항목          | 규칙                                                   |
| ------------- | ------------------------------------------------------ |
| 타입 정의     | `type` 사용 (`interface` 아님)                         |
| 컴포넌트      | 화살표 함수 (`const Foo = () => {}`)                   |
| 내보내기      | `export default`, 파일 끝에 위치                       |
| 차트          | D3.js 직접 구현 (래핑 라이브러리 금지)                 |
| 주석          | 한국어, JSDoc 형태 (`/** ... */`)                      |
| 컴포넌트 크기 | 300줄 이하 유지                                        |
| 원칙          | Clean Code, SOLID                                      |
| 테스트        | Vitest + React Testing Library (pre-push 훅 자동 실행) |
| 라이트/다크   | 두 모드 모두 지원 필수                                 |

---

## 11. 빌드 최적화

### 청크 분할 (Vite)

```typescript
manualChunks: {
  vendor:  ["react", "react-dom"],
  router:  ["react-router"],
  ui:      ["@mui/material", "@mui/icons-material"],
  charts:  ["d3"],
  date:    ["date-fns"],
}
```

### 압축

JS, CSS, HTML, SVG 및 JSON 매니페스트를 gzip 압축합니다 (threshold: 1KB).

---

## 12. 개발 시작 가이드

```bash
# 1. 저장소 클론
git clone https://github.com/momoci99/osongi.git
cd osongi

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 테스트 실행
npm run test

# 5. Storybook 실행 (컴포넌트 독립 확인)
npm run storybook
```

### 주요 진입 파일

| 파일                             | 역할             |
| -------------------------------- | ---------------- |
| `src/App.tsx`                    | 라우팅 진입점    |
| `src/theme.ts`                   | MUI 테마 정의    |
| `src/types/data.ts`              | 데이터 타입      |
| `src/stores/useSettingsStore.ts` | 설정 상태        |
| `src/utils/dataLoader/index.ts`  | 데이터 로드 핵심 |
| `vite.config.ts`                 | 빌드 설정        |

---

## 13. 참고 문서

| 문서         | 위치                                    |
| ------------ | --------------------------------------- |
| AI 개발 지침 | `CLAUDE.md`                             |
| Copilot 지침 | `.github/copilot-instructions.md`       |
| 제품 로드맵  | `docs/planning/product-roadmap-2026.md` |
| 구현 문서    | `docs/implementation/`                  |
| 테스트 계획  | `docs/guides/test-plan.md`              |
