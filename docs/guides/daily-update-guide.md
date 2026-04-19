# 매일 데이터 업데이트 가이드

## 🎯 목표

매일 새로운 송이버섯 공판 데이터를 수집하고 통합 데이터셋을 업데이트하여 배포

## 🔄 일일 워크플로우

### 1단계: 새 데이터 수집

```bash
# 최근 7일간 데이터 수집 (새 데이터 확인)
npm run collect-data:recent

# 또는 특정 날짜만 수집
DAYS_TO_CHECK=1 npm run collect-data
```

### 2단계: 통합 데이터셋 재생성

```bash
# 모든 데이터를 통합하여 complete-dataset.json 생성
npm run generate-complete-dataset
```

### 3단계: 빌드 & 배포

```bash
# 로컬 테스트
npm run build
npm run preview

# Git 커밋 & 푸시 (Vercel 자동 배포 트리거)
git add .
git commit -m "데이터 업데이트: $(date +%Y-%m-%d)"
git push origin main
```

## 🤖 자동화 옵션들

### A. GitHub Actions (추천)

```yaml
# .github/workflows/daily-update.yml
name: Daily Data Update
on:
  schedule:
    - cron: "0 18 * * *" # 매일 오후 6시 (송이 공판 마감 후)
  workflow_dispatch: # 수동 실행도 가능

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run collect-data:recent
      - run: npm run generate-complete-dataset
      - run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/auction-data/
          git commit -m "데이터 자동 업데이트: $(date +%Y-%m-%d)" || exit 0
          git push
```

### B. Vercel Cron Jobs

```javascript
// api/cron/daily-update.js
export default async function handler(req, res) {
  if (req.query.token !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 데이터 수집 로직 실행
  // 빌드 트리거

  res.json({ success: true });
}
```

### C. 로컬 스케줄러 (macOS/Linux)

```bash
# crontab 설정
# 매일 오후 6시에 실행
0 18 * * * cd /path/to/osongi && npm run collect-data:recent && npm run generate-complete-dataset && git add . && git commit -m "Auto update $(date)" && git push
```

## 📊 데이터 버전 관리

### 버전 확인

```javascript
// 클라이언트에서 데이터 버전 확인
const response = await fetch("/auction-data/complete-dataset.json");
const { version, totalRecords } = await response.json();

console.log(`데이터 버전: ${version}`);
console.log(`총 레코드: ${totalRecords}개`);
```

### 점진적 업데이트

```javascript
// 필요시 점진적 업데이트도 가능
// 1. 클라이언트가 로컬 버전 확인
// 2. 서버 버전과 비교
// 3. 필요한 부분만 업데이트
```

## ⚠️ 주의사항

1. **송이버섯 시즌 (8-12월)**: 매일 업데이트 필요
2. **비시즌 (1-7월)**: 업데이트 불필요, 기존 데이터 유지
3. **데이터 검증**: 새 데이터가 올바른 형식인지 확인
4. **백업**: 기존 데이터 백업 후 업데이트

## 🎯 현실적 추천안

**Phase 1 (즉시 적용)**:

- 수동으로 `npm run collect-data:recent && npm run generate-complete-dataset` 실행
- Git 커밋 후 Vercel 자동 배포

**Phase 2 (1주 후)**:

- GitHub Actions로 자동화
- 송이버섯 시즌 동안만 실행

**Phase 3 (필요시)**:

- 실시간 업데이트 (Vercel Functions + Cron)
- 점진적 업데이트 최적화
