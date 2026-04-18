import {
  Box,
  Typography,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { AVAILABLE_REGIONS } from "../../const/Common";
import { useSettingsStore } from "../../stores/useSettingsStore";

type DashboardHeaderProps = {
  latestDate: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  /** true → 시즌 중 (컴팩트 레이아웃), false → 시즌 외 (넓은 레이아웃) */
  inSeason: boolean;
};

type RegionSelectorProps = {
  compact?: boolean;
};

/** 리전 셀렉터 공통 */
const RegionSelector = ({ compact = false }: RegionSelectorProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const myRegion = useSettingsStore((s) => s.myRegion);
  const setMyRegion = useSettingsStore((s) => s.setMyRegion);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: compact ? 0 : { xs: 1, sm: 2 },
      }}
    >
      {(!compact || !isMobile) && (
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, flexShrink: 0 }}
        >
          내 지역
        </Typography>
      )}
      <Select
        value={myRegion ?? ""}
        onChange={(e) =>
          setMyRegion(e.target.value as (typeof AVAILABLE_REGIONS)[number])
        }
        size="small"
        variant="outlined"
        sx={{
          minWidth: { xs: 88, sm: 100 },
          height: { xs: 36, sm: 40 },
          fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          fontWeight: 600,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.divider,
          },
        }}
      >
        {AVAILABLE_REGIONS.map((region) => (
          <MenuItem key={region} value={region}>
            {region}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

const refreshIconSx = (isRefreshing: boolean) => ({
  animation: isRefreshing ? "spin 1s linear infinite" : "none",
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
});

/** 시즌 외 헤더 */
const SeasonOffHeader = ({
  latestDate,
  isRefreshing,
  onRefresh,
}: Omit<DashboardHeaderProps, "inSeason">) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1,
        mb: 2,
      }}
    >
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            송이버섯 시세 대시보드
          </Typography>
          <Tooltip title="데이터 새로고침">
            <IconButton
              size="small"
              onClick={onRefresh}
              disabled={isRefreshing}
              sx={refreshIconSx(isRefreshing)}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
        >
          현재 시즌 외 기간입니다. 지난 시즌의 데이터를 분석합니다.
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary }}
        >
          마지막 데이터: {latestDate}
        </Typography>
      </Box>
      <RegionSelector />
    </Box>
  );
};

/** 시즌 중 헤더 */
const InSeasonHeader = ({
  latestDate,
  isRefreshing,
  onRefresh,
}: Omit<DashboardHeaderProps, "inSeason">) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.75, sm: 1 },
        mb: { xs: 1, sm: 1.5 },
      }}
    >
      <Box
        sx={{
          width: { xs: 4, sm: 6 },
          height: { xs: 4, sm: 6 },
          borderRadius: "50%",
          bgcolor: theme.palette.primary.main,
          flexShrink: 0,
        }}
      />
      <RegionSelector compact />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary }}
        >
          {latestDate} 기준
        </Typography>
        <Tooltip title="데이터 새로고침">
          <IconButton
            size="small"
            onClick={onRefresh}
            disabled={isRefreshing}
            sx={refreshIconSx(isRefreshing)}
          >
            <RefreshIcon sx={{ fontSize: "1rem" }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

const DashboardHeader = (props: DashboardHeaderProps) => {
  if (props.inSeason) {
    return <InSeasonHeader {...props} />;
  }
  return <SeasonOffHeader {...props} />;
};

export default DashboardHeader;
