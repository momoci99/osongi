import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Card, Typography, Button } from "@mui/material";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * 렌더 트리에서 발생한 동기 예외를 잡아 폴백 UI로 전환한다.
 * 비동기 에러(네트워크 등)는 여기서 잡히지 않으므로
 * 해당 케이스는 useSnackbarStore로 알린다.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] 렌더 에러:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

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
          }}
        >
          <Typography
            variant="h5"
            color="error"
            sx={{ fontWeight: 700, mb: 1 }}
          >
            문제가 발생했어요
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, wordBreak: "keep-all" }}
          >
            화면을 그리는 도중 예상치 못한 오류가 발생했습니다. 새로고침 후에도
            같은 문제가 반복되면 알려주세요.
          </Typography>

          {this.state.error?.message && (
            <Typography
              variant="caption"
              component="pre"
              sx={{
                display: "block",
                textAlign: "left",
                p: 1.5,
                mb: 3,
                bgcolor: "action.hover",
                borderRadius: "0.5rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "text.secondary",
              }}
            >
              {this.state.error.message}
            </Typography>
          )}

          <Button
            variant="contained"
            onClick={this.handleReload}
            sx={{ borderRadius: "0.5rem", fontWeight: 600 }}
          >
            새로고침
          </Button>
        </Card>
      </Box>
    );
  }
}

export default ErrorBoundary;
