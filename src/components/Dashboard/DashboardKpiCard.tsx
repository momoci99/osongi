import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";

type DashboardKpiCardProps = {
  title: string;
  content: string;
  caption?: string;
  icon?: React.ReactNode;
};

const DashboardKpiCard = (props: DashboardKpiCardProps) => {
  const { title, content, caption, icon } = props;
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
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
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
            fontSize: "1.75rem",
            lineHeight: 1.2,
          }}
        >
          {content}
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
