import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { SeasonReport } from "../../../utils/analysisUtils";
import GradeComparisonTable from "./GradeComparisonTable";
import InsightsList from "./InsightsList";
import ReportSummaryCard from "./ReportSummaryCard";

type SeasonReportSectionProps = {
  report: SeasonReport | null;
  loading?: boolean;
};

/** 시즌 분석 결과를 아코디언 형태의 요약 리포트로 보여주는 컴포넌트 */
const SeasonReportSection = ({
  report,
  loading = false,
}: SeasonReportSectionProps) => {
  const isLoading = loading || report === null;

  return (
    <Accordion defaultExpanded={false}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          시즌 요약 리포트
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {isLoading ? (
          <Box>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
              <Skeleton variant="rounded" height={96} />
              <Skeleton variant="rounded" height={96} />
              <Skeleton variant="rounded" height={96} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                💡 주요 인사이트
              </Typography>
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={24} width="85%" />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                등급별 비교
              </Typography>
              <Skeleton variant="rounded" height={220} />
            </Box>
          </Box>
        ) : (
          <Box>
            <ReportSummaryCard
              summary={report.summary}
              yoyComparison={report.yoyComparison}
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                💡 주요 인사이트
              </Typography>
              <InsightsList insights={report.insights} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                등급별 비교
              </Typography>
              <GradeComparisonTable gradeAnalysis={report.gradeAnalysis} />
            </Box>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default SeasonReportSection;
