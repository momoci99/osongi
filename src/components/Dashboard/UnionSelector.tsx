import { Box, MenuItem, Select, Typography, useTheme } from "@mui/material";
import { REGION_UNION_MAP } from "../../const/Common";
import { TEST_IDS } from "../../test-ids";
import { useSettingsStore } from "../../stores/useSettingsStore";
import headerSelectSx from "./headerSelectSx";

type UnionSelectorProps = {
  /** 최신 공판일에 거래가 있었던 조합 */
  tradedUnions: string[];
};

/** Select 는 빈 문자열을 값으로 쓸 수 있어 "지역 전체"를 빈 값으로 둔다 */
const ALL_UNIONS_VALUE = "";
const ALL_UNIONS_LABEL = "지역 전체";

/**
 * 내 지역 안에서 조합을 고르는 셀렉터.
 * 지역은 범위가 넓어 조합 단위 시세를 따로 볼 수 있게 한다.
 * 오늘 거래가 없는 조합도 고를 수는 있지만 흐리게 표시한다.
 */
const UnionSelector = ({ tradedUnions }: UnionSelectorProps) => {
  const theme = useTheme();
  const myRegion = useSettingsStore((s) => s.myRegion);
  const myUnion = useSettingsStore((s) => s.myUnion);
  const setMyUnion = useSettingsStore((s) => s.setMyUnion);

  if (!myRegion) return null;

  const unions = REGION_UNION_MAP[myRegion];
  const value = myUnion && unions.includes(myUnion) ? myUnion : ALL_UNIONS_VALUE;
  const traded = new Set(tradedUnions);

  return (
    <Select
      data-testid={TEST_IDS.UNION_SELECT}
      value={value}
      onChange={(e) => setMyUnion(e.target.value || null)}
      displayEmpty
      size="small"
      variant="outlined"
      inputProps={{ "aria-label": "조합 선택" }}
      renderValue={(selected) => selected || ALL_UNIONS_LABEL}
      sx={headerSelectSx(theme)}
    >
      <MenuItem value={ALL_UNIONS_VALUE}>{ALL_UNIONS_LABEL}</MenuItem>
      {unions.map((union) => {
        const hasTrade = traded.has(union);
        return (
          <MenuItem key={union} value={union}>
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 2,
                width: "100%",
                color: hasTrade ? "text.primary" : "text.disabled",
              }}
            >
              {union}
              {!hasTrade && (
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  거래 없음
                </Typography>
              )}
            </Box>
          </MenuItem>
        );
      })}
    </Select>
  );
};

export default UnionSelector;
