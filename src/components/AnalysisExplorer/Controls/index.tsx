import { FormControlLabel, Switch } from "@mui/material";
import ControlSegment from "./ControlSegment";
import ControlSelect from "./ControlSelect";
import ScopeFilter from "./ScopeFilter";
import SidebarSection from "./SidebarSection";
import ExplorerPanel from "../ExplorerPanel";
import {
  ALIGN_LABELS,
  COMPARE_LABELS,
  GRANULARITY_LABELS,
  GROUP_BY_LABELS,
  METRIC_LABELS,
} from "../../../utils/analysisQuery/labels";
import { VIEW_RULES } from "../../../utils/analysisQuery/viewRules";
import type { AnalysisQuery } from "../../../utils/analysisQuery/types";

type ExplorerControlsProps = {
  query: AnalysisQuery;
  onQueryChange: (next: AnalysisQuery) => void;
};

const ALIGNS = Object.keys(ALIGN_LABELS) as AnalysisQuery["align"][];

/**
 * 필터 사이드바 — 뷰별 보기 설정 + 범위 필터를 세로로 쌓는다.
 * 현재 뷰에서 선택지가 하나뿐인 컨트롤은 숨겨 조작 가능한 것만 보이게 한다.
 */
const ExplorerControls = ({ query, onQueryChange }: ExplorerControlsProps) => {
  const rule = VIEW_RULES[query.view];
  const update = (patch: Partial<AnalysisQuery>) => onQueryChange({ ...query, ...patch });
  /** 조절할 옵션이 하나도 없는 뷰(커버리지)는 빈 줄을 남기지 않는다 */
  const hasOptions =
    rule.metrics.length > 1 ||
    rule.groupBy.length > 1 ||
    rule.granularity.length > 1 ||
    rule.align ||
    rule.compare.length > 1 ||
    rule.commonUnits;

  return (
    <ExplorerPanel flush>
      {hasOptions ? (
        <SidebarSection title="보기 설정">
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
                mr: 0,
                justifyContent: "space-between",
                flexDirection: "row-reverse",
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "text.secondary",
                },
              }}
            />
          ) : null}
        </SidebarSection>
      ) : null}

      <ScopeFilter query={query} onChange={update} />
    </ExplorerPanel>
  );
};

export default ExplorerControls;
