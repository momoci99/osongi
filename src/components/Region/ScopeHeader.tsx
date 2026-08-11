import { Box, Breadcrumbs, Chip, Link, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { regionPath } from "../../const/Regions";
import { buildScopeNarrative, scopeLabel } from "../../utils/regionNarrative";
import type { ScopeStats } from "../../types/region";

type ScopeHeaderProps = {
  stats: ScopeStats;
  latestDate: string;
};

/**
 * 지역·조합 페이지 상단.
 * H1 하나와 요약 문단을 두어 검색엔진이 페이지 주제를 문장으로 파악할 수 있게 한다.
 */
const ScopeHeader = ({ stats, latestDate }: ScopeHeaderProps) => {
  const theme = useTheme();
  const isUnion = stats.name !== stats.region;
  const paragraphs = buildScopeNarrative(stats);

  return (
    <Box component="header" sx={{ mb: 3 }}>
      <Breadcrumbs
        aria-label="현재 위치"
        sx={{ mb: 1.5, fontSize: "0.8125rem" }}
      >
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          송이 시세
        </Link>
        {isUnion ? (
          <Link
            component={RouterLink}
            to={regionPath(stats.region)}
            underline="hover"
            color="inherit"
          >
            {stats.region}
          </Link>
        ) : (
          <Typography variant="body2" color="text.primary">
            {stats.region}
          </Typography>
        )}
        {isUnion && (
          <Typography variant="body2" color="text.primary">
            {stats.name}
          </Typography>
        )}
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 1,
        }}
      >
        <Typography
          component="h1"
          variant="h4"
          sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "1.875rem" } }}
        >
          {isUnion ? `${stats.name} 송이 시세` : `${stats.region} 송이 시세`}
        </Typography>
        <Chip
          label={isUnion ? `${stats.region} ${stats.name}산림조합` : "지역 전체"}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      </Box>

      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, mb: 2 }}
      >
        {scopeLabel(stats)} · 최신 공판 데이터 {latestDate}
      </Typography>

      {paragraphs.map((paragraph) => (
        <Typography
          key={paragraph.slice(0, 24)}
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            lineHeight: 1.75,
            mb: 0.75,
            maxWidth: "68ch",
          }}
        >
          {paragraph}
        </Typography>
      ))}
    </Box>
  );
};

export default ScopeHeader;
