import { Box, Breadcrumbs, Chip, Link, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { regionPath } from "../../const/Regions";
import { SCOPE_HERO } from "../../const/RegionLayout";
import { buildScopeNarrative, scopeLabel } from "../../utils/regionNarrative";
import type { ScopeStats } from "../../types/region";

type ScopeHeaderProps = {
  stats: ScopeStats;
  latestDate: string;
};

/**
 * 요약 문단.
 * 14px 본문이 68ch로 흐르면 줄이 길어 눈이 다음 줄을 놓친다.
 * 글자를 한 단계 키우고 폭을 좁혀 읽는 리듬을 맞춘다.
 */
const NARRATIVE_SX = {
  color: "text.secondary",
  fontSize: "0.9375rem",
  lineHeight: 1.8,
  mb: 1,
  maxWidth: SCOPE_HERO.TEXT_MAX_WIDTH,
} as const;

const DETAILS_SX = {
  mt: 0.5,
  "&[open] summary::after": { content: '"▲"' },
} as const;

const SUMMARY_SX = {
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "text.secondary",
  listStyle: "none",
  mb: 1,
  "&::-webkit-details-marker": { display: "none" },
  "&::after": { content: '"▼"', fontSize: "0.625rem", opacity: 0.7 },
  "&:hover": { color: "text.primary" },
} as const;

/**
 * 지역·조합 페이지 상단.
 * H1 하나와 요약 문단을 두어 검색엔진이 페이지 주제를 문장으로 파악할 수 있게 한다.
 */
const ScopeHeader = ({ stats, latestDate }: ScopeHeaderProps) => {
  const theme = useTheme();
  const isUnion = stats.name !== stats.region;
  const [leadParagraph, ...restParagraphs] = buildScopeNarrative(stats);

  return (
    <Box component="header">
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

      {leadParagraph && (
        <Typography variant="body2" sx={NARRATIVE_SX}>
          {leadParagraph}
        </Typography>
      )}

      {restParagraphs.length > 0 && (
        /**
         * 요약 문단은 색인 자산이라 지울 수 없지만, 전부 펼쳐 두면
         * 지표가 스크롤 아래로 밀린다. native details 로 접어 두면
         * DOM에는 남아 크롤러가 읽고 프리렌더 HTML과도 구조가 같다.
         */
        <Box component="details" sx={DETAILS_SX}>
          <Box component="summary" sx={SUMMARY_SX}>
            시즌 요약 자세히 보기
          </Box>
          {restParagraphs.map((paragraph) => (
            <Typography
              key={paragraph.slice(0, 24)}
              variant="body2"
              sx={NARRATIVE_SX}
            >
              {paragraph}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ScopeHeader;
