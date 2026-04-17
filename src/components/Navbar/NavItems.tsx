import { Button, useTheme } from "@mui/material";
import { useNavigate } from "react-router";

type NavItem = { label: string; path: string };

type NavItemsProps = {
  items: NavItem[];
  isActive: (path: string) => boolean;
};

const NavItems = ({ items, isActive }: NavItemsProps) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <>
      {items.map((item) => (
        <Button
          key={item.path}
          onClick={() => navigate(item.path)}
          sx={{
            color: isActive(item.path)
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
            fontWeight: isActive(item.path) ? 600 : 400,
            fontSize: "0.875rem",
            position: "relative",
            "&::after": isActive(item.path)
              ? {
                  content: '""',
                  position: "absolute",
                  bottom: 4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 16,
                  height: 2,
                  borderRadius: 1,
                  bgcolor: theme.palette.primary.main,
                }
              : undefined,
          }}
        >
          {item.label}
        </Button>
      ))}
    </>
  );
};

export default NavItems;
