import {
  Box,
  LinearProgress,
  Typography,
  Card,
  Button,
  useTheme,
} from "@mui/material";
import { useDataLoader } from "../hooks/useAuctionData";

type DataInitializerProps = {
  children: React.ReactNode;
};

/**
 * 로딩 진행률 0~100을 받아 현재 단계 라벨을 반환한다.
 * dataLoader 내부 규약: 0~50% 다운로드, 50~100% IndexedDB 저장.
 */
const getLoadingPhaseLabel = (progress: number | undefined): string => {
  if (progress === undefined || progress === 0) {
    return "데이터 준비 중...";
  }
  if (progress < 50) {
    return "데이터 다운로드 중...";
  }
  if (progress < 100) {
    return "로컬 저장소에 반영 중...";
  }
  return "마무리 중...";
};

const DataInitializer = ({ children }: DataInitializerProps) => {
  const theme = useTheme();
  const {
    isLoading,
    isInitialized,
    hasError,
    error,
    totalRecords,
    progress,
    forceUpdate,
  } = useDataLoader();

  if (isLoading) {
    const normalizedProgress = Math.max(0, Math.min(100, progress ?? 0));
    const phaseLabel = getLoadingPhaseLabel(progress);
    const showDeterminate = normalizedProgress > 0;

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
        <Card
          sx={{
            p: 4,
            maxWidth: 500,
            width: "100%",
            borderRadius: "0.75rem",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            송이버섯 데이터 준비 중
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            처음 방문하시는 경우 데이터 다운로드에 몇 초가 소요될 수 있습니다.
            <br />
            이후 방문 시에는 즉시 로딩됩니다.
          </Typography>

          <Box sx={{ mb: 1.5 }}>
            <LinearProgress
              variant={showDeterminate ? "determinate" : "indeterminate"}
              value={normalizedProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: `${theme.palette.primary.main}1A`,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {phaseLabel}
            </Typography>
            {showDeterminate && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {normalizedProgress}%
              </Typography>
            )}
          </Box>
        </Card>
      </Box>
    );
  }

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
        <Card
          sx={{
            p: 4,
            maxWidth: 500,
            width: "100%",
            textAlign: "center",
            borderRadius: "0.75rem",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 1 }}
            color="error"
          >
            데이터 로딩 실패
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error || "알 수 없는 오류가 발생했습니다."}
          </Typography>

          <Button
            variant="contained"
            onClick={forceUpdate}
            sx={{
              borderRadius: "0.5rem",
              fontWeight: 600,
            }}
          >
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
