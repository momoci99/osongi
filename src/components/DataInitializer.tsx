import { Box, CircularProgress, Typography, Card, Button } from "@mui/material";
import { useDataLoader } from "../hooks/useAuctionData";

interface DataInitializerProps {
  children: React.ReactNode;
}

const DataInitializer: React.FC<DataInitializerProps> = ({ children }) => {
  const {
    isLoading,
    isInitialized,
    hasError,
    error,
    totalRecords,
    forceUpdate,
  } = useDataLoader();

  // 로딩 중
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 3,
          px: 3,
        }}
      >
        <Card sx={{ p: 4, maxWidth: 500, width: "100%", textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            송이버섯 데이터 준비 중
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            처음 방문하시는 경우 데이터 다운로드에 몇 초가 소요될 수 있습니다.
            <br />
            이후 방문시에는 즉시 로딩됩니다!
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <CircularProgress size={40} />
          </Box>

          <Typography variant="body2" color="text.secondary">
            데이터 로딩 중...
          </Typography>
        </Card>
      </Box>
    );
  }

  // 에러 발생
  if (hasError) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 3,
          px: 3,
        }}
      >
        <Card sx={{ p: 4, maxWidth: 500, width: "100%", textAlign: "center" }}>
          <Typography variant="h5" gutterBottom color="error">
            데이터 로딩 실패
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error || "알 수 없는 오류가 발생했습니다."}
          </Typography>

          <Button variant="contained" onClick={forceUpdate} sx={{ mt: 2 }}>
            다시 시도
          </Button>
        </Card>
      </Box>
    );
  }

  // 초기화 완료 - 정상 컨텐츠 표시
  if (isInitialized) {
    return (
      <>
        {/* 데이터 상태 정보 (개발 시에만 표시하거나 설정으로 토글 가능) */}
        {process.env.NODE_ENV === "development" && (
          <Box
            sx={{
              position: "fixed",
              bottom: 16,
              right: 16,
              zIndex: 1000,
              backgroundColor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              p: 1,
              fontSize: "0.75rem",
              opacity: 0.8,
            }}
          >
            💾 IndexedDB: {totalRecords?.toLocaleString()}개 레코드
          </Box>
        )}
        {children}
      </>
    );
  }

  // 예상하지 못한 상태
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <Typography>초기화 대기 중...</Typography>
    </Box>
  );
};

export default DataInitializer;
