import { Box, Typography, CircularProgress } from "@mui/material";
import { TABLE_CONSTANTS, UI_LAYOUT } from "../../../const/Numbers";

interface EmptyStateProps {
  loading: boolean;
}

export default function EmptyState({ loading }: EmptyStateProps) {
  if (loading) {
    return (
      <Box
        sx={{
          height: TABLE_CONSTANTS.MAX_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: UI_LAYOUT.FORM_GAP,
        }}
      >
        <CircularProgress size={40} />
        <Typography color="text.secondary">📋 데이터 로딩 중...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: TABLE_CONSTANTS.MAX_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography color="text.secondary">
        📋 표시할 데이터가 없습니다
      </Typography>
    </Box>
  );
}
