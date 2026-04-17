import { Box, Tooltip, useTheme } from "@mui/material";

type DataDateBadgeProps = {
  latestDataDate: string | undefined;
};

/** "2026-04-14" → "04/14" 형태로 짧게 표기 */
const formatLatestDataDate = (iso: string | undefined): string | null => {
  if (!iso) return null;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${match[2]}/${match[3]}`;
};

const DataDateBadge = ({ latestDataDate }: DataDateBadgeProps) => {
  const theme = useTheme();
  const label = formatLatestDataDate(latestDataDate);

  if (!label) return null;

  return (
    <Tooltip
      title={
        latestDataDate ? `데이터 기준일: ${latestDataDate}` : "데이터 기준일"
      }
    >
      <Box
        sx={{
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          gap: 0.5,
          mr: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: "0.375rem",
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.secondary,
          fontSize: "0.75rem",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: theme.palette.primary.main,
          }}
        />
        기준 {label}
      </Box>
    </Tooltip>
  );
};

export default DataDateBadge;
