import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

type NarrowScreenNoticeProps = {
  /** "그래도 보기" — 좁은 화면에서도 분석 도구를 연다 */
  onProceed: () => void;
};

/** 모바일에서 대신 볼 곳 */
const ALTERNATIVES = [
  { to: "/", title: "오늘 시세", description: "대시보드에서 최신 공판 단가·물량" },
  { to: "/region", title: "지역별 시세", description: "지역·조합별 시즌 흐름" },
] as const;

/** 좁은 화면 안내 — 분석 도구는 큰 화면 전용, 공유 링크는 "그래도 보기"로 열 수 있다 */
const NarrowScreenNotice = ({ onProceed }: NarrowScreenNoticeProps) => (
  <Paper
    variant="outlined"
    sx={{ p: 3, borderRadius: "0.75rem", borderColor: "surface.border", maxWidth: 480, mx: "auto", mt: { xs: 2, sm: 6 }, wordBreak: "keep-all" }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: "0.75rem",
        display: "grid",
        placeItems: "center",
        bgcolor: "action.hover",
        color: "primary.main",
        mb: 2,
      }}
    >
      <DesktopWindowsOutlinedIcon />
    </Box>
    <Typography component="h1" sx={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
      데이터 분석은 큰 화면용입니다
    </Typography>
    <Typography sx={{ mt: 1, fontSize: "0.9375rem", color: "text.secondary", lineHeight: 1.6 }}>
      여러 시즌을 겹쳐 보고 조건을 바꿔 가며 비교하는 도구라 PC나 가로로 둔 태블릿에서 가장 잘 보입니다.
    </Typography>

    <Stack sx={{ mt: 2.5 }} gap={1}>
      {ALTERNATIVES.map((item) => (
        <Box
          key={item.to}
          component={RouterLink}
          to={item.to}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderRadius: "0.625rem",
            border: 1,
            borderColor: "surface.border",
            color: "text.primary",
            textDecoration: "none",
            transition: "background-color 120ms",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{item.title}</Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>{item.description}</Typography>
          </Box>
          <ArrowForwardIcon fontSize="small" sx={{ color: "text.secondary" }} />
        </Box>
      ))}
    </Stack>

    <Button fullWidth color="inherit" onClick={onProceed} sx={{ mt: 2, color: "text.secondary", fontWeight: 600 }}>
      그래도 분석 도구 보기
    </Button>
  </Paper>
);

export default NarrowScreenNotice;
