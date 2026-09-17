import { Box, Divider, FormControlLabel, Switch } from "@mui/material";
import ViewTabs from "./ViewTabs";
import ControlSegment from "./ControlSegment";
import ControlSelect from "./ControlSelect";
import ScopeFilter from "./ScopeFilter";
import ExplorerPanel from "../ExplorerPanel";
import {
  ALIGN_LABELS,
  COMPARE_LABELS,
  GRANULARITY_LABELS,
  GROUP_BY_LABELS,
  METRIC_LABELS,
} from "../../../utils/analysisQuery/labels";
import { coerceQueryToView, VIEW_RULES } from "../../../utils/analysisQuery/viewRules";
import type { AnalysisQuery } from "../../../utils/analysisQuery/types";

type ExplorerControlsProps = {
  query: AnalysisQuery;
  onQueryChange: (next: AnalysisQuery) => void;
  /** 뷰 탭 호버 시 결과 미리 계산 */
  onPrefetch?: (query: AnalysisQuery) => void;
};

const ALIGNS = Object.keys(ALIGN_LABELS) as AnalysisQuery["align"][];

/**
 * 뷰 탭 + 뷰별 컨트롤 + 범위 필터.
 * 현재 뷰에서 선택지가 하나뿐인 컨트롤은 숨겨 조작 가능한 것만 보이게 한다.
 */
const ExplorerControls = ({ query, onQueryChange, onPrefetch }: ExplorerControlsProps) => {
  const rule = VIEW_RULES[query.view];
  const update = (patch: Partial<AnalysisQuery>) => onQueryChange({ ...query, ...patch });

  return (
    <ExplorerPanel flush>
      <Box sx={{ borderBottom: "1px solid", borderColor: "surface.border", px: { xs: 0.5, sm: 1 } }}>
        <ViewTabs
          view={query.view}
          onChange={(view) => onQueryChange(coerceQueryToView(query, view))}
          onPrefetch={(view) => onPrefetch?.(coerceQueryToView(query, view))}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: 2.5,
          rowGap: 1.25,
          px: { xs: 1.75, sm: 2.25 },
          py: 1.5,
        }}
      >
        {rule.metrics.length > 1 ? (
          <ControlSelect
            label="지표"
            value={query.metric}
            options={rule.metrics}
            labels={METRIC_LABELS}
            onChange={(metric) => update({ metric })}
          />
        ) : null}
        {rule.groupBy.length > 1 ? (
          <ControlSelect
            label="묶기"
            value={query.groupBy}
            options={rule.groupBy}
            labels={GROUP_BY_LABELS}
            onChange={(groupBy) => update({ groupBy })}
          />
        ) : null}
        {rule.granularity.length > 1 ? (
          <ControlSegment
            label="단위"
            value={query.granularity}
            options={rule.granularity}
            labels={GRANULARITY_LABELS}
            onChange={(granularity) => update({ granularity })}
          />
        ) : null}
        {rule.align ? (
          <ControlSegment
            label="정렬"
            value={query.align}
            options={ALIGNS}
            labels={ALIGN_LABELS}
            onChange={(align) => update({ align })}
          />
        ) : null}
        {rule.compare.length > 1 ? (
          <ControlSegment
            label="비교"
            value={query.compare}
            options={rule.compare}
            labels={COMPARE_LABELS}
            onChange={(compare) => update({ compare })}
          />
        ) : null}
        {rule.commonUnits ? (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={query.commonUnitsOnly}
                onChange={(event) => update({ commonUnitsOnly: event.target.checked })}
              />
            }
            label="공통 조합만"
            sx={{
              ml: 0,
              "& .MuiFormControlLabel-label": {
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "text.secondary",
              },
            }}
          />
        ) : null}
      </Box>

      <Divider />

      <Box sx={{ px: { xs: 1.75, sm: 2.25 }, py: 1.5 }}>
        <ScopeFilter query={query} onChange={update} />
      </Box>
    </ExplorerPanel>
  );
};

export default ExplorerControls;
