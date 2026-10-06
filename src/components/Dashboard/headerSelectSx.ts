import type { Theme } from "@mui/material/styles";

/** 대시보드 헤더 셀렉터(지역·조합) 공통 스타일. 두 셀렉터가 나란히 놓여 높이·글자를 맞춘다 */
const headerSelectSx = (theme: Theme) =>
  ({
    minWidth: { xs: 88, sm: 100 },
    height: { xs: 36, sm: 40 },
    fontSize: { xs: "0.8125rem", sm: "0.875rem" },
    fontWeight: 600,
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.divider,
    },
  }) as const;

export default headerSelectSx;
