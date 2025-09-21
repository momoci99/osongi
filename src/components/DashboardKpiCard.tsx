import { Card, CardContent, Typography, useTheme } from "@mui/material";

type DashboardKpiCardProps = {
  title: string;
  content: string;
  caption?: string;
  icon: React.ReactNode;
};

const DashboardKpiCard = (props: DashboardKpiCardProps) => {
  const { title, content, caption, icon } = props;

  const theme = useTheme();

  return (
    <Card
      variant={theme.palette.mode === "dark" ? "outlined" : "elevation"}
      elevation={theme.palette.mode === "dark" ? 0 : 1}
      sx={{
        borderRadius: 3,
        width: "100%",
        backgroundImage: "none",
        backgroundColor: "transparent",
      }}
    >
      <CardContent>
        <div style={{ display: "flex" }}>
          <Typography
            sx={{
              marginBottom: 1,
              justifyContent: "space-between",
              display: "flex",
              width: "100%",
            }}
            component="div"
            variant="subtitle2"
          >
            {title}
            {icon}
          </Typography>
        </div>
        <Typography variant="h4">{content}</Typography>
        <Typography variant="caption">{caption}</Typography>
      </CardContent>
    </Card>
  );
};

export default DashboardKpiCard;
