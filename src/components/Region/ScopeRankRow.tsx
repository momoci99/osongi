import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { KILOGRAMS_PER_TON } from "../../const/Units";
import { SCOPE_RANK_LIST } from "../../const/RegionLayout";
import { regionColor, regionColorAlpha } from "../../const/Regions";
import type { ScopeLinkItem } from "../../types/region";

const NO_SEASON = "집계 없음";

type MetricBarProps = { percent: number; region: string };

/**
 * 정렬 기준 막대.
 * 이전에는 정렬 키인 물량이 12px 회색 글자뿐이라 제목을 읽어야만
 * 무엇으로 줄 세워졌는지 알 수 있었다. 막대가 그 역할을 대신한다.
 */
const MetricBar = ({ percent, region }: MetricBarProps) => (
  <Box
    sx={{
      height: SCOPE_RANK_LIST.BAR_HEIGHT,
      borderRadius: SCOPE_RANK_LIST.BAR_RADIUS,
      bgcolor: regionColorAlpha(region, SCOPE_RANK_LIST.TRACK_OPACITY),
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        width: `${percent}%`,
        height: "100%",
        borderRadius: SCOPE_RANK_LIST.BAR_RADIUS,
        bgcolor: regionColorAlpha(region, SCOPE_RANK_LIST.FILL_OPACITY),
      }}
    />
  </Box>
);

type DeltaBadgeProps = { delta: number };

/**
 * 기준 대비 단가 차이.
 * 방향을 화살표와 색 양쪽으로 표시한다. 색만으로 구분하면
 * 색각 이상에서 오름·내림이 같은 회색으로 읽힌다.
 */
const DeltaBadge = ({ delta }: DeltaBadgeProps) => (
  <Typography
    component="span"
    variant="caption"
    sx={{
      fontWeight: 600,
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
      color: delta > 0 ? "chart.up" : "chart.down",
    }}
  >
    {delta > 0 ? "▲" : "▼"}
    {Math.abs(delta).toFixed(0)}%
  </Typography>
);

export type ScopeRankRowProps = {
  item: ScopeLinkItem;
  /** 물량 순위. 집계가 없으면 null */
  rank: number | null;
  /** 현재 정렬 기준 지표를 나타내는 막대 폭 (%) */
  percent: number;
  /** 기준 단가 대비 차이 (%). 없으면 배지를 숨긴다 */
  delta: number | null;
  /** 지역 색 도트와 지역명을 함께 보일지. 한 지역 안의 목록에서는 불필요 */
  showRegion: boolean;
};

/**
 * 조합 한 줄.
 *
 * 좁은 화면에서는 막대 열을 접고 행 아래 얇은 띠로 값을 표현한다.
 * 같은 DOM을 CSS로만 바꿔 프리렌더 HTML과 하이드레이션 결과가 어긋나지 않게 한다.
 */
const ScopeRankRow = ({
  item,
  rank,
  percent,
  delta,
  showRegion,
}: ScopeRankRowProps) => {
  const muted = item.avgPricePerKg === null;

  return (
    <Box
      component={RouterLink}
      to={item.path}
      sx={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: {
          xs: SCOPE_RANK_LIST.COLUMNS.xs,
          sm: SCOPE_RANK_LIST.COLUMNS.sm,
        },
        alignItems: "center",
        columnGap: { xs: 1, sm: 2 },
        minHeight: SCOPE_RANK_LIST.ROW_MIN_HEIGHT,
        px: SCOPE_RANK_LIST.PANEL_PX,
        borderBottom: "1px solid",
        borderColor: "divider",
        textDecoration: "none",
        color: "inherit",
        opacity: muted ? SCOPE_RANK_LIST.MUTED_OPACITY : 1,
        transition: "background-color 0.15s ease",
        "&:hover": { bgcolor: "action.hover" },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: "-2px",
          borderRadius: "0.25rem",
        },
        "&::after": {
          content: '""',
          display: { xs: "block", sm: "none" },
          position: "absolute",
          left: 0,
          /** 행 구분선 바로 위에 얹어 위쪽 행에 속한 게이지로 읽히게 한다 */
          bottom: "1px",
          width: `${percent}%`,
          height: SCOPE_RANK_LIST.MOBILE_STRIP_HEIGHT,
          borderRadius: "0 2px 2px 0",
          bgcolor: regionColorAlpha(
            item.region,
            SCOPE_RANK_LIST.MOBILE_STRIP_OPACITY
          ),
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {rank ?? "–"}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
        {showRegion ? (
          <Box
            aria-hidden
            sx={{
              width: SCOPE_RANK_LIST.DOT_SIZE,
              height: SCOPE_RANK_LIST.DOT_SIZE,
              borderRadius: "50%",
              bgcolor: regionColor(item.region),
              flexShrink: 0,
            }}
          />
        ) : null}
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "1rem",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.name}
        </Typography>
        {showRegion ? (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", flexShrink: 0 }}
          >
            {item.region}
          </Typography>
        ) : null}
      </Box>

      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <MetricBar percent={percent} region={item.region} />
      </Box>

      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 500,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {item.totalQuantityKg === null
          ? "–"
          : (item.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1)}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "flex-end",
          gap: 0.75,
          minWidth: 0,
        }}
      >
        {delta !== null ? <DeltaBadge delta={delta} /> : null}
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "0.9375rem",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {item.avgPricePerKg === null
            ? NO_SEASON
            : item.avgPricePerKg.toLocaleString("ko-KR")}
        </Typography>
      </Box>
    </Box>
  );
};

export default ScopeRankRow;
