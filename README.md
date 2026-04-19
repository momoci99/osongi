# 오송이

대한민국 산림조합중앙회에서 제공하는 송이버섯 공판 시세를 시각화하여 제공하는 대시보드 서비스입니다.
2013년부터 현재까지의 공판 데이터를 수집하고, 실시간 시세 확인 및 다양한 분석 기능을 제공합니다.

# 목적

- 채취자와 농가가 산지·시장 현장에서 빠르게 시세를 확인할 수 있도록 지원
- 조합 관계자와 분석가가 시즌 통계 분석과 보고서 작성을 효율적으로 수행할 수 있도록 도구 제공
- 40~70대 주요 사용자층을 위한 가독성과 접근성 최적화

## 주의사항

- 이 프로젝트는 ai agent(claude code)로 개발된 프로젝트입니다.

## 주요 기능

### 대시보드 (`/dashboard`)

시즌 중(9~11월)에는 실시간 공판 현황을 제공합니다.

- **KPI 카드**: 총 거래량, 최고 등급, 최다 거래 지역/조합 등 핵심 지표
- **지역별 시세표**: 사용자 지역 기반 가격 테이블
- **등급별 차트**: 등급별 거래량(kg), 단가 분석
- **7일 추이**: 등급별 가격·거래량 7일간 트렌드
- **전일 대비**: 가격 변동 비교

시즌 외에는 과거 시즌 데이터를 기반으로 분석 뷰를 제공합니다.

### 데이터 분석 (`/data-analysis`)

다차원 필터링 기반의 심층 분석 도구입니다.

- **필터**: 기간, 지역, 조합, 등급, 비교 기간 설정
- **KPI 요약**: 가중 평균 단가, 총 거래량, 최고/최저가, 거래일수, 전년 대비 비교
- **가격·거래량 차트**: 등급별 필터링 가능한 라인 차트
- **등급 분포**: 등급별 거래량·금액 비율 도넛 차트
- **산점도**: 거래량 vs 가격 관계 분석
- **지역 비교**: 다중 지역 성과 지표
- **데이터 테이블**: 정렬·페이지네이션 지원 상세 조회

## 기술 스택

| 구분        | 기술                                     |
| ----------- | ---------------------------------------- |
| 프레임워크  | React 19 + TypeScript + React Router v7  |
| 빌드 도구   | Vite 7 (코드 스플리팅, gzip/brotli 압축) |
| UI          | MUI v7 (Material UI) + Emotion           |
| 차트        | D3.js v7 (직접 구현)                     |
| 상태 관리   | Zustand (설정), Dexie (IndexedDB 캐싱)   |
| 데이터 검증 | Zod v4                                   |
| 테스트      | Vitest + Storybook 9 + Playwright        |
| 배포        | Vercel (자동 배포)                       |

## 지역 및 조합 목록

```ts
강원: ["홍천", "양구", "인제", "고성", "양양", "강릉", "삼척", "의성"];
경북: [
  "의성",
  "안동",
  "청송",
  "영덕",
  "포항",
  "청도",
  "상주",
  "문경",
  "예청",
  "영주",
  "봉화",
  "울진",
];
경남: ["거창"];
```

## 데이터 파이프라인

### 수집 → 가공 → 배포 흐름

```
산림조합중앙회 웹사이트
       ↓  Playwright 자동화 (GitHub Actions)
개별 JSON 파일  /public/auction-data/YYYY/MM/DD.json
       ↓  빌드 시 통합 (scripts/generate-complete-dataset.ts)
통합 데이터셋  /public/auction-data/complete-dataset.json
       ↓  통계 생성 (scripts/generate-stats.ts)
매니페스트  daily-manifest.json, weekly-manifest.json
       ↓  Vercel 자동 배포
클라이언트 로딩 → IndexedDB 캐싱
```

### 자동 수집 (GitHub Actions)

- **실행 주기**: 매시간 (오전 10시 ~ 오후 10시 KST)
- **실행 기간**: 9월 ~ 11월 (송이 시즌)
- **수집 범위**: 최근 5일 데이터 확인
- **스마트 업데이트**: 변경된 데이터만 자동 갱신 후 커밋

### 수동 수집

```bash
# 최근 7일 데이터 수집
npm run collect-data:recent

# 최근 30일 데이터 수집
npm run collect-data:month

# 기본 수집
npm run collect-data
```

### 빌드 시 데이터 가공

```bash
# 통합 데이터셋 생성
npm run generate-complete-dataset

# 통계 매니페스트 생성
npm run generate-stats
```

## 클라이언트 데이터 캐싱

IndexedDB 기반 로컬 캐싱으로 반복 방문 시 빠른 로딩을 지원합니다.

**첫 방문**: 통합 데이터셋 다운로드 (~3.7MB, 압축 시 140~234KB) → IndexedDB 저장

**재방문**: 로컬 데이터 나이 체크 → 서버 버전 비교 → 필요시에만 업데이트

**버전 체크 전략** (3단계 폴백):

1. HEAD 요청 → ETag/Last-Modified 확인 (가장 빠름)
2. Range 요청 → 버전 필드만 추출 (1KB)
3. 전체 다운로드 (최후의 수단)

**캐시 무효화**: 개발 환경 5분, 프로덕션 1시간

## 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 린트
npm run lint
```

## 테스트

```bash
# 단위 테스트 (1회 실행)
npm run test

# 단위 테스트 (watch 모드)
npm run test:watch

# 단위 테스트 커버리지
npm run test:coverage

# E2E 테스트 (Playwright)
npm run test:e2e

# Storybook
npm run storybook
```

> pre-push 훅(Husky)이 설정되어 있어, `git push` 전 단위 테스트가 자동 실행됩니다.

## 데이터 소스

- [산림조합중앙회 송이 공판 현황](https://iforest.nfcf.or.kr/forest/user.tdf?a=user.songi.SongiApp&c=1001&mc=CYB_FIF_DGS_SNI&pmsh_item_c=01)

## 다음 단계

- 사용자 피드백 수집 및 UI/UX 개선
- 과거 시즌 (엑셀로 제공된 데이터) 통합
- 날씨와 연동한 데이터 분석 기능 추가
