# Phase E: 시즌 카운트다운

## 목적
시즌 오프 대시보드 상단에 다음 송이 시즌 시작일까지 남은 일수를 보여주는 카운트다운 카드를 추가해, 비시즌 화면의 의미를 더 명확하게 만든다.

## 예상 소요 시간
2~3시간

## 완료 기준
- 시즌 오프 화면 최상단에 카운트다운 카드가 표시된다.
- 카드에는 다음 시즌 시작까지 남은 일수가 큰 숫자로 강조된다.
- 시즌 중이거나 남은 일수가 `0`일 때 카드는 렌더링되지 않는다.
- 카드 색상은 `forest green #2E7D32` 계열이며, 기존 시즌 오프 카드보다 상단 우선순위가 높게 보인다.
- 날짜 계산은 매직 넘버가 아니라 `MUSHROOM_SEASON` 상수를 사용한다.

## 변경 파일 목록
- `src/utils/isInSeason.ts`
- `src/components/Dashboard/SeasonOffDashboard.tsx`

## 구현 세부사항

### 1. `src/utils/isInSeason.ts`에 `daysUntilNextSeason(today: Date): number` 추가
현재 파일은 시즌 여부만 판별하므로, 시즌 시작일까지 남은 일수를 계산하는 보조 함수를 같은 파일에 함께 둔다.

```ts
import { MUSHROOM_SEASON } from "../const/Numbers";

/** 최신 데이터가 7일 이내이면 시즌 중. ?season=on|off 로 강제 가능 */
const isInSeason = (latestDate: string): boolean => {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("season");
  if (override === "on") return true;
  if (override === "off") return false;

  const latest = new Date(latestDate);
  const now = new Date();
  const diffMs = now.getTime() - latest.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

/**
 * 다음 시즌 시작일까지 남은 일수를 반환합니다.
 */
export const daysUntilNextSeason = (today: Date): number => {
  const normalizedToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const seasonStartThisYear = new Date(
    normalizedToday.getFullYear(),
    MUSHROOM_SEASON.START_MONTH - 1,
    1,
  );
  const seasonEndThisYear = new Date(
    normalizedToday.getFullYear(),
    MUSHROOM_SEASON.END_MONTH,
    0,
  );

  if (
    normalizedToday >= seasonStartThisYear &&
    normalizedToday <= seasonEndThisYear
  ) {
    return 0;
  }

  const nextSeasonStart =
    normalizedToday < seasonStartThisYear
      ? seasonStartThisYear
      : new Date(
          normalizedToday.getFullYear() + 1,
          MUSHROOM_SEASON.START_MONTH - 1,
          1,
        );

  const diffMs = nextSeasonStart.getTime() - normalizedToday.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export default isInSeason;
```

### 2. `SeasonOffDashboard.tsx`에 `CountdownCard` 삽입
기존 시즌 오프 데이터 카드보다 먼저 보여야 하므로 `summary`보다 위에 배치한다.

```tsx
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import useSeasonOffData from "../../hooks/useSeasonOffData";
import { daysUntilNextSeason } from "../../utils/isInSeason";
import SeasonSummaryCards from "./SeasonOff/SeasonSummaryCards";
import YearlyTrendBars from "./SeasonOff/YearlyTrendBars";
import MonthlyPatternList from "./SeasonOff/MonthlyPatternList";
import RegionRankingList from "./SeasonOff/RegionRankingList";

type SeasonOffDashboardProps = {
  myRegion?: string | null;
};

type CountdownCardProps = {
  daysLeft: number;
};

const CountdownCard = ({ daysLeft }: CountdownCardProps) => {
  if (daysLeft <= 0) return null;

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: "0.75rem",
        color: "#FFFFFF",
        backgroundColor: "#2E7D32",
        backgroundImage: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
        boxShadow: "0 12px 32px rgba(46, 125, 50, 0.24)",
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Typography
          variant="overline"
          sx={{ color: "rgba(255,255,255,0.76)", letterSpacing: "0.08em" }}
        >
          다음 송이 시즌
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          D-{daysLeft}
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 0.75, color: "rgba(255,255,255,0.88)" }}
        >
          8월 1일 시작 예상일까지 남은 기간입니다.
        </Typography>
      </CardContent>
    </Card>
  );
};

const SeasonOffDashboard = ({ myRegion }: SeasonOffDashboardProps) => {
  const data = useSeasonOffData(myRegion);
  const daysLeft = daysUntilNextSeason(new Date());

  if (!data) {
    return (
      <Box>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 1.5 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 6, sm: 3 }}>
              <Skeleton
                variant="rounded"
                height={100}
                sx={{ borderRadius: "0.75rem" }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const { seasonData, yearlyEntries } = data;
  const summary = seasonData.latestSeasonSummary;
  const patterns = seasonData.monthlyPatterns;
  const rankings = seasonData.regionRanking;
  const regionSeason = myRegion
    ? seasonData.regionSeasonSummaries?.[myRegion]
    : null;
  const yearlyLabel = myRegion
    ? `${myRegion} 연간 거래량 추이`
    : "연간 거래량 추이";

  return (
    <Box>
      <CountdownCard daysLeft={daysLeft} />

      {summary && (
        <SeasonSummaryCards
          summary={summary}
          regionSeason={regionSeason ?? null}
          myRegion={myRegion}
        />
      )}

      <YearlyTrendBars
        yearlyEntries={yearlyEntries}
        yearlyLabel={yearlyLabel}
      />

      <Grid container spacing={2}>
        {patterns.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <MonthlyPatternList patterns={patterns} />
          </Grid>
        )}
        {rankings.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <RegionRankingList rankings={rankings} myRegion={myRegion} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SeasonOffDashboard;
```

### 3. 컴포넌트 디자인 가이드
- 배경은 `#2E7D32`를 기본값으로 하고, 카드 내부에는 더 짙은 녹색으로 이어지는 그라데이션을 사용한다.
- 메인 숫자는 `D-xx` 한 줄로 크게 보여주고, 설명 문구는 한 줄 또는 두 줄로 짧게 유지한다.
- 카드 높이는 기존 `DashboardCard` 계열보다 약간 크되, 시즌 오프 첫 섹션을 밀어내지 않을 정도로만 유지한다.
- 시즌 중 또는 계산 결과가 `0`일 때는 렌더링하지 않는다.
- 강제 `?season=off` 상태로 비시즌 화면을 띄워도 실제 달력상 시즌이면 카드가 숨겨지는 것이 맞다.

## 검증 절차
1. 시스템 날짜 또는 테스트 더블 기준으로 `2026-07-31`을 넣었을 때 `D-1`이 보이는지 확인한다.
2. `2026-08-01`을 넣었을 때 카드가 렌더링되지 않는지 확인한다.
3. `2026-01-15` 기준으로 약 198일 전후의 값이 표시되는지 확인한다.
4. 시즌 오프 대시보드 로딩 완료 후 카드가 최상단에 위치하는지 확인한다.
5. 라이트 모드와 다크 모드에서 모두 카드 텍스트 대비가 충분한지 확인한다.
6. `?season=off`로 강제 진입한 상태에서도 `daysUntilNextSeason(new Date()) === 0`이면 카드가 숨겨지는지 확인한다.
