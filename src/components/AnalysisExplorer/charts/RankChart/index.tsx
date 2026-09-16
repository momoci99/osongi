import { Box, Typography, useTheme } from "@mui/material";
import useDrawRankChart from "./useDrawRankChart";
import { resolveSeriesColor } from "../seriesColor";
import { buildRankModel, type RankItem } from "../../../../utils/analysisQuery/rankModel";
import { GROUP_BY_LABELS, METRIC_LABELS } from "../../../../utils/analysisQuery/labels";
import type { AnalysisQuery, AnalysisResult } from "../../../../utils/analysisQuery/types";

type RankChartProps = {
  query: AnalysisQuery;
  result: AnalysisResult;
  comparison: AnalysisResult | null;
};

/** 순위 뷰 — 묶기 기준별 기간 전체 값 */
const RankChart = ({ query, result, comparison }: RankChartProps) => {
  const theme = useTheme();
  const items = buildRankModel(result, query, comparison);
  const showChange = comparison !== null;
  const colorOf = (item: RankItem) =>
    resolveSeriesColor({ colorKey: item.key, role: "entity" }, query.groupBy, theme);

  const { containerRef, svgRef, height } = useDrawRankChart({
    items,
    metric: query.metric,
    showChange,
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
      <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", pt: 1 }}>
        {showChange ? "○ 전년 같은 기간 값 · " : ""}흐린 행은 공판일이 적어 수치가 불안정합니다
      </Typography>
    </Box>
  );
};

export default RankChart;
