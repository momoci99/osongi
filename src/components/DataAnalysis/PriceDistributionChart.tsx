import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { Box, Typography, useTheme } from "@mui/material";
import type { DistributionBin } from "../../utils/analysisUtils";
import { GradeKeyToKorean } from "../../const/Common";
import { useContainerSize } from "../../hooks/useContainerSize";
import { createD3Tooltip, removeD3Tooltip } from "../../utils/d3Tooltip";
import { getGradeColorMap } from "../../utils/chartUtils";
import { isMobileWidth } from "../../utils/d3/chartMargins";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";

type PriceDistributionChartProps = {
  data: DistributionBin[];
  loading?: boolean;
  height?: number;
};

const formatWon = (val: number): string => {
  if (val >= 10000) return `${Math.round(val / 10000)}만`;
  return val.toLocaleString();
};

/** 가격 구간별 거래 빈도를 등급별 스택 히스토그램으로 시각화하는 컴포넌트 */
const PriceDistributionChart = ({
  data,
  loading = false,
  height = 280,
}: PriceDistributionChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width: containerWidth }] = useContainerSize();
  const theme = useTheme();

  const gradeColors = useMemo(() => getGradeColorMap(theme), [theme]);
  const gradeKeys = useMemo(() => [...new Set(data.map((d) => d.gradeKey))], [data]);

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const isMobile = isMobileWidth(containerWidth);
    const margin = isMobile
      ? { top: 12, right: 12, bottom: 44, left: 40 }
      : { top: 12, right: 16, bottom: 48, left: 52 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 고유 bin 위치 추출 (x0 기준 정렬)
    const binMap = new Map<number, { x0: number; x1: number }>();
    data.forEach((d) => {
      if (!binMap.has(d.x0)) binMap.set(d.x0, { x0: d.x0, x1: d.x1 });
    });
    const bins = [...binMap.values()].sort((a, b) => a.x0 - b.x0);
    if (bins.length === 0) return;

    // bin별 등급 합산 총 count
    const binTotals = bins.map((bin) =>
      gradeKeys.reduce((sum, g) => {
        const found = data.find((d) => d.x0 === bin.x0 && d.gradeKey === g);
        return sum + (found?.count ?? 0);
      }, 0)
    );
    const maxTotal = Math.max(...binTotals, 1);

    const xScale = d3
      .scaleBand()
      .domain(bins.map((b) => String(b.x0)))
      .range([0, innerWidth])
      .padding(0.12);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxTotal * 1.1])
      .range([innerHeight, 0])
      .nice();

    const g = svg
      .attr("width", containerWidth)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Y 그리드
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => ""))
      .call((sel) => sel.select(".domain").remove())
      .call((sel) =>
        sel
          .selectAll("line")
          .attr("stroke", theme.palette.divider)
          .attr("stroke-dasharray", "3,3")
      );

    // X 축
    const tickStep = Math.max(1, Math.ceil(bins.length / (isMobile ? 4 : 8)));
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(
            bins.filter((_, i) => i % tickStep === 0).map((b) => String(b.x0))
          )
          .tickFormat((d) => formatWon(Number(d)))
      )
      .call((sel) => sel.select(".domain").attr("stroke", theme.palette.divider))
      .call((sel) =>
        sel
          .selectAll("text")
          .attr("fill", theme.palette.text.secondary)
          .style("font-size", "11px")
      )
      .call((sel) => sel.selectAll("line").attr("stroke", theme.palette.divider));

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + (isMobile ? 38 : 42))
      .attr("text-anchor", "middle")
      .attr("fill", theme.palette.text.secondary)
      .style("font-size", "11px")
      .text("단가 (원/kg)");

    // Y 축
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .call((sel) => sel.select(".domain").attr("stroke", theme.palette.divider))
      .call((sel) =>
        sel
          .selectAll("text")
          .attr("fill", theme.palette.text.secondary)
          .style("font-size", "11px")
      )
      .call((sel) => sel.selectAll("line").attr("stroke", theme.palette.divider));

    const tooltip = createD3Tooltip(theme);

    // 스택 바 렌더링 (gradeKeys 순서대로 누적)
    const cumulativeCounts = new Array(bins.length).fill(0) as number[];

    gradeKeys.forEach((gradeKey) => {
      bins.forEach((bin, binIdx) => {
        const found = data.find((d) => d.x0 === bin.x0 && d.gradeKey === gradeKey);
        const count = found?.count ?? 0;
        if (count === 0) return;

        const cumOffset = cumulativeCounts[binIdx];
        const barHeight = Math.max(0, yScale(cumOffset) - yScale(cumOffset + count));

        g.append("rect")
          .attr("x", xScale(String(bin.x0)) ?? 0)
          .attr("y", yScale(cumOffset + count))
          .attr("width", xScale.bandwidth())
          .attr("height", barHeight)
          .attr("fill", gradeColors[gradeKey] ?? theme.palette.primary.main)
          .attr("opacity", 0.85)
          .attr("rx", 2)
          .on("mouseover", (_event) => {
            const gradeLabel =
              GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey;
            tooltip
              .style("opacity", 1)
              .html(
                `<div style="font-weight:600;margin-bottom:4px;">${gradeLabel}</div>` +
                  `<div style="margin-bottom:2px;">${formatWon(bin.x0)} ~ ${formatWon(bin.x1)}원/kg</div>` +
                  `<div>빈도 <strong>${count}건</strong></div>`
              );
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", `${event.pageX + 12}px`)
              .style("top", `${event.pageY - 40}px`);
          })
          .on("mouseout", () => tooltip.style("opacity", 0));

        cumulativeCounts[binIdx] += count;
      });
    });

    return () => removeD3Tooltip();
  }, [data, containerWidth, theme, height, gradeColors, gradeKeys]);

  const isEmpty = data.length === 0;

  return (
    <SectionCard>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        가격 분포
      </Typography>
      <Box ref={containerRef}>
        {isEmpty || loading ? (
          <EmptyState loading={loading} height={height} />
        ) : (
          <svg ref={svgRef} style={{ display: "block", width: "100%" }} />
        )}
      </Box>
      {!isEmpty && !loading && gradeKeys.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1.5, pl: 0.5 }}>
          {gradeKeys.map((g) => (
            <Box key={g} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "2px",
                  bgcolor: gradeColors[g],
                  opacity: 0.85,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {GradeKeyToKorean[g as keyof typeof GradeKeyToKorean] ?? g}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </SectionCard>
  );
};

export default PriceDistributionChart;
