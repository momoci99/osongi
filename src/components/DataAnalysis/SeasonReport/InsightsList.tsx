import { Box, Typography } from "@mui/material";

type InsightsListProps = {
  insights: string[];
};

/** 시즌 리포트 해석 문장을 간단한 목록으로 보여주는 컴포넌트 */
const InsightsList = ({ insights }: InsightsListProps) => {
  if (insights.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
        분석할 데이터가 부족합니다.
      </Typography>
    );
  }

  return (
    <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
      {insights.map((insight, index) => (
        <Box
          key={`${insight}-${index}`}
          component="li"
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 0.75,
            fontSize: "0.875rem",
            lineHeight: 1.6,
            "&:not(:last-of-type)": {
              mb: 0.5,
            },
          }}
        >
          <Typography component="span" sx={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
            •
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
            {insight}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default InsightsList;
