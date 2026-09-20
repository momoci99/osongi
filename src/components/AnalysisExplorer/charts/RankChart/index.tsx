import { Box, Typography, useTheme } from "@mui/material";
import useDrawRankChart from "./useDrawRankChart";
import { resolveSeriesColor } from "../seriesColor";
import type { RankItem } from "../../../../utils/analysisQuery/rankModel";
import { GROUP_BY_LABELS, METRIC_LABELS } from "../../../../utils/analysisQuery/labels";
import type { AnalysisQuery } from "../../../../utils/analysisQuery/types";

type RankChartProps = {
  query: AnalysisQuery;
  items: RankItem[];
  /** 전년 비교 여부 */
  showChange: boolean;
};

/** 순위 뷰 — 묶기 기준별 기간 전체 값 */
const RankChart = ({ query, items, showChange }: RankChartProps) => {
  const theme = useTheme();
  const colorOf = (item: RankItem) => resolveSeriesColor({ colorKey: item.key, role: "entity" }, query.groupBy, theme);

  /** 흐린 행과 선명한 행이 섞여 있을 때만 흐림이 의미가 있다 */
  const lowSampleCount = items.filter((item) => item.lowSample).length;
  const fadeLowSample = lowSampleCount > 0 && lowSampleCount < items.length;
  const notes = [
    showChange ? "○ 전년 같은 기간 값" : "",
    fadeLowSample ? "흐린 행은 공판일이 적어 수치가 불안정합니다" : "",
  ].filter(Boolean);

  const { containerRef, svgRef, height } = useDrawRankChart({
    items,
    metric: query.metric,
    showChange,
    fadeLowSample,
    colorOf,
    theme,
  });

  return (
    <Box sx={{ px: { xs: 1.75, sm: 2.25 }, pb: 1 }}>
      <Box ref={containerRef} sx={{ width: "100%" }}>
        <svg
          ref={svgRef}
          role="img"
          aria-label={`${GROUP_BY_LABELS[query.groupBy]} ${METRIC_LABELS[query.metric]} 순위, ${items.length}개`}
          style={{ display: "block", height }}
        />
      </Box>
      {notes.length > 0 ? (
        <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", pt: 1 }}>{notes.join(" · ")}</Typography>
      ) : null}
    </Box>
  );
};

export default RankChart;
