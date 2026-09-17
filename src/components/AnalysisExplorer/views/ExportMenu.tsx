import { useState, type RefObject } from "react";
import { Button, ListItemText, Menu, MenuItem, useTheme } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { downloadCsv, downloadSvgAsPng } from "../../../utils/download";
import { buildExportFilename, buildSeriesCsv } from "../../../utils/analysisQuery/exportData";
import type { ExplorerResult } from "../../../utils/analysisQuery/explorerData";
import type { AnalysisQuery } from "../../../utils/analysisQuery/types";

type ExportMenuProps = {
  query: AnalysisQuery;
  result: ExplorerResult;
  /** 원본 행 CSV 요청 (원본 행은 워커에만 있다) */
  requestRawCsv: () => Promise<string>;
  /** 차트 SVG를 찾을 뷰 패널 영역 */
  chartAreaRef: RefObject<HTMLElement | null>;
};

/** 현재 뷰 내보내기 — 집계 CSV · 원본 CSV · 차트 PNG */
const ExportMenu = ({ query, result, requestRawCsv, chartAreaRef }: ExportMenuProps) => {
  const theme = useTheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const filename = buildExportFilename(query);
  const chartSvg = () => chartAreaRef.current?.querySelector<SVGSVGElement>('svg[role="img"]') ?? null;

  const run = (action: () => void) => {
    action();
    setAnchor(null);
  };

  return (
    <>
      <Button
        size="small"
        color="inherit"
        startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
        onClick={(event) => setAnchor(event.currentTarget)}
        disabled={result.rowCount === 0}
        sx={{ color: "text.secondary", fontWeight: 600 }}
      >
        내보내기
      </Button>
      <Menu
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => run(() => downloadCsv(buildSeriesCsv(query, result), filename))}>
          <ListItemText primary="집계 결과 CSV" secondary="화면의 시리즈 × 구간 값" />
        </MenuItem>
        <MenuItem
          onClick={() =>
            run(() => {
              requestRawCsv().then((csv) => downloadCsv(csv, `${filename}_raw`));
            })
          }
        >
          <ListItemText primary="원본 행 CSV" secondary="필터를 적용한 등급별 공판 기록" />
        </MenuItem>
        <MenuItem
          disabled={query.view === "table"}
          onClick={() =>
            run(() => {
              const svg = chartSvg();
              if (svg) downloadSvgAsPng(svg, theme.palette.surface.raised, filename);
            })
          }
        >
          <ListItemText primary="차트 PNG" secondary="현재 차트 이미지" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportMenu;
