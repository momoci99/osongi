import { Box, Typography, CircularProgress } from "@mui/material";

interface EmptyStateProps {
  loading?: boolean;
  height?: number;
}

export default function EmptyState({ loading = false, height = 160 }: EmptyStateProps) {
  if (loading) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          데이터 로딩 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        표시할 데이터가 없습니다
      </Typography>
      <Typography variant="caption" color="text.secondary">
        필터 조건을 조정해보세요
      </Typography>
    </Box>
  );
}
