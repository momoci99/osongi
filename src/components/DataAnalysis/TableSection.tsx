import { Box, Typography, Paper, useTheme } from "@mui/material";
import type { AnalysisFilters } from "../../utils/analysisUtils";
import { UI_LAYOUT, THEME_VALUES } from "../../const/Numbers";

interface TableSectionProps {
  loading: boolean;
  filteredDataLength: number;
  filters: AnalysisFilters;
}

export default function TableSection({
  loading,
  filteredDataLength,
  filters,
}: TableSectionProps) {
  const theme = useTheme();

  return (
    <Paper
      variant={theme.palette.mode === "dark" ? "outlined" : "elevation"}
      elevation={
        theme.palette.mode === "dark"
          ? THEME_VALUES.DARK_ELEVATION
          : THEME_VALUES.LIGHT_ELEVATION
      }
      sx={{
        p: UI_LAYOUT.CARD_PADDING,
        mb: UI_LAYOUT.CARD_MARGIN_BOTTOM,
        borderRadius: UI_LAYOUT.CARD_BORDER_RADIUS,
        width: "100%",
        backgroundImage: "none",
        backgroundColor: "transparent",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: UI_LAYOUT.SECTION_MARGIN_BOTTOM,
        }}
      >
        <Typography variant="h6">상세 데이터</Typography>
        {!loading && filteredDataLength > 0 && (
          <Typography variant="body2" color="text.secondary">
            📋 총 {filteredDataLength}개 레코드
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          height: UI_LAYOUT.TABLE_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: UI_LAYOUT.FORM_GAP,
        }}
      >
        {loading ? (
          <Typography color="text.secondary">📋 데이터 로딩 중...</Typography>
        ) : filteredDataLength > 0 ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body1">📊 데이터 미리보기</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              지역: {filters.region} | 조합: {filters.union} | 등급:{" "}
              {filters.grades.length}개 선택
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              테이블 컴포넌트가 여기에 표시됩니다
            </Typography>
          </Box>
        ) : (
          <Typography color="text.secondary">
            📋 표시할 데이터가 없습니다
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
