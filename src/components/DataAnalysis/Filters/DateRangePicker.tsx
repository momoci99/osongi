import { Box } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

type DateRangePickerFieldProps = {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  startLabel?: string;
  endLabel?: string;
};

const DateRangePickerField = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = "시작일",
  endLabel = "종료일",
}: DateRangePickerFieldProps) => {
  return (
    <Box sx={{ display: "flex", gap: 1.5 }}>
      <DatePicker
        label={startLabel}
        value={startDate}
        onChange={onStartDateChange}
        slotProps={{ textField: { fullWidth: true, size: "small" } }}
      />
      <DatePicker
        label={endLabel}
        value={endDate}
        onChange={onEndDateChange}
        slotProps={{ textField: { fullWidth: true, size: "small" } }}
      />
    </Box>
  );
};

export default DateRangePickerField;
