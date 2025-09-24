# 오송이

대한민국 산림조합중앙회에서 제공하는 연도별 송이버섯 공판 현황을 보다 쉽게 확인할 수 있도록 시각화된 자료를 제공합니다.

## 📊 자동 데이터 수집

GitHub Actions를 통해 **송이 경매 시간에 맞춰** 자동으로 최신 데이터를 수집합니다:

- 🕐 **실행 주기**: 매시간 (오전 10시 ~ 오후 10시, KST)
- 🗓️ **실행 기간**: 9월 ~ 11월 (송이 시즌)
- 📅 **수집 범위**: 최근 5일 데이터 확인
- 🔄 **스마트 업데이트**: 변경된 데이터만 자동 갱신
- 📝 **자동 커밋**: 새 데이터/업데이트 발견 시 자동으로 Git에 저장

### 수동 데이터 수집

로컬에서 데이터를 수집하려면:

```bash
# 최근 7일 데이터 수집
npx playwright test tests/generateRawData.spec.ts

# 특정 기간 수집 (환경변수 설정)
DAYS_TO_CHECK=30 npx playwright test tests/generateRawData.spec.ts
```

## 데이터 소스

- 산림조합중앙회 송이 공판 현황 : https://m.nfcf.or.kr/forest/user.tdf?a=user.index.IndexApp&c=1005&mc=MOB
