# 오송이

대한민국 산림조합중앙회에서 제공하는 연도별 송이버섯 공판 현황을 보다 쉽게 확인할 수 있도록 시각화된 자료를 제공합니다.

## 📊 자동 데이터 수집

GitHub Actions를 통해 **매시간 자동으로** 최신 경매 데이터를 수집합니다:

- 🕐 **실행 주기**: 매시간 정각 (KST 기준)
- 📅 **수집 범위**: 최근 3일 데이터 확인
- 🔄 **중복 방지**: 기존 파일은 건너뛰기
- 📝 **자동 커밋**: 새 데이터 발견 시 자동으로 Git에 저장

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
