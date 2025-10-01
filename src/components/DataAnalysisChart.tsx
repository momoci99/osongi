import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useTheme } from "@mui/material/styles";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { WeeklyPriceDatum } from "../types/data";
import { GradeKeyToKorean } from "../const/Common";

/**
 * 송이버섯 공판 데이터 시각화 차트 컴포넌트
 *
 * ⚠️ 중요: 이 차트는 반드시 연도별 서브플롯(Year-based Subplots) 구조를 유지해야 함
 *
 * 핵심 아키텍처:
 * 1. 각 연도마다 독립적인 서브플롯 생성 (별도의 X축 스케일)
 * 2. 모든 서브플롯이 동일한 Y축 스케일 공유
 * 3. 송이버섯 시즌(8-12월) 데이터만 표시
 * 4. 등급별 색상 + 지역별 시리즈 구분
 *
 * 절대 하지 말아야 할 것:
 * - 단일 타임라인으로 변경 (연도 간 데이터 연결 문제 발생)
 * - 비시즌 기간 포함 (빈 공간 문제 발생)
 * - 연도별 독립 X축 제거 (시각적 혼동 발생)
 */

type ChartMode = "price" | "quantity";

type DataAnalysisChartProps = {
  data: WeeklyPriceDatum[];
  height?: number;
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
};

export default function DataAnalysisChart({
  data,
  height = 400,
  mode,
  onModeChange,
}: DataAnalysisChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  // 컨테이너 크기 상태
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // ResizeObserver로 컨테이너 크기 변화 감지
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: observedHeight } = entry.contentRect;
        setContainerSize({ width, height: observedHeight || height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [height]);

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ChartMode | null
  ) => {
    if (newMode !== null) {
      onModeChange(newMode);
    }
  };

  const getGradeDashPattern = (gradeKey: string): string => {
    const patterns: Record<string, string> = {
      grade1: "0",
      grade2: "5,5",
      grade3Stopped: "10,5",
      grade3Estimated: "15,10,5,10",
      gradeBelow: "5,10,5",
      mixedGrade: "20,5",
    };
    return patterns[gradeKey] || "0";
  };

  useEffect(() => {
    if (
      !svgRef.current ||
      !containerRef.current ||
      data.length === 0 ||
      containerSize.width === 0
    )
      return;

    const containerWidth = containerSize.width;
    const chartHeight = Math.max(containerSize.height || height, 300);

    // SVG 크기 설정
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", chartHeight);

    // 화면 크기에 따른 반응형 설정
    const isMobile = containerWidth < 768;
    const margin = {
      top: 40,
      right: isMobile ? 80 : 120,
      bottom: 60,
      left: isMobile ? 60 : 80,
    };

    const fontSize = {
      title: isMobile ? "12px" : "14px",
      axis: isMobile ? "8px" : "10px",
      legend: isMobile ? "10px" : "12px",
      message: isMobile ? "14px" : "16px",
    };

    // 송이버섯 시즌(8-12월) 데이터만 필터링
    const mushroomSeasonData = data.filter((d) => {
      const date = new Date(d.date);
      const month = date.getMonth() + 1;
      return month >= 8 && month <= 12;
    });

    if (mushroomSeasonData.length === 0) {
      svg
        .append("text")
        .attr("x", containerWidth / 2)
        .attr("y", chartHeight / 2)
        .attr("text-anchor", "middle")
        .style("fill", theme.palette.text.secondary)
        .style("font-size", fontSize.message)
        .text("송이버섯 시즌(8월~12월) 데이터가 없습니다");
      return;
    }

    // Y값 결정
    const yValue = (d: WeeklyPriceDatum) =>
      mode === "price" ? d.unitPriceWon : d.quantityKg;

    // ⭐ 핵심: 연도별로 데이터 그룹화 (서브플롯 구조의 기반)
    // 각 연도가 독립적인 차트 영역을 가지게 됨
    const yearGroups = new Map<number, WeeklyPriceDatum[]>();
    mushroomSeasonData.forEach((d) => {
      const year = new Date(d.date).getFullYear();
      if (!yearGroups.has(year)) {
        yearGroups.set(year, []);
      }
      yearGroups.get(year)!.push(d);
    });

    // 연도 정렬
    const years = Array.from(yearGroups.keys()).sort();
    const yearCount = years.length;

    // ⭐ 핵심: 각 서브플롯의 크기 계산
    // 전체 너비를 연도 수만큼 나누어 각 연도별 독립 영역 생성
    const subplotGap = isMobile ? 20 : 40;
    const subplotWidth =
      (containerWidth -
        margin.left -
        margin.right -
        (yearCount - 1) * subplotGap) /
      yearCount;
    const subplotHeight = chartHeight - margin.top - margin.bottom;

    // 전체 Y 스케일 (모든 연도 데이터 기준)
    const yExtent = d3.extent(mushroomSeasonData, yValue) as [number, number];
    const globalYScale = d3
      .scaleLinear()
      .domain([0, yExtent[1] * 1.1])
      .range([subplotHeight, 0]);

    // 색상 스케일 (등급별 - 우선순위 정렬)
    const gradeOrder = [
      "grade1",
      "grade2",
      "grade3Stopped",
      "grade3Estimated",
      "gradeBelow",
      "mixedGrade",
    ];

    const uniqueGrades = Array.from(
      new Set(mushroomSeasonData.map((d) => d.gradeKey).filter(Boolean))
    );

    const sortedGrades = uniqueGrades.sort((a, b) => {
      const indexA = gradeOrder.indexOf(a);
      const indexB = gradeOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    const colorScale = d3
      .scaleOrdinal(d3.schemeCategory10)
      .domain(sortedGrades);

    // ⭐⭐⭐ 가장 중요한 부분: 각 연도별 서브플롯 생성 루프 ⭐⭐⭐
    // 이 루프가 연도별 독립 차트를 만드는 핵심 로직
    // 절대로 단일 차트로 변경하지 말 것!
    years.forEach((year, yearIndex) => {
      const yearData = yearGroups.get(year)!;
      const xOffset = margin.left + yearIndex * (subplotWidth + subplotGap);

      // 해당 연도의 X 스케일
      const yearDates = yearData
        .map((d) => new Date(d.date))
        .sort((a, b) => a.getTime() - b.getTime());

      const dateExtent = d3.extent(yearDates) as [Date, Date];
      const xScale = d3.scaleTime().domain(dateExtent).range([0, subplotWidth]);

      // 서브플롯 그룹
      const subplotGroup = svg
        .append("g")
        .attr("transform", `translate(${xOffset}, ${margin.top})`);

      // 연도 제목
      subplotGroup
        .append("text")
        .attr("x", subplotWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", fontSize.title)
        .style("font-weight", "bold")
        .style("fill", theme.palette.text.primary)
        .text(`${year}년`);

      // X축 (각 서브플롯) - 스마트한 틱 간격 조정
      const uniqueDates = [...new Set(yearData.map((d) => d.date))]
        .sort()
        .map((dateStr) => new Date(dateStr));

      // 데이터 범위에 따른 적응형 틱 간격
      const dataSpanDays = uniqueDates.length;
      let tickInterval = 1;

      if (dataSpanDays > 15) {
        tickInterval = Math.ceil(dataSpanDays / (isMobile ? 3 : 5));
      } else if (dataSpanDays > 7) {
        tickInterval = isMobile ? 3 : 2;
      } else {
        tickInterval = isMobile ? 2 : 1;
      }

      const selectedTicks = uniqueDates.filter(
        (_, index) => index % tickInterval === 0
      );

      const xAxis = d3
        .axisBottom(xScale)
        .tickValues(selectedTicks)
        .tickFormat((d) => d3.timeFormat("%m/%d")(d as Date));

      subplotGroup
        .append("g")
        .attr("transform", `translate(0, ${subplotHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("fill", theme.palette.text.primary)
        .style("font-size", fontSize.axis);

      // Y축 (첫 번째 서브플롯에만)
      if (yearIndex === 0) {
        const yAxis = d3
          .axisLeft(globalYScale)
          .ticks(isMobile ? 5 : 8)
          .tickFormat((d) => `${d}${mode === "price" ? "원" : "kg"}`);

        subplotGroup
          .append("g")
          .call(yAxis)
          .selectAll("text")
          .style("fill", theme.palette.text.primary)
          .style("font-size", fontSize.axis);
      }

      // 지역/등급별 시리즈 생성
      const seriesMap = new Map<
        string,
        {
          region: string;
          gradeKey: string;
          data: WeeklyPriceDatum[];
          color: string;
          dashPattern: string;
        }
      >();

      yearData.forEach((d) => {
        if (!d.region || !d.gradeKey) return;

        const seriesKey = `${d.region}-${d.gradeKey}`;
        if (!seriesMap.has(seriesKey)) {
          seriesMap.set(seriesKey, {
            region: d.region,
            gradeKey: d.gradeKey,
            data: [],
            color: colorScale(d.gradeKey),
            dashPattern: getGradeDashPattern(d.gradeKey),
          });
        }
        seriesMap.get(seriesKey)!.data.push(d);
      });

      // 각 시리즈 정렬 및 그리기
      seriesMap.forEach((series) => {
        series.data.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // 라인 그리기
        if (series.data.length > 1) {
          const line = d3
            .line<WeeklyPriceDatum>()
            .x((d) => xScale(new Date(d.date)))
            .y((d) => globalYScale(yValue(d)))
            .curve(d3.curveMonotoneX);

          subplotGroup
            .append("path")
            .datum(series.data)
            .attr("fill", "none")
            .attr("stroke", series.color)
            .attr("stroke-width", isMobile ? 1.5 : 2)
            .attr("stroke-opacity", 0.8)
            .attr("stroke-dasharray", series.dashPattern)
            .attr("d", line);
        }

        // 점 그리기 및 툴팁
        series.data.forEach((d) => {
          const xPos = xScale(new Date(d.date));

          subplotGroup
            .append("circle")
            .attr("cx", xPos)
            .attr("cy", globalYScale(yValue(d)))
            .attr("r", isMobile ? 2 : 3)
            .attr("fill", series.color)
            .attr("stroke", theme.palette.background.paper)
            .attr("stroke-width", 1)
            .style("cursor", "pointer")
            .on("mouseenter", function (event) {
              const tooltip = d3
                .select("body")
                .append("div")
                .attr("class", "chart-tooltip")
                .style("position", "absolute")
                .style("background", theme.palette.background.paper)
                .style("border", `1px solid ${theme.palette.divider}`)
                .style("border-radius", "8px")
                .style("padding", "12px")
                .style("font-size", isMobile ? "12px" : "14px")
                .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)")
                .style("z-index", "1000")
                .style("pointer-events", "none")
                .style("color", theme.palette.text.primary);

              const date = new Date(d.date);
              const dateStr = `${date.getFullYear()}년 ${(date.getMonth() + 1)
                .toString()
                .padStart(2, "0")}월 ${date
                .getDate()
                .toString()
                .padStart(2, "0")}일`;

              tooltip.html(`
                <div><strong>${
                  series.region
                } ${(GradeKeyToKorean as any)[series.gradeKey] || series.gradeKey}</strong></div>
                <div>${dateStr}</div>
                <div>가격: ${
                  d.unitPriceWon?.toLocaleString() || "N/A"
                }원/kg</div>
                <div>수량: ${d.quantityKg?.toLocaleString() || "N/A"}kg</div>
              `);

              const [mouseX, mouseY] = d3.pointer(event, document.body);
              tooltip
                .style("left", mouseX + 10 + "px")
                .style("top", mouseY - 10 + "px");
            })
            .on("mouseleave", function () {
              d3.selectAll(".chart-tooltip").remove();
            });
        });
      });
    });

    // 범례 (우측)
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${containerWidth - (isMobile ? 70 : 110)}, ${margin.top})`
      );

    const allSeries = new Map<string, any>();
    years.forEach((year) => {
      const yearData = yearGroups.get(year)!;
      yearData.forEach((d) => {
        if (!d.region || !d.gradeKey) return;
        const seriesKey = `${d.region}-${d.gradeKey}`;
        if (!allSeries.has(seriesKey)) {
          allSeries.set(seriesKey, {
            region: d.region,
            gradeKey: d.gradeKey,
            color: colorScale(d.gradeKey),
            dashPattern: getGradeDashPattern(d.gradeKey),
          });
        }
      });
    });

    // 범례 항목을 지역별, 등급별로 정렬
    const sortedSeries = Array.from(allSeries.values()).sort((a, b) => {
      // 먼저 지역별로 정렬
      if (a.region !== b.region) {
        return a.region.localeCompare(b.region);
      }
      // 같은 지역 내에서는 등급 우선순위로 정렬
      const indexA = gradeOrder.indexOf(a.gradeKey);
      const indexB = gradeOrder.indexOf(b.gradeKey);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    let legendY = 0;
    sortedSeries.forEach((series) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(0, ${legendY})`);

      legendItem
        .append("line")
        .attr("x1", 0)
        .attr("x2", isMobile ? 15 : 20)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", series.color)
        .attr("stroke-width", isMobile ? 1.5 : 2)
        .attr("stroke-dasharray", series.dashPattern);

      legendItem
        .append("text")
        .attr("x", isMobile ? 20 : 25)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .style("font-size", fontSize.legend)
        .style("fill", theme.palette.text.primary)
        .text(
          `${series.region} ${
            (GradeKeyToKorean as any)[series.gradeKey] || series.gradeKey
          }`
        );

      legendY += isMobile ? 16 : 20;
    });
  }, [data, height, mode, theme, containerSize]);

  return (
    <Box sx={{ width: "100%", mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              px: { xs: 1, sm: 2 },
              py: 0.5,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              border: `1px solid ${theme.palette.divider}`,
              "&.Mui-selected": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              },
            },
          }}
        >
          <ToggleButton value="price">💰 가격 보기</ToggleButton>
          <ToggleButton value="quantity">📊 수량 보기</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: { xs: 300, sm: 400, md: height },
          minHeight: 300,
        }}
      >
        <svg ref={svgRef}></svg>
      </Box>
    </Box>
  );
}
