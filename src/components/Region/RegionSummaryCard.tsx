import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";
import RegionSparkline from "./RegionSparkline";
import { KILOGRAMS_PER_TON } from "../../const/Units";
import { SCOPE_RANK_LIST } from "../../const/RegionLayout";
import { regionColor, regionPath } from "../../const/Regions";
import type { RegionScopeStats } from "../../types/region";

type RegionSummaryCardProps = { region: RegionScopeStats };

const NO_SEASON = "집계 없음";

/** 스파크라인 옆 기간 라벨. 데이터가 한 해뿐이면 연도 하나만 */
const yearRangeLabel = (years: number[]): string => {
  if (years.length === 0) return "";
  const first = years[0];
  const last = years[years.length - 1];
  return first === last ? `${first}` : `${first}–${String(last).slice(2)}`;
};

/**
 * 지역 요약 카드.
 *
 * 왼쪽에 이름·평균 단가·공판량, 오른쪽에 연도별 단가 스파크라인을 둔다.
 * 값은 숫자와 단위를 분리해 좁은 폭에서도 줄바꿈되지 않게 한다.
 */
const RegionSummaryCard = ({ region }: RegionSummaryCardProps) => {
  const season = region.season;
  const color = regionColor(region.name);
  const years = region.yearly.map((entry) => entry.year);

  return (
    <Box
      component={RouterLink}
      to={regionPath(region.name)}
      sx={{
        display: "flex",
        alignItems: { xs: "center", sm: "flex-end" },
        justifyContent: "space-between",
        gap: 1.5,
        height: "100%",
        px: { xs: 1.75, sm: 2.25 },
        py: { xs: 1.5, sm: 2 },
        borderRadius: "0.75rem",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: color,
          boxShadow: (theme) =>
            theme.palette.mode === "light"
              ? "0 2px 10px rgba(0,0,0,0.06)"
              : "0 2px 10px rgba(0,0,0,0.24)",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: "2px",
        },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box
            aria-hidden
            sx={{
              width: SCOPE_RANK_LIST.DOT_SIZE,
              height: SCOPE_RANK_LIST.DOT_SIZE,
              borderRadius: "50%",
              bgcolor: color,
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{ fontWeight: 700, fontSize: "1.0625rem", lineHeight: 1.3 }}
          >
            {region.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            산림조합 {region.unions.length}곳
          </Typography>
        </Box>

        <Box
          sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mt: { xs: 0.5, sm: 1.5 } }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: 700,
              fontSize: "1.5rem",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {season ? season.avgPricePerKg.toLocaleString("ko-KR") : NO_SEASON}
          </Typography>
          {season ? (
            <Typography
              component="span"
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              원/kg
            </Typography>
          ) : null}
        </Box>

        {season ? (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mt: 0.25 }}
          >
            공판량 {(season.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1)}톤
          </Typography>
        ) : null}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 0.5,
          flexShrink: 0,
        }}
      >
        <RegionSparkline yearly={region.yearly} color={color} />
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: { xs: "none", sm: "block" } }}
        >
          {yearRangeLabel(years)} 단가
        </Typography>
      </Box>
    </Box>
  );
};

export default RegionSummaryCard;
