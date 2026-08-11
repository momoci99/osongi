import { Box, Grid, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { KILOGRAMS_PER_TON } from "../../const/Units";
import { SCOPE_DELTA } from "../../const/Charts";
import { regionColor } from "../../const/Regions";

export type ScopeLinkItem = {
  name: string;
  path: string;
  avgPricePerKg: number | null;
  totalQuantityKg: number | null;
  /** 지역 색 도트를 붙일 때 전달 (허브의 조합 목록) */
  region?: string;
  /** 카드 안에 덧붙일 보조 설명 (조합 수 등) */
  note?: string;
};

type ScopeLinkGridProps = {
  title: string;
  items: ScopeLinkItem[];
  emptyMessage: string;
  /**
   * 기준 단가. 주면 각 항목에 ±% 배지가 붙는다.
   * 상세 페이지에서 "지금 보는 조합 대비 얼마나 비싼가"를 바로 읽히게 하는 용도.
   */
  compareToPricePerKg?: number | null;
  /** 지역 카드처럼 크게 보여줄 때 */
  emphasized?: boolean;
};

/** 기준 대비 차이. 임계값 미만은 굳이 표시하지 않는다 */
const priceDelta = (
  price: number | null,
  base: number | null | undefined
): number | null => {
  if (price === null || !base) return null;
  const delta = ((price - base) / base) * 100;
  return Math.abs(delta) < SCOPE_DELTA.FLAT_THRESHOLD ? null : delta;
};

type DeltaBadgeProps = { delta: number };

const DeltaBadge = ({ delta }: DeltaBadgeProps) => (
  <Typography
    component="span"
    variant="caption"
    sx={{
      fontWeight: 600,
      whiteSpace: "nowrap",
      color: delta > 0 ? "chart.price.main" : "text.secondary",
    }}
  >
    {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}%
  </Typography>
);

type ScopeLinkCardProps = {
  item: ScopeLinkItem;
  delta: number | null;
  emphasized: boolean;
};

/**
 * xs 에서는 한 줄 리스트 행(좌 이름 / 우 단가), sm 이상에서는 카드.
 * 같은 DOM을 CSS로만 바꿔 프리렌더 HTML과 하이드레이션 결과가 어긋나지 않게 한다.
 */
const ScopeLinkCard = ({ item, delta, emphasized }: ScopeLinkCardProps) => (
  <Box
    component={RouterLink}
    to={item.path}
    sx={{
      display: "flex",
      flexDirection: { xs: "row", sm: "column" },
      alignItems: { xs: "center", sm: "stretch" },
      justifyContent: "space-between",
      gap: { xs: 1, sm: 0.25 },
      height: "100%",
      px: { xs: 1.5, sm: emphasized ? 2 : 1.5 },
      py: { xs: 1.25, sm: emphasized ? 2 : 1.5 },
      borderRadius: "0.75rem",
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      textDecoration: "none",
      color: "inherit",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      "&:hover": {
        borderColor: "primary.main",
        boxShadow: (theme) =>
          theme.palette.mode === "light"
            ? "0 2px 8px rgba(0,0,0,0.06)"
            : "0 2px 8px rgba(0,0,0,0.2)",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
      {item.region ? (
        <Box
          aria-hidden
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: regionColor(item.region),
            flexShrink: 0,
          }}
        />
      ) : null}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant={emphasized ? "h6" : "body2"}
          sx={{
            fontWeight: 700,
            lineHeight: 1.3,
            fontSize: emphasized ? { xs: "1.0625rem", sm: "1.25rem" } : undefined,
          }}
        >
          {item.name}
        </Typography>
        {item.note ? (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {item.note}
          </Typography>
        ) : null}
      </Box>
    </Box>

    <Box
      sx={{
        textAlign: { xs: "right", sm: "left" },
        mt: { xs: 0, sm: emphasized ? 1 : 0.5 },
        flexShrink: 0,
      }}
    >
      {/** 지역 카드는 단가를 크게 세워 조합 카드와 위계를 벌린다 */}
      {emphasized && item.avgPricePerKg ? (
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.25 }}>
          <Typography
            component="span"
            sx={{
              fontWeight: 700,
              fontSize: "1.375rem",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {item.avgPricePerKg.toLocaleString("ko-KR")}
          </Typography>
          <Typography
            component="span"
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 600 }}
          >
            원/kg
          </Typography>
        </Box>
      ) : (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "text.secondary",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {item.avgPricePerKg
            ? `평균 ${item.avgPricePerKg.toLocaleString("ko-KR")}원/kg`
            : "최신 시즌 집계 없음"}
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          justifyContent: { xs: "flex-end", sm: "flex-start" },
          alignItems: "baseline",
        }}
      >
        {item.totalQuantityKg !== null ? (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(item.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1)}톤
          </Typography>
        ) : null}
        {delta !== null ? <DeltaBadge delta={delta} /> : null}
      </Box>
    </Box>
  </Box>
);

/**
 * 조합·지역 상호 링크 목록.
 * 색인 관점에서 각 페이지가 서로를 링크해야 크롤러가 25개 페이지를 모두 순회한다.
 */
const ScopeLinkGrid = ({
  title,
  items,
  emptyMessage,
  compareToPricePerKg,
  emphasized = false,
}: ScopeLinkGridProps) => (
  <Box component="nav" aria-label={title} sx={{ mb: 3 }}>
    <Typography
      component="h2"
      variant="h6"
      sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5 }}
    >
      {title}
    </Typography>
    {items.length === 0 ? (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {emptyMessage}
      </Typography>
    ) : (
      <Grid container spacing={1}>
        {items.map((item) => (
          <Grid
            key={item.path}
            size={
              emphasized
                ? { xs: 12, sm: 4 }
                : { xs: 12, sm: 6, md: 4, lg: 3 }
            }
          >
            <ScopeLinkCard
              item={item}
              delta={priceDelta(item.avgPricePerKg, compareToPricePerKg)}
              emphasized={emphasized}
            />
          </Grid>
        ))}
      </Grid>
    )}
  </Box>
);

export default ScopeLinkGrid;
