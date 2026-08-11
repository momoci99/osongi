import { Box, Grid, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { KILOGRAMS_PER_TON } from "../../const/Units";

export type ScopeLinkItem = {
  name: string;
  path: string;
  avgPricePerKg: number | null;
  totalQuantityKg: number | null;
};

type ScopeLinkGridProps = {
  title: string;
  items: ScopeLinkItem[];
  emptyMessage: string;
};

/**
 * 조합·지역 상호 링크 그리드.
 * 색인 관점에서 각 페이지가 서로를 링크해야 크롤러가 24개 페이지를 모두 순회한다.
 */
const ScopeLinkGrid = ({ title, items, emptyMessage }: ScopeLinkGridProps) => {
  const theme = useTheme();

  return (
    <Box component="nav" aria-label={title} sx={{ mb: 3 }}>
      <Typography
        component="h2"
        variant="h6"
        sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5 }}
      >
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {emptyMessage}
        </Typography>
      ) : (
        <Grid container spacing={1}>
          {items.map((item) => (
            <Grid key={item.path} size={{ xs: 6, sm: 4, md: 3 }}>
              <Box
                component={RouterLink}
                to={item.path}
                sx={{
                  display: "block",
                  p: 1.5,
                  height: "100%",
                  borderRadius: "0.75rem",
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.paper,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    boxShadow:
                      theme.palette.mode === "light"
                        ? "0 2px 8px rgba(0,0,0,0.06)"
                        : "0 2px 8px rgba(0,0,0,0.2)",
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.secondary, display: "block" }}
                >
                  {item.avgPricePerKg
                    ? `평균 ${item.avgPricePerKg.toLocaleString()}원/kg`
                    : "최신 시즌 집계 없음"}
                </Typography>
                {item.totalQuantityKg !== null && (
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary, display: "block" }}
                  >
                    {(item.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1)}톤
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ScopeLinkGrid;
