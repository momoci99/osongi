import { Box, Button, Typography, useTheme } from "@mui/material";
import ExplorerPanel from "../ExplorerPanel";
import SeasonRangeInput from "./SeasonRangeInput";
import useDrawSeasonStrip from "./useDrawSeasonStrip";
import { SEASON_STRIP } from "../../../const/AnalysisLayout";
import { TEMPLATE_SEASONS } from "../../../const/Analysis";
import { describeTime } from "../../../utils/analysisQuery/format";
import { toggleSeason } from "../../../utils/analysisQuery/seasonWindow";
import type { AnalysisTime } from "../../../utils/analysisQuery/types";

type SeasonStripProps = {
  years: number[];
  dailyQuantity: Map<string, number>;
  time: AnalysisTime;
  latestDate: string | null;
  onTimeChange: (time: AnalysisTime) => void;
};

/** 전체 시즌 타임라인 — 날짜 조회의 본체 */
const SeasonStrip = ({ years, dailyQuantity, time, latestDate, onTimeChange }: SeasonStripProps) => {
  const theme = useTheme();

  const { containerRef, svgRef, readoutRef } = useDrawSeasonStrip({
    years,
    dailyQuantity,
    time,
    theme,
    onYearClick: (year, additive) => onTimeChange(toggleSeason(time, year, additive)),
    onRangeSelect: (start, end) => onTimeChange({ kind: "range", start, end }),
  });

  const quickActions = [
    { label: "최근 시즌", years: years.slice(-1) },
    { label: `최근 ${TEMPLATE_SEASONS.PACE_PAST}시즌`, years: years.slice(-TEMPLATE_SEASONS.PACE_PAST) },
    { label: "전체", years },
  ];

  return (
    <ExplorerPanel
      title="조회 기간"
      caption={describeTime(time)}
      action={
        <>
          {quickActions.map((action) => (
            <Button
              key={action.label}
              size="small"
              color="inherit"
              onClick={() => onTimeChange({ kind: "seasons", years: action.years })}
              sx={{ color: "text.secondary", minWidth: 0, px: 1 }}
            >
              {action.label}
            </Button>
          ))}
          <SeasonRangeInput
            time={time}
            latestDate={latestDate}
            onApply={(start, end) => onTimeChange({ kind: "range", start, end })}
          />
        </>
      }
    >
      <Box ref={containerRef} sx={{ width: "100%", cursor: "crosshair" }}>
        <svg
          ref={svgRef}
          role="img"
          aria-label={`시즌별 일 공판량 타임라인. 현재 선택: ${describeTime(time)}`}
          style={{ display: "block", height: SEASON_STRIP.PLOT_HEIGHT + SEASON_STRIP.LABEL_HEIGHT }}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          mt: 1,
          minHeight: 18,
        }}
      >
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
            클릭 시즌 선택 · Shift 클릭 추가 · 드래그 기간 선택
          </Box>
          <Box component="span" sx={{ display: { xs: "inline", md: "none" } }}>
            탭 시즌 선택 · 드래그 기간 선택
          </Box>
        </Typography>
        <Typography
          component="span"
          ref={readoutRef}
          variant="caption"
          sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
        />
      </Box>
    </ExplorerPanel>
  );
};

export default SeasonStrip;
