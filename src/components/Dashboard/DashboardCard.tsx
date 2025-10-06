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
      variant={theme.palette.mode === "dark" ? "outlined" : "elevation"}
      elevation={theme.palette.mode === "dark" ? 0 : 1}
      sx={{
        borderRadius: 3,
        p: 2,
        width: "100%",
        backgroundImage: "none",
        backgroundColor: "transparent",
      }}
    >
      {children}
    </Card>
  );
};

export default DashboardCard;
