import { IconButton, Tooltip, CircularProgress, useTheme } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

type RefreshButtonProps = {
  isRefreshing: boolean;
  onRefresh: () => void;
};

const RefreshButton = ({ isRefreshing, onRefresh }: RefreshButtonProps) => {
  const theme = useTheme();

  return (
    <Tooltip title={isRefreshing ? "데이터 갱신 중..." : "데이터 새로고침"}>
      <span>
        <IconButton
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={isRefreshing ? "데이터 갱신 중" : "데이터 새로고침"}
          sx={{
            color: theme.palette.text.primary,
            width: 40,
            height: 40,
          }}
        >
          {isRefreshing ? (
            <CircularProgress size={18} thickness={5} />
          ) : (
            <RefreshIcon fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default RefreshButton;
