# 연산 효율성 리뷰 (2026-05)

코드 직접 확인 후 실제 문제만 정리. 탐색 에이전트 오진단 항목은 별도 표기.

---

## HIGH — 즉시 수정 권장

### 1. `distribution.ts:36-52` — 이중 필터링 O(grades × bins × n)

```ts
// 문제: 등급마다 전체 validData 스캔, bin마다 다시 스캔
for (const gradeKey of gradeKeys) {
  const gradeData = validData.filter((d) => d.gradeKey === gradeKey); // O(n)
  for (let i = 0; i < numBins; i++) {
    const count = gradeData.filter((d) => ...).length; // O(n/grades) 추가 스캔
  }
}
```

**영향:** 등급 4개 × bin 10개 = 40회 배열 순회.  
**수정:** Map으로 사전 그룹핑 후 bin 처리.

```ts
// 수정안
const gradeGroups = new Map<string, WeeklyPriceDatum[]>();
for (const d of validData) {
  const group = gradeGroups.get(d.gradeKey) ?? [];
  group.push(d);
  gradeGroups.set(d.gradeKey, group);
}
for (const [gradeKey, gradeData] of gradeGroups) {
  for (let i = 0; i < numBins; i++) { ... }
}
```

---

### 2. `report.ts:162-176` (calculateGradeAnalysis) — 등급당 전체 배열 filter

```ts
// 문제: selectedGrades.map() 안에서 매번 전체 data 스캔
const currentGradeData = data.filter((datum) => datum.gradeKey === gradeKey); // O(n) × grades
const comparisonGradeData = comparisonData?.filter((datum) => datum.gradeKey === gradeKey); // 또 O(n) × grades
```

**영향:** 등급 5개 + 비교 데이터 있으면 = 10회 전체 스캔.  
**수정:** 호출 전 `Map<gradeKey, datum[]>` 구성 후 O(1) 조회.

---

### 3. `report.ts:279-281` (calculateVolatility) — 등급당 filter + map

```ts
// 문제: 등급마다 data 전체 스캔 두 번 (filter → map)
const prices = data
  .filter((datum) => datum.gradeKey === gradeKey)
  .map((datum) => datum.unitPriceWon);
```

**영향:** 2번 문제와 동일 패턴. `generateSeasonReport` 호출 시 `calculateGradeAnalysis` + `calculateVolatility` 가 동일 data를 각각 grades번 순회.  
**수정:** `generateSeasonReport` 진입 시 `Map<gradeKey, datum[]>` 한 번만 구성, 두 함수에 전달.

---

### 4. `aggregations.ts:66-77` — 동일 filter 두 번 호출

```ts
// 문제: grade1, grade2 각각 .filter() 두 번씩 = 총 4회 전체 스캔
grade1:
  records.filter((r) => r.grade1Quantity > 0).reduce(...) /
  records.filter((r) => r.grade1Quantity > 0).length || 0,
```

**수정:** 한 번만 filter 후 단일 reduce.

```ts
const grade1Records = records.filter((r) => r.grade1Quantity > 0);
const grade1 = grade1Records.length === 0
  ? 0
  : grade1Records.reduce((s, r) => s + r.grade1UnitPrice, 0) / grade1Records.length;
```

---

## MEDIUM

### 5. `statistics.ts:34` — sort 콜백 내 Date 생성

```ts
// 문제: 비교마다 new Date() × 2 생성 = O(n log n)번 Date 객체 생성
const sorted = [...groupData].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);
```

ISO 날짜("YYYY-MM-DD")는 사전순 = 시간순. 문자열 비교로 충분.

```ts
const sorted = [...groupData].sort((a, b) => a.date.localeCompare(b.date));
```

---

### 6. `MonthlyPatternList.tsx:29` — 렌더마다 Math.max 재계산

```ts
// 문제: useMemo 없이 매 렌더마다 실행
const maxQty = Math.max(...patterns.map((pp) => pp.avgQuantityKg));
```

```ts
// 수정
const maxQty = useMemo(
  () => Math.max(...patterns.map((pp) => pp.avgQuantityKg)),
  [patterns]
);
```

---

## LOW

### 7. `breakdown.ts:57-58` — Array.from + reduce 두 번

```ts
const totalQuantity = Array.from(gradeMap.values()).reduce((s, v) => s + v.quantity, 0);
const totalAmount = Array.from(gradeMap.values()).reduce((s, v) => s + v.amount, 0);
```

```ts
// 수정: 한 번에 처리
let totalQuantity = 0;
let totalAmount = 0;
gradeMap.forEach((v) => { totalQuantity += v.quantity; totalAmount += v.amount; });
```

---

### 8. `DataAnalysis.tsx:185-200` — 비교 차트 데이터 memo 미분리

```ts
// seasonReport useMemo 안에서 transformToChartData 재호출
const comparisonWeeklyData = filters.comparisonEnabled && filteredComparisonData.length > 0
  ? transformToChartData(filteredComparisonData, filters.grades)  // memo 없음
  : undefined;
```

`chartData` 변경 시 비교 데이터 없어도 재계산. 별도 `useMemo`로 분리.

---

### 9. `filters.ts:40-44` — 필터 호출마다 날짜 파싱

```ts
// 매 레코드마다 new Date(normalizeDate(record.date))
const recordDate = new Date(normalizeDate(record.date));
```

호출 빈도가 낮으면 무시 가능. 데이터 로드 시점에 미리 정규화하면 제거 가능.

---

## 오진단 (수정 불필요)

| 항목 | 탐색 결과 | 실제 |
|------|-----------|------|
| `kpi.ts:71-90` | "매 KPI마다 sort" HIGH | 단일 패스 집계 후 sort 1회. 정상 |
| `region.ts:34-44` | "중첩 루프 + Map 조회" MEDIUM | Map 기반 단일 패스. 정상 |
| `scatter.ts:46-60` | "중첩 루프 비효율" MEDIUM | 표준 집계 패턴. 정상 |
| `report.ts:326-328` | "날짜 string sort 느림" LOW | ISO 문자열 사전순 = 시간순. 기능 정상, 성능 무관 |

---

## 수정 우선순위

| 순위 | 파일 | 예상 효과 |
|------|------|----------|
| 1 | `distribution.ts` | 히스토그램 렌더 시간 직접 단축 |
| 2 | `report.ts` (calculateGradeAnalysis + calculateVolatility 통합) | 시즌 리포트 생성 비용 절반 이하 |
| 3 | `aggregations.ts` | DB 쿼리 후처리 최적화 |
| 4 | `statistics.ts` | MA 계산 소폭 개선 |
| 5 | `MonthlyPatternList.tsx` | 렌더 안정성 |
| 6-9 | 나머지 LOW | 코드 정리 수준 |
