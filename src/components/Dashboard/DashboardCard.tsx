import { Card, useTheme } from "@mui/material";
import type { ReactNode } from "react";

type DashboardCardProps = {
  children?: ReactNode;
};

const DashboardCard = (props: DashboardCardProps) => {
  const { children } = props;
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "0.75rem",
        p: 2.5,
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
      {children}
    </Card>
  );
};

export default DashboardCard;
