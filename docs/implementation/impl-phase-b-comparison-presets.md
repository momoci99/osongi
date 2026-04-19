# Phase B: 비교 프리셋 Chip 버튼

## 목적
비교 모드에 빠른 프리셋을 추가해 사용자가 날짜를 직접 입력하지 않아도 `작년 동기`, `직전 1주`, `시즌 시작부터` 비교 범위를 한 번에 선택할 수 있게 한다.

## 예상 소요 시간
3~4시간

## 완료 기준
- 비교 모드 활성화 시 `ComparisonToggle`에 프리셋 Chip 그룹이 표시된다.
- `작년 동기`, `직전 1주`, `시즌 시작부터` 중 하나를 누르면 `comparisonStartDate`와 `comparisonEndDate`가 즉시 갱신된다.
- 스위치를 켜는 순간 기본 프리셋이 자동 적용된다.
- 사용자가 날짜 필드를 직접 수정하면 선택된 프리셋 표시가 해제된다.
- 비교 데이터 로드 로직 변경 없이 기존 `filters.comparisonEnabled` 흐름을 그대로 재사용한다.

## 변경 파일 목록
- `src/utils/analysis/dateRange.ts`
- `src/components/DataAnalysis/Filters/ComparisonToggle.tsx`

## 구현 세부사항

### 1. `src/utils/analysis/dateRange.ts`에 프리셋 헬퍼 추가
현재 파일에는 `getComparisonDateRange`만 있으므로, Chip 클릭에서 바로 쓸 수 있는 보조 함수 2개를 추가한다.

```ts
/**
 * 기준 시작일 바로 이전 7일 구간을 반환합니다.
 */
export const getPresetLastWeek = (
  baseStartDate: Date,
): { startDate: Date; endDate: Date } => {
  const endDate = new Date(baseStartDate);
  endDate.setDate(endDate.getDate() - 1);

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - DEFAULT_DATE_RANGE.DAYS_OFFSET);

  return { startDate, endDate };
};

/**
 * 선택 종료일이 속한 가장 가까운 시즌의 시작일부터 범위를 반환합니다.
 */
export const getPresetSeasonStart = (
  baseEndDate: Date,
): { startDate: Date; endDate: Date } => {
  const baseDateOnly = getDateOnly(baseEndDate);
  const seasonYear = isMushroomSeason(baseDateOnly)
    ? baseDateOnly.getFullYear()
    : baseDateOnly.getFullYear() - DATE_CONSTANTS.MONTH_OFFSET;

  const startDate = new Date(
    seasonYear,
    MUSHROOM_SEASON.START_MONTH - DATE_CONSTANTS.MONTH_OFFSET,
    DEFAULT_DATE_RANGE.FALLBACK_START_DAY,
  );

  const seasonEndDate = new Date(seasonYear, MUSHROOM_SEASON.END_MONTH, 0);
  const endDate = baseDateOnly > seasonEndDate ? seasonEndDate : baseDateOnly;

  return { startDate, endDate };
};
```

### 2. `ComparisonToggle.tsx`에 Chip 그룹과 `selectedPreset` 상태 추가
현재 구현은 스위치와 날짜 필드만 있으므로, 프리셋 상태를 컴포넌트 내부에서 관리하고 스위치 ON 시 기본 프리셋을 자동 적용한다.

```tsx
import { useState } from "react";
import {
  Box,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import type { AnalysisFilters } from "../../../utils/analysisUtils";
import {
  getComparisonDateRange,
  getPresetLastWeek,
  getPresetSeasonStart,
} from "../../../utils/analysisUtils";
import DateRangePickerField from "./DateRangePicker";

type ComparisonToggleProps = {
  filters: AnalysisFilters;
  onFiltersChange: (filters: AnalysisFilters) => void;
};

type ComparisonPreset = "last-year" | "last-week" | "season-start";

const ComparisonToggle = ({
  filters,
  onFiltersChange,
}: ComparisonToggleProps) => {
  const [selectedPreset, setSelectedPreset] =
    useState<ComparisonPreset | null>("last-year");

  const applyPreset = (preset: ComparisonPreset) => {
    const nextRange =
      preset === "last-week"
        ? getPresetLastWeek(filters.startDate)
        : preset === "season-start"
          ? getPresetSeasonStart(filters.endDate)
          : getComparisonDateRange(filters.startDate, filters.endDate);

    setSelectedPreset(preset);
    onFiltersChange({
      ...filters,
      comparisonEnabled: true,
      comparisonStartDate: nextRange.startDate,
      comparisonEndDate: nextRange.endDate,
    });
  };

  const handleToggle = () => {
    const enabled = !filters.comparisonEnabled;

    if (!enabled) {
      setSelectedPreset("last-year");
      onFiltersChange({
        ...filters,
        comparisonEnabled: false,
        comparisonStartDate: null,
        comparisonEndDate: null,
      });
      return;
    }

    applyPreset(selectedPreset ?? "last-year");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={filters.comparisonEnabled}
            onChange={handleToggle}
            size="small"
          />
        }
        label={
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            비교 모드
          </Typography>
        }
      />

      {filters.comparisonEnabled && (
        <>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              label="작년 동기"
              clickable
              color={selectedPreset === "last-year" ? "primary" : "default"}
              variant={selectedPreset === "last-year" ? "filled" : "outlined"}
              onClick={() => applyPreset("last-year")}
            />
            <Chip
              label="직전 1주"
              clickable
              color={selectedPreset === "last-week" ? "primary" : "default"}
              variant={selectedPreset === "last-week" ? "filled" : "outlined"}
              onClick={() => applyPreset("last-week")}
            />
            <Chip
              label="시즌 시작부터"
              clickable
              color={selectedPreset === "season-start" ? "primary" : "default"}
              variant={
                selectedPreset === "season-start" ? "filled" : "outlined"
              }
              onClick={() => applyPreset("season-start")}
            />
          </Stack>

          <Box sx={{ flex: 1, minWidth: 280 }}>
            <DateRangePickerField
              startDate={filters.comparisonStartDate}
              endDate={filters.comparisonEndDate}
              onStartDateChange={(date) => {
                if (!date) return;
                setSelectedPreset(null);
                onFiltersChange({
                  ...filters,
                  comparisonStartDate: date,
                });
              }}
              onEndDateChange={(date) => {
                if (!date) return;
                setSelectedPreset(null);
                onFiltersChange({
                  ...filters,
                  comparisonEndDate: date,
                });
              }}
              startLabel="비교 시작일"
              endLabel="비교 종료일"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default ComparisonToggle;
```

### 3. 동작 원칙
- 스위치 ON 기본값은 `작년 동기`로 둔다.
- 프리셋을 누르면 비교 날짜만 바꾸고, 기존 지역·조합·등급 필터는 유지한다.
- 수동 날짜 편집이 발생하면 `selectedPreset`을 `null`로 되돌려 Chip의 선택 상태를 해제한다.
- `ComparisonToggle`는 여전히 `AnalysisFilters` 전체를 부모에서 받기 때문에 상태 분산 없이 유지된다.

## 검증 절차
1. 데이터 분석 화면에서 비교 모드를 켠다.
2. 처음 켰을 때 `작년 동기` Chip이 선택된 상태인지 확인한다.
3. `직전 1주`를 누르면 시작일과 종료일이 메인 시작일 직전 7일로 바뀌는지 확인한다.
4. `시즌 시작부터`를 누르면 비교 시작일이 해당 시즌의 8월 1일로 바뀌는지 확인한다.
5. 날짜 피커에서 비교 시작일이나 종료일을 직접 변경한 뒤 선택된 Chip 강조가 해제되는지 확인한다.
6. 각 프리셋 클릭 후 네트워크 요청 또는 데이터 갱신이 기존 비교 모드와 동일하게 동작하는지 확인한다.
