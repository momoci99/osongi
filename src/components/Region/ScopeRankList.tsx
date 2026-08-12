import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import ScopeSectionHeading from "./ScopeSectionHeading";
import ScopeRankRow from "./ScopeRankRow";
import { SCOPE_DELTA } from "../../const/Charts";
import { SCOPE_RANK_LIST } from "../../const/RegionLayout";
import { UNION_METRIC_HEADERS } from "../../const/Regions";
import type { ScopeLinkItem, UnionSortKey } from "../../types/region";

type ScopeRankListProps = {
  title: string;
  /** 제목 아래 보조 설명 */
  caption?: string;
  items: ScopeLinkItem[];
  emptyMessage: string;
  /** 제목 오른쪽 컨트롤 (정렬 토글 등) */
  action?: ReactNode;
  /** 목록 위에 놓을 필터 등 */
  toolbar?: ReactNode;
  /**
   * 기준 단가. 주면 각 행에 ±% 배지가 붙는다.
   * 상세 페이지에서 "지금 보는 조합 대비 얼마나 비싼가"를 바로 읽히게 하는 용도.
   */
  compareToPricePerKg?: number | null;
  /** 지역 색 도트와 지역명 표시 여부. 여러 지역이 섞인 목록에서만 켠다 */
  showRegion?: boolean;
  /** 막대가 나타낼 지표. 목록의 정렬 기준과 항상 일치시킨다 */
  metric?: UnionSortKey;
  /** 첫 섹션이면 위 여백을 줄인다 */
  dense?: boolean;
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

/** 막대가 그릴 값의 범위. 물량은 0부터, 단가는 목록의 최저값부터 잰다 */
type MetricScale = { min: number; max: number };

/**
 * 막대 기준 범위.
 *
 * 물량은 0이 의미 있는 바닥이라 최대값만 있으면 된다.
 * 단가는 조합 간 차이가 16만~28만 구간에 몰려 있어 0부터 그리면
 * 모든 막대가 60% 넘게 차 차이가 사라진다. 목록의 최저~최고를 축으로 잡는다.
 */
const metricScale = (items: ScopeLinkItem[], metric: UnionSortKey): MetricScale => {
  const values = items
    .map((item) => (metric === "quantity" ? item.totalQuantityKg : item.avgPricePerKg))
    .filter((value): value is number => value !== null);

  if (values.length === 0) return { min: 0, max: 0 };
  const max = Math.max(...values);

  return metric === "quantity" ? { min: 0, max } : { min: Math.min(...values), max };
};

const metricValue = (item: ScopeLinkItem, metric: UnionSortKey): number | null =>
  metric === "quantity" ? item.totalQuantityKg : item.avgPricePerKg;

/** 막대 폭. 0에 가까운 값도 존재는 보이게 한다 */
const barPercent = (value: number | null, scale: MetricScale): number => {
  if (value === null || scale.max <= 0) return 0;
  const span = scale.max - scale.min;
  /** 값이 모두 같으면 비교할 것이 없으니 가득 채운다 */
  const ratio = span <= 0 ? 1 : (value - scale.min) / span;

  return Math.max(SCOPE_RANK_LIST.MIN_BAR_PERCENT, Math.round(ratio * 100));
};

type ColumnHeaderProps = { showRegion: boolean; metric: UnionSortKey };

/**
 * 열 제목 줄.
 * 값 옆마다 "평균", "원/kg", "톤"을 반복해 붙이면 행이 시끄러워진다.
 * 단위를 머리글로 한 번만 선언하고 행에는 숫자만 남긴다.
 */
const ColumnHeader = ({ showRegion, metric }: ColumnHeaderProps) => {
  const cellSx = { color: "text.secondary", whiteSpace: "nowrap" } as const;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: SCOPE_RANK_LIST.COLUMNS.xs,
          sm: SCOPE_RANK_LIST.COLUMNS.sm,
        },
        alignItems: "center",
        columnGap: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 1.5 },
        pb: 0.75,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="caption" sx={{ ...cellSx, textAlign: "right" }}>
        #
      </Typography>
      <Typography variant="caption" sx={cellSx}>
        {showRegion ? "조합 · 지역" : "조합"}
      </Typography>
      <Typography
        variant="caption"
        sx={{ ...cellSx, display: { xs: "none", sm: "block" } }}
      >
        {UNION_METRIC_HEADERS[metric]}
      </Typography>
      <Typography variant="caption" sx={{ ...cellSx, textAlign: "right" }}>
        톤
      </Typography>
      <Typography variant="caption" sx={{ ...cellSx, textAlign: "right" }}>
        원/kg
      </Typography>
    </Box>
  );
};

/**
 * 조합·지역 상호 링크 목록.
 *
 * 카드 그리드는 20장이 균일한 블록으로 깔려 정렬 기준도 값의 크기도 읽히지 않았다.
 * 순위·물량 막대·단가를 한 축에 정렬한 랭크 리스트로 바꿔 스캔이 가능하게 한다.
 * 색인 관점에서 각 페이지가 서로를 링크해야 크롤러가 25개 페이지를 모두 순회한다.
 */
const ScopeRankList = ({
  title,
  caption,
  items,
  emptyMessage,
  action,
  toolbar,
  compareToPricePerKg,
  showRegion = false,
  metric = "quantity",
  dense = false,
}: ScopeRankListProps) => {
  const scale = metricScale(items, metric);
  let rank = 0;

  return (
    <Box>
      <ScopeSectionHeading
        title={title}
        caption={caption}
        action={action}
        dense={dense}
      />
      {toolbar}
      {items.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>
          {emptyMessage}
        </Typography>
      ) : (
        <Box component="nav" aria-label={title}>
          <ColumnHeader showRegion={showRegion} metric={metric} />
          {items.map((item) => {
            /** 집계가 없는 조합은 순위를 매기지 않는다 */
            const rowRank = item.totalQuantityKg === null ? null : ++rank;

            return (
              <ScopeRankRow
                key={item.path}
                item={item}
                rank={rowRank}
                percent={barPercent(metricValue(item, metric), scale)}
                delta={priceDelta(item.avgPricePerKg, compareToPricePerKg)}
                showRegion={showRegion}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default ScopeRankList;
