import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";

type DashboardKpiCardProps = {
  title: string;
  content: string;
  /** 값 뒤에 작게 붙는 단위·보조 표기 (예: "kg", "생장정지품") */
  suffix?: string;
  caption?: string;
  icon?: React.ReactNode;
};

const DashboardKpiCard = (props: DashboardKpiCardProps) => {
  const { title, content, suffix, caption, icon } = props;
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "0.75rem",
        width: "100%",
        backgroundImage: "none",
        bgcolor: theme.palette.background.paper,
        borderColor: theme.palette.divider,
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow:
            theme.palette.mode === "light"
              ? "0 2px 8px rgba(0,0,0,0.06)"
              : "0 2px 8px rgba(0,0,0,0.2)",
        },
      }}
    >
      <CardContent
        sx={{
          p: { xs: 1.75, sm: 2.5 },
          "&:last-child": { pb: { xs: 1.75, sm: 2.5 } },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontSize: "0.8125rem",
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: theme.palette.text.secondary, opacity: 0.5 }}>
              {icon}
            </Box>
          )}
        </Box>
        <Typography
          variant="h3"
          className="kpi-value"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
            lineHeight: 1.2,
            wordBreak: "keep-all",
            overflowWrap: "anywhere",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {content}
          {suffix && (
            <Typography
              component="span"
              sx={{
                display: "inline-block",
                ml: 0.5,
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                fontWeight: 500,
                color: theme.palette.text.secondary,
                whiteSpace: "nowrap",
              }}
            >
              {suffix}
            </Typography>
          )}
        </Typography>
        {caption && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              mt: 0.5,
              display: "block",
            }}
          >
            {caption}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardKpiCard;
