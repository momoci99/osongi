# Phase C: 차트/테이블 내보내기

## 목적
테이블은 CSV, 차트는 PNG로 내보낼 수 있게 만들어 분석 결과를 외부 문서나 스프레드시트로 바로 전달할 수 있게 한다.

## 예상 소요 시간
6~8시간

## 완료 기준
- 상세 테이블 우측 상단에 CSV 내보내기 버튼이 표시된다.
- CSV 파일은 UTF-8 BOM이 포함되어 Excel에서 한글이 깨지지 않는다.
- 차트별 내보내기 버튼을 누르면 현재 보이는 SVG가 PNG로 다운로드된다.
- 내보내기 유틸은 차트마다 중복 구현하지 않고 `useChartExport`로 재사용된다.
- 다운로드된 PNG는 배경이 투명하지 않고, 현재 테마 색상과 텍스트가 그대로 보존된다.

## 변경 파일 목록
- `src/utils/exportCsv.ts`
- `src/components/DataAnalysis/TableSection.tsx`
- `src/hooks/useChartExport.ts`
- `src/components/DataAnalysis/DataAnalysisChart/index.tsx`
- `src/components/Dashboard/DashboardChartWeeklyToggle/index.tsx`
- `src/components/Dashboard/DashboardChartGradePerKg/index.tsx`
- `src/components/Dashboard/DashboardChartGradePerPrice/index.tsx`

## 구현 세부사항

### 1. `src/utils/exportCsv.ts` 신규 파일 전체 코드

```ts
type CsvCell = string | number | null | undefined;

type ExportCsvParams = {
  fileName: string;
  headers: string[];
  rows: CsvCell[][];
};

/**
 * CSV 셀 값을 이스케이프합니다.
 */
const escapeCsvCell = (value: CsvCell): string => {
  const normalized = value == null ? "" : String(value);
  const escaped = normalized.replace(/"/g, "\"\"");
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

/**
 * CSV 파일을 브라우저에서 다운로드합니다.
 */
export const exportCsv = ({
  fileName,
  headers,
  rows,
}: ExportCsvParams): void => {
  const csvLines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];

  const csvContent = `\uFEFF${csvLines.join("\n")}`;
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${fileName}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
```

### 2. `TableSection.tsx`에 CSV 내보내기 버튼 추가
`transformToTableData` 결과를 그대로 재사용하면 별도 DTO를 만들 필요가 없다.

```tsx
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Table,
  TableContainer,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import type { MushroomAuctionDataRaw } from "../../types/data";
import type { AnalysisFilters } from "../../utils/analysisUtils";
import { transformToTableData } from "../../utils/tableUtils";
import { UI_LAYOUT, TABLE_CONSTANTS } from "../../const/Numbers";
import { exportCsv } from "../../utils/exportCsv";
import DataTableHeader from "./Table/DataTableHeader";
import DataTableBody from "./Table/DataTableBody";
import DataTablePagination from "./Table/DataTablePagination";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";

type TableSectionProps = {
  loading: boolean;
  filteredData: MushroomAuctionDataRaw[];
  filters: AnalysisFilters;
};

const TableSection = ({
  loading,
  filteredData,
  filters,
}: TableSectionProps) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    TABLE_CONSTANTS.ROWS_PER_PAGE_DEFAULT,
  );

  const tableData = useMemo(
    () => transformToTableData(filteredData, filters.grades),
    [filteredData, filters.grades],
  );

  const handleExportCsv = () => {
    exportCsv({
      fileName: `osongi-analysis-${new Date().toISOString().slice(0, 10)}`,
      headers: [
        "날짜",
        "지역",
        "조합명",
        "등급",
        "수량(kg)",
        "단가(원/kg)",
      ],
      rows: tableData.map((row) => [
        row.date,
        row.region,
        row.union,
        row.gradeName,
        row.quantity,
        row.unitPrice,
      ]),
    });
  };

  return (
    <SectionCard sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: UI_LAYOUT.SECTION_MARGIN_BOTTOM,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          상세 데이터
        </Typography>

        {!loading && tableData.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              총 {tableData.length}개 레코드
            </Typography>
            <Tooltip title="CSV 내보내기">
              <IconButton size="small" onClick={handleExportCsv}>
                <DownloadOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </SectionCard>
  );
};

export default TableSection;
```

### 3. `src/hooks/useChartExport.ts` 신규 파일 전체 코드
SVG를 직접 다운로드하지 않고, 클론한 SVG를 캔버스에 그린 뒤 PNG Blob으로 저장한다.

```ts
import { useCallback } from "react";
import type { RefObject } from "react";

type UseChartExportParams = {
  svgRef: RefObject<SVGSVGElement | null>;
  fileName: string;
  backgroundColor?: string;
};

/**
 * Blob URL에서 이미지를 로드합니다.
 */
const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("SVG 이미지를 불러오지 못했습니다."));
    image.src = url;
  });

/**
 * 캔버스를 PNG Blob으로 변환합니다.
 */
const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNG Blob 생성에 실패했습니다."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });

/**
 * SVG 차트를 PNG 파일로 내보냅니다.
 */
const useChartExport = ({
  svgRef,
  fileName,
  backgroundColor = "#FFFFFF",
}: UseChartExportParams) => {
  const exportChart = useCallback(async () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const width = Math.max(
      Math.round(rect.width),
      svgElement.viewBox.baseVal.width || 1,
    );
    const height = Math.max(
      Math.round(rect.height),
      svgElement.viewBox.baseVal.height || 1,
    );

    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    clonedSvg.setAttribute("width", `${width}`);
    clonedSvg.setAttribute("height", `${height}`);

    const background = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    background.setAttribute("x", "0");
    background.setAttribute("y", "0");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", backgroundColor);
    clonedSvg.insertBefore(background, clonedSvg.firstChild);

    const serializer = new XMLSerializer();
    const svgMarkup = serializer.serializeToString(clonedSvg);
    const svgBlob = new Blob([svgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = await loadImage(svgUrl);
      const pixelRatio = window.devicePixelRatio || 1;
      const canvas = document.createElement("canvas");
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas 컨텍스트를 생성하지 못했습니다.");
      }

      context.scale(pixelRatio, pixelRatio);
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      const pngBlob = await canvasToBlob(canvas);
      const pngUrl = URL.createObjectURL(pngBlob);
      const anchor = document.createElement("a");

      anchor.href = pngUrl;
      anchor.download = `${fileName}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(pngUrl);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }, [backgroundColor, fileName, svgRef]);

  return { exportChart };
};

export default useChartExport;
```

### 4. 각 차트 `index.tsx` 적용 패턴
현재 구조상 `svgRef`는 각 차트의 index 레이어 또는 차트 컴포넌트 본체가 보유하고 있으므로, 버튼도 같은 레이어에 두는 편이 가장 단순하다.

적용 대상:
- `src/components/DataAnalysis/DataAnalysisChart/index.tsx`
- `src/components/Dashboard/DashboardChartWeeklyToggle/index.tsx`
- `src/components/Dashboard/DashboardChartGradePerKg/index.tsx`
- `src/components/Dashboard/DashboardChartGradePerPrice/index.tsx`

공통 패턴은 아래와 같다.

```tsx
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { Box, IconButton, Tooltip } from "@mui/material";
import useChartExport from "../../../hooks/useChartExport";

const DashboardChartWeeklyToggle = ({
  data,
  height = 400,
}: DashboardChartWeeklyToggleProps) => {
  const theme = useTheme();
  const { containerRef, width: containerWidth } = useContainerWidth();
  const [chartMode, setChartMode] = useState<ChartMode>("price");
  const { svgRef } = useDrawWeeklyToggle({
    data,
    height,
    theme,
    containerWidth,
    chartMode,
  });
  const { exportChart } = useChartExport({
    svgRef,
    fileName: `osongi-weekly-toggle-${chartMode}`,
  });

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Box />
        <Tooltip title="PNG로 저장">
          <IconButton size="small" onClick={exportChart}>
            <DownloadOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <div ref={containerRef} style={{ width: "100%" }}>
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          style={{ display: "block" }}
        />
      </div>
    </Box>
  );
};
```

`ScatterPlotChart.tsx`, `GradeBreakdownChart.tsx`, `RegionComparisonSection.tsx`처럼 index 레이어가 없는 컴포넌트도 같은 훅을 그대로 붙일 수 있다. 다만 해당 파일들은 내보내기 버튼 위치를 카드 헤더 우측으로 맞추는 방식으로 처리하면 된다.

## 검증 절차
1. 상세 데이터 섹션에서 CSV 버튼을 눌러 파일이 다운로드되는지 확인한다.
2. 다운로드한 CSV를 Excel 또는 Numbers로 열어 한글 헤더와 지역명이 깨지지 않는지 확인한다.
3. 주간 차트, 등급별 막대 차트, 분석 차트에서 PNG 내보내기 버튼을 눌러 파일이 생성되는지 확인한다.
4. PNG 배경이 흰색으로 채워지고, 축 텍스트와 범례가 잘리지 않는지 확인한다.
5. 다크 모드와 라이트 모드에서 각각 한 번씩 저장해 색상과 텍스트 대비가 유지되는지 확인한다.
6. 같은 차트를 여러 번 저장해도 메모리 누수 없이 정상 다운로드되는지 확인한다.
