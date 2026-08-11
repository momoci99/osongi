import { Box, Card, CardContent, Typography } from "@mui/material";

type ScopeKpiCardProps = {
  title: string;
  /** 숫자 부분. 단위와 분리해야 좁은 화면에서 줄바꿈이 생기지 않는다 */
  value: string;
  /** 원, 톤, 위 등. 값보다 작게 붙는다 */
  unit?: string;
  caption?: string;
};

/**
 * 지역·조합 페이지 전용 KPI 카드.
 *
 * 대시보드 카드는 값을 문자열 하나로 받아 `192,427원`이 좁은 폭에서
 * `192,427` / `원`으로 끊긴다. 여기서는 값과 단위를 분리하고 값에 nowrap을 줘
 * 390px 2×2 배치에서도 한 줄을 유지한다.
 */
const ScopeKpiCard = ({ title, value, unit, caption }: ScopeKpiCardProps) => (
  <Card
    variant="outlined"
    sx={{
      height: "100%",
      borderRadius: "0.75rem",
      backgroundImage: "none",
      bgcolor: "background.paper",
      borderColor: "divider",
      transition: "border-color 0.2s ease",
      "&:hover": { borderColor: "text.disabled" },
    }}
  >
    <CardContent
      sx={{
        p: { xs: 1.75, sm: 2.5 },
        "&:last-child": { pb: { xs: 1.75, sm: 2.5 } },
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          fontWeight: 500,
          fontSize: "0.8125rem",
          mb: 0.75,
        }}
      >
        {title}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.25 }}>
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
            fontSize: "clamp(1.125rem, 5.2vw, 1.75rem)",
          }}
        >
          {value}
        </Typography>
        {unit ? (
          <Typography
            component="span"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              fontSize: "clamp(0.75rem, 2.6vw, 0.9375rem)",
              whiteSpace: "nowrap",
            }}
          >
            {unit}
          </Typography>
        ) : null}
      </Box>

      {caption ? (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", mt: 0.5, display: "block" }}
        >
          {caption}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
);

export default ScopeKpiCard;
