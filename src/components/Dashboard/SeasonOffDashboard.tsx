import { Box, Grid, Skeleton } from "@mui/material";
import useSeasonOffData from "../../hooks/useSeasonOffData";
import SeasonSummaryCards from "./SeasonOff/SeasonSummaryCards";
import YearlyTrendBars from "./SeasonOff/YearlyTrendBars";
import MonthlyPatternList from "./SeasonOff/MonthlyPatternList";
import RegionRankingList from "./SeasonOff/RegionRankingList";

type SeasonOffDashboardProps = {
  myRegion?: string | null;
};

const SeasonOffDashboard = ({ myRegion }: SeasonOffDashboardProps) => {
  const data = useSeasonOffData(myRegion);

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
