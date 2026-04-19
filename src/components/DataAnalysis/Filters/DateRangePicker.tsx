import { Box } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

type DateRangePickerFieldProps = {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  startLabel?: string;
  endLabel?: string;
  direction?: "row" | "column";
};

const DateRangePickerField = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = "시작일",
  endLabel = "종료일",
  direction = "row",
}: DateRangePickerFieldProps) => {
  return (
    <Box sx={{ display: "flex", flexDirection: direction, gap: 1.5 }}>
      <DatePicker
        label={startLabel}
        value={startDate}
        onChange={onStartDateChange}
        maxDate={endDate ?? undefined}
        slotProps={{ textField: { fullWidth: true, size: "small" } }}
      />
      <DatePicker
        label={endLabel}
        value={endDate}
        onChange={onEndDateChange}
        minDate={startDate ?? undefined}
        slotProps={{ textField: { fullWidth: true, size: "small" } }}
      />
    </Box>
  );
};

export default DateRangePickerField;
