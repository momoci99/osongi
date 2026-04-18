# Phase D: 모바일 정보 밀도 최적화

## 목적
375px 폭 기준 첫 뷰포트 안에 KPI 카드 4개가 모두 들어오도록 헤더, 간격, 필터, 범례 배치를 압축한다.

## 예상 소요 시간
5~7시간

## 완료 기준
- Chrome DevTools `375 x 667` 기준으로 대시보드 진입 시 스크롤 없이 KPI 4개가 모두 보인다.
- KPI는 2×2 배치를 유지하면서 카드 간 간격이 모바일에서 축소된다.
- 시즌 중 헤더가 모바일에서 한 줄 압축 레이아웃으로 내려오고, 지역 선택 UI가 과도한 세로 공간을 차지하지 않는다.
- 데이터 분석 화면의 필터는 모바일에서 기본 접힘 상태이며, 버튼으로 열고 닫을 수 있다.
- 범례는 모바일에서 아이템당 추정 너비를 줄여 가로 오버플로 없이 래핑된다.

## 변경 파일 목록
- `src/components/Dashboard/DashboardKpiRow.tsx`
- `src/components/Dashboard/DashboardHeader.tsx`
- `src/utils/d3/legendLayout.ts`
- `src/components/DataAnalysis/GradeBreakdownChart.tsx`
- `src/components/DataAnalysis/AnalysisFilters.tsx`

## 구현 세부사항

### 1. `DashboardKpiRow.tsx`에서 모바일 간격 압축
현재도 `xs: 6`이라 2×2 컬럼 자체는 맞다. 다만 모바일에서 `spacing={2}`가 유지되어 세로 높이가 커지므로 간격을 분기한다.

```tsx
import { Grid } from "@mui/material";
import DashboardKpiCard from "./DashboardKpiCard";
import { GradeKeyToKorean } from "../../const/Common";
import type { DailyDataType } from "../../types/DailyData";

type DashboardKpiRowProps = {
  latestDaily: DailyDataType["latestDaily"];
  latestDate: string;
};

const DashboardKpiRow = ({ latestDaily, latestDate }: DashboardKpiRowProps) => (
  <Grid
    container
    spacing={{ xs: 1, sm: 2 }}
    sx={{ mt: { xs: 1, sm: 0 }, alignItems: "stretch" }}
  >
    <Grid size={{ xs: 6, sm: 3 }}>
      <DashboardKpiCard
        title="총 판매량"
        content={`${latestDaily.totalQuantityTodayKg.toLocaleString()} kg`}
        caption={latestDate}
      />
    </Grid>
    <Grid size={{ xs: 6, sm: 3 }}>
      <DashboardKpiCard
        title="최다 거래 등급"
        content={
          GradeKeyToKorean[
            latestDaily.topGradeByQuantity
              .gradeKey as keyof typeof GradeKeyToKorean
          ] || latestDaily.topGradeByQuantity.gradeKey
        }
        caption={latestDate}
      />
    </Grid>
    <Grid size={{ xs: 6, sm: 3 }}>
      <DashboardKpiCard
        title="최대 거래 지역"
        content={latestDaily.topRegion.region}
        caption={latestDate}
      />
    </Grid>
    <Grid size={{ xs: 6, sm: 3 }}>
      <DashboardKpiCard
        title="최대 거래 조합"
        content={latestDaily.topUnion.union}
        caption={latestDate}
      />
    </Grid>
  </Grid>
);

export default DashboardKpiRow;
```

### 2. `DashboardHeader.tsx` 모바일 압축
핵심은 `RegionSelector`의 하단 여백과 라벨 노출을 줄이는 것이다. 시즌 중 헤더에서는 `compact` 모드로 호출해 KPI 위 세로 공간을 확보한다.

```tsx
import {
  Box,
  Typography,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { AVAILABLE_REGIONS } from "../../const/Common";
import { useSettingsStore } from "../../stores/useSettingsStore";

type RegionSelectorProps = {
  compact?: boolean;
};

const RegionSelector = ({ compact = false }: RegionSelectorProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const myRegion = useSettingsStore((s) => s.myRegion);
  const setMyRegion = useSettingsStore((s) => s.setMyRegion);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: compact ? 0 : { xs: 1, sm: 2 },
      }}
    >
      {(!compact || !isMobile) && (
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, flexShrink: 0 }}
        >
          내 지역
        </Typography>
      )}

      <Select
        value={myRegion ?? ""}
        onChange={(e) =>
          setMyRegion(e.target.value as (typeof AVAILABLE_REGIONS)[number])
        }
        size="small"
        variant="outlined"
        sx={{
          minWidth: { xs: 88, sm: 100 },
          height: { xs: 36, sm: 40 },
          fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          fontWeight: 600,
        }}
      >
        {AVAILABLE_REGIONS.map((region) => (
          <MenuItem key={region} value={region}>
            {region}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

const InSeasonHeader = ({
  latestDate,
  isRefreshing,
  onRefresh,
}: Omit<DashboardHeaderProps, "inSeason">) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.75, sm: 1 },
        mb: { xs: 1, sm: 1.5 },
      }}
    >
      <Box
        sx={{
          width: { xs: 4, sm: 6 },
          height: { xs: 4, sm: 6 },
          borderRadius: "50%",
          bgcolor: theme.palette.primary.main,
          flexShrink: 0,
        }}
      />
      <RegionSelector compact />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          {latestDate} 기준
        </Typography>
        <Tooltip title="데이터 새로고침">
          <IconButton
            size="small"
            onClick={onRefresh}
            disabled={isRefreshing}
            sx={refreshIconSx(isRefreshing)}
          >
            <RefreshIcon sx={{ fontSize: "1rem" }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
```

### 3. `src/utils/d3/legendLayout.ts`에서 모바일 추정 너비 축소
현재 유틸은 `estimatedItemWidth`를 그대로 쓰므로 모바일에서 래핑이 늦다. `isMobile` 플래그를 받아 추정 너비를 줄인다.

```ts
export type LegendItem = {
  key: string;
  label: string;
  color: string;
};

/**
 * 모바일에서는 범례 아이템 추정 너비를 더 작게 계산합니다.
 */
const getAdjustedItemWidth = (
  estimatedItemWidth: number,
  isMobile: boolean,
): number =>
  isMobile
    ? Math.max(72, Math.floor(estimatedItemWidth * 0.82))
    : estimatedItemWidth;

/**
 * 범례 아이템을 최대 너비 기준으로 여러 행으로 나눕니다.
 */
export const groupLegendRows = (
  items: LegendItem[],
  maxWidth: number,
  estimatedItemWidth: number,
  isMobile = false,
): LegendItem[][] => {
  const adjustedItemWidth = getAdjustedItemWidth(
    estimatedItemWidth,
    isMobile,
  );
  const itemsPerRow = Math.max(
    1,
    Math.floor(maxWidth / Math.max(adjustedItemWidth, 1)),
  );

  const rows: LegendItem[][] = [];

  for (let index = 0; index < items.length; index += itemsPerRow) {
    rows.push(items.slice(index, index + itemsPerRow));
  }

  return rows;
};
```

`GradeBreakdownChart.tsx`에서 범례 열 계산을 직접 하지 말고 이 유틸을 받아 쓰는 쪽으로 같이 정리하면, 모바일 범례 줄바꿈이 한 곳에서 통제된다.

### 4. `AnalysisFilters.tsx` 모바일 접힘 UI 추가
데이터 분석 페이지는 첫 화면 정보 밀도를 높이기 위해 모바일에서 필터를 기본 접힘 상태로 바꾼다.

```tsx
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
  useTheme,
  type SelectChangeEvent,
} from "@mui/material";
import type { AnalysisFilters } from "../../utils/analysisUtils";
import SectionCard from "../common/SectionCard";

type AnalysisFiltersProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
  onResetFilters: () => void;
};

const AnalysisFiltersComponent = ({
  filters,
  onFiltersChange,
  onResetFilters,
}: AnalysisFiltersProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <SectionCard sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            필터
          </Typography>
          {isMobile && (
            <Button
              size="small"
              variant="text"
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              }
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? "접기" : "열기"}
            </Button>
          )}
        </Box>
        <Button variant="outlined" size="small" onClick={onResetFilters}>
          초기화
        </Button>
      </Box>

      <Collapse in={!isMobile || filtersOpen} timeout="auto" unmountOnExit={isMobile}>
        <Grid container spacing={{ xs: 1.25, sm: 2 }}>
          {/** 기존 Grid 내용 유지 */}
        </Grid>
      </Collapse>
    </SectionCard>
  );
};

export default AnalysisFiltersComponent;
```

## 검증 절차
1. Chrome DevTools에서 `375 x 667` 프리셋으로 대시보드를 연다.
2. 시즌 중 상태에서 헤더와 KPI 4개가 첫 화면 안에 모두 보이는지 확인한다.
3. KPI 카드가 2×2로 유지되고 카드 사이 간격이 모바일에서 더 촘촘해졌는지 확인한다.
4. 데이터 분석 화면에서 필터가 기본 접힘 상태인지 확인하고, `열기` 버튼으로 정상 토글되는지 확인한다.
5. 모바일에서 등급 비중 차트 범례가 가로 스크롤 없이 여러 줄로 래핑되는지 확인한다.
6. `sm` 이상 폭으로 되돌렸을 때 필터가 항상 펼쳐지고 기존 데스크톱 레이아웃이 깨지지 않는지 확인한다.
