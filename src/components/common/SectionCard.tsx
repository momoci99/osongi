import { Paper, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";

type SectionCardProps = {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

const SectionCard = ({ children, sx }: SectionCardProps) => {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "0.75rem",
        backgroundColor: theme.palette.background.paper,
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

export default SectionCard;
