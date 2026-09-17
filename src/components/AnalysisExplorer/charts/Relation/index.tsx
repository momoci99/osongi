import { Box, Typography, useTheme } from "@mui/material";
import { RELATION_CHART } from "../../../../const/AnalysisLayout";
import { regionColor } from "../../../../const/Regions";
import type { RelationModel } from "../../../../utils/analysisQuery/relationModel";
import type { AnalysisQuery } from "../../../../utils/analysisQuery/types";
import { chartTooltipSx } from "../chartTooltip";
import useDrawRelation from "./useDrawRelation";

type RelationProps = {
  query: AnalysisQuery;
  model: RelationModel;
};

/** 공판량과 단가의 관계 산점도 */
const Relation = ({ query, model }: RelationProps) => {
  const theme = useTheme();
  const latestYear = Math.max(...model.points.map((point) => point.year));
  const seriesKeys = [...new Set(model.points.map((point) => point.seriesKey))].sort((a, b) => b.localeCompare(a));
  const colorOf = (key: string) => {
    if (query.groupBy === "region") return regionColor(key);
    if (query.groupBy === "year" && Number(key) !== latestYear) return theme.palette.text.secondary;
    return theme.palette.primary.main;
  };
  const { containerRef, svgRef, tooltipRef, height } = useDrawRelation({ model, query, theme });

  if (!model.enoughPoints) {
    return (
      <Box sx={{ minHeight: height, display: "grid", placeItems: "center", px: 3 }}>
        <Typography sx={{ color: "text.secondary", textAlign: "center", fontSize: "0.875rem" }}>
          점이 {model.points.length}개뿐이라 관계를 판단하기 어렵습니다. 기간을 넓혀 보세요.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
        <svg ref={svgRef} role="img" aria-label={`공판량과 단가 관계 산점도, 점 ${model.points.length}개`} style={{ display: "block", height }} />
        <Box ref={tooltipRef} sx={chartTooltipSx} aria-hidden />
      </Box>
      {query.groupBy !== "none" ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: 0.75, px: { xs: 1.75, sm: 2.25 }, pt: 1 }}>
          {seriesKeys.map((key) => (
            <Box key={key} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              <Box component="span" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: colorOf(key), opacity: query.groupBy === "year" && Number(key) !== latestYear ? RELATION_CHART.CONTEXT_OPACITY : RELATION_CHART.POINT_OPACITY }} />
              <Typography component="span" sx={{ color: "text.secondary", fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" }}>{key}</Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
};

export default Relation;
