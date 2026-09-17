import { useState } from "react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import CheckIcon from "@mui/icons-material/Check";
import { formatInteger } from "../../utils/analysisQuery/format";

type ExplorerHeaderProps = {
  availableYears: number[];
  /** 공판 건수 (날짜×조합) */
  recordCount: number;
  latestDate: string | null;
};

/** 링크 복사 완료 표시 유지 시간 (ms) */
const COPIED_FEEDBACK_MS = 1800;

/** 탐색기 머리글 — 데이터 범위와 현재 화면 링크 복사 */
const ExplorerHeader = ({ availableYears, recordCount, latestDate }: ExplorerHeaderProps) => {
  const [copied, setCopied] = useState(false);
  const firstYear = availableYears[0];
  const lastYear = availableYears[availableYears.length - 1];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h1" sx={{ fontSize: { xs: "1.5rem", md: "1.75rem" }, fontWeight: 800, letterSpacing: "-0.03em" }}>
          데이터 분석
        </Typography>
        <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", fontVariantNumeric: "tabular-nums", mt: 0.25 }}>
          {firstYear}–{lastYear} · {availableYears.length}개 시즌 · 공판 {formatInteger(recordCount)}건
          {latestDate ? ` · 최신 ${latestDate.replaceAll("-", ".")}` : ""}
        </Typography>
      </Box>
      <Tooltip title="지금 보고 있는 조건 그대로 열리는 링크">
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={copied ? <CheckIcon fontSize="small" /> : <LinkIcon fontSize="small" />}
          onClick={handleCopy}
          sx={{ borderColor: "surface.border", color: copied ? "primary.main" : "text.secondary", fontWeight: 600 }}
        >
          {copied ? "복사됨" : "링크 복사"}
        </Button>
      </Tooltip>
    </Box>
  );
};

export default ExplorerHeader;
