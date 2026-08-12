import { Box, Typography } from "@mui/material";
import { SCOPE_STAT_PANEL } from "../../const/RegionLayout";

/** 패널 한 줄에 들어가는 지표 */
export type ScopeStat = {
  label: string;
  /** 숫자 부분. 단위와 분리해야 좁은 폭에서 줄바꿈이 생기지 않는다 */
  value: string;
  /** 원, 톤, 위 등. 값보다 작게 붙는다 */
  unit?: string;
  caption?: string;
};

type ScopeStatPanelProps = { stats: ScopeStat[] };

type ScopeStatRowProps = { stat: ScopeStat; first: boolean };

const ScopeStatRow = ({ stat, first }: ScopeStatRowProps) => (
  <Box
    sx={{
      display: "flex",
      /**
       * 라벨 첫 줄 baseline 에 맞추면 캡션이 붙은 두 줄 블록 옆에서
       * 숫자만 위로 떠 보인다. 블록 전체 높이의 가운데에 맞춘다.
       */
      alignItems: "center",
      justifyContent: "space-between",
      /** 라벨과 값이 붙어 한 덩어리로 읽히지 않을 최소 간격 */
      gap: 2.5,
      px: { xs: 1.75, sm: 2 },
      py: { xs: 1.25, sm: 1.5 },
      borderTop: first ? "none" : "1px solid",
      borderColor: "divider",
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{ fontSize: "0.8125rem", fontWeight: 500, color: "text.secondary" }}
      >
        {stat.label}
      </Typography>
      {stat.caption ? (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", opacity: 0.8, display: "block" }}
        >
          {stat.caption}
        </Typography>
      ) : null}
    </Box>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `auto ${SCOPE_STAT_PANEL.UNIT_WIDTH}px`,
        alignItems: "baseline",
        columnGap: 0.25,
        flexShrink: 0,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          fontSize: "1.25rem",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          textAlign: "right",
        }}
      >
        {stat.value}
      </Typography>
      <Typography
        component="span"
        sx={{
          fontWeight: 600,
          fontSize: "0.8125rem",
          color: "text.secondary",
          whiteSpace: "nowrap",
        }}
      >
        {stat.unit ?? ""}
      </Typography>
    </Box>
  </Box>
);

/**
 * 페이지 상단 지표 패널.
 *
 * 카드 3~4장을 가로로 늘어놓으면 카드마다 오른쪽 절반이 비어 화면이 헐거워졌다.
 * 라벨과 값을 한 줄에서 좌우로 맞물리게 세워 제목·요약 문단 옆에 세로로 세운다.
 */
const ScopeStatPanel = ({ stats }: ScopeStatPanelProps) => (
  <Box
    sx={{
      borderRadius: "0.75rem",
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      overflow: "hidden",
    }}
  >
    {stats.map((stat, index) => (
      <ScopeStatRow key={stat.label} stat={stat} first={index === 0} />
    ))}
  </Box>
);

export default ScopeStatPanel;
