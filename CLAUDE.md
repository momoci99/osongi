# CLAUDE.md

## 프로젝트 개요

송이버섯 공판장 시세 대시보드 SPA. React 19 + MUI v7 + D3.js, Vite, Vercel 배포.

## 주요 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm run storybook    # Storybook (포트 6006)
npm run collect-data # Playwright로 공판 데이터 수집
```

## 규칙

- 차트는 반드시 D3.js로 직접 구현. 래핑 라이브러리(Recharts, Chart.js 등) 전환 제안 금지.
- UI 미적 완성도 최우선. 투박한 UI 불가.
- 한국어 주석 사용.
- 주석은 JSDoc 형태(`/** ... */`)를 사용한다. `// ===== ... =====` 같은 구분선 스타일은 사용하지 않는다.

## 코딩 컨벤션

- Props 등 타입 정의는 `interface`가 아닌 `type`을 사용한다.
- 컴포넌트는 화살표 함수로 선언한다. (`const Foo = () => {}`)
- `export default`를 사용하며, 파일 끝에 위치시킨다.
- kentbeck의 "Clean Code" 원칙을 따른다. (의미 있는 이름, 작은 함수, 단일 책임 등)
