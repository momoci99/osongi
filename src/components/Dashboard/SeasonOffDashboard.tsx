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
        <Skeleton
          variant="rounded"
          height={200}
          sx={{ mt: 3, borderRadius: "0.75rem" }}
        />
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
