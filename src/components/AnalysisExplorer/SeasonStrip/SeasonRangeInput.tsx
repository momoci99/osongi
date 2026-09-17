import { useState } from "react";
import { Box, Button, Popover, Stack, TextField, Typography } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import { isValidCalendarDate } from "../../../utils/calendarDate";
import type { AnalysisTime } from "../../../utils/analysisQuery/types";

type SeasonRangeInputProps = {
  time: AnalysisTime;
  /** 기본 입력값이 비어 있을 때 쓸 최신 공판일 */
  latestDate: string | null;
  onApply: (start: string, end: string) => void;
};

/** 현재 선택을 기간 입력 초기값으로 변환 */
const toInitialRange = (time: AnalysisTime, latestDate: string | null) => {
  if (time.kind === "range") return { start: time.start, end: time.end };
  const year = time.years[time.years.length - 1] ?? Number(latestDate?.slice(0, 4));
  return { start: `${year}-09-01`, end: latestDate?.startsWith(String(year)) ? latestDate : `${year}-11-30` };
};

/** 달력 기간 직접 입력 팝오버 — 스트립 드래그의 보조 수단 */
const SeasonRangeInput = ({ time, latestDate, onApply }: SeasonRangeInputProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState(() => toInitialRange(time, latestDate));

  const isValid =
    isValidCalendarDate(draft.start) && isValidCalendarDate(draft.end) && draft.start <= draft.end;

  const handleOpen = (element: HTMLElement) => {
    setDraft(toInitialRange(time, latestDate));
    setAnchor(element);
  };

  const handleApply = () => {
    if (!isValid) return;
    onApply(draft.start, draft.end);
    setAnchor(null);
  };

  return (
    <>
      <Button
        size="small"
        color="inherit"
        startIcon={<EventIcon fontSize="small" />}
        onClick={(event) => handleOpen(event.currentTarget)}
        sx={{ color: "text.secondary" }}
      >
        기간 입력
      </Button>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { p: 2, width: 300 } } }}
      >
        <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, mb: 1.5 }}>
          달력 기간으로 조회
        </Typography>
        <Stack gap={1.5}>
          <TextField
            label="시작일"
            type="date"
            size="small"
            value={draft.start}
            onChange={(event) => setDraft({ ...draft, start: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="종료일"
            type="date"
            size="small"
            value={draft.end}
            onChange={(event) => setDraft({ ...draft, end: event.target.value })}
            error={!isValid}
            helperText={isValid ? " " : "종료일이 시작일보다 빠릅니다"}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button size="small" color="inherit" onClick={() => setAnchor(null)}>
            취소
          </Button>
          <Button size="small" variant="contained" disableElevation disabled={!isValid} onClick={handleApply}>
            적용
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default SeasonRangeInput;
