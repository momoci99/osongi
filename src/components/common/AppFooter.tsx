import { Box, Container, Divider, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { TEST_IDS } from "../../test-ids";
import { AVAILABLE_REGIONS } from "../../const/Common";
import { REGION_ROUTE_PREFIX, regionPath } from "../../const/Regions";
import {
  CODE_LICENSE,
  CONTACT_EMAIL,
  DATA_SOURCE,
  DISCLAIMER,
  GITHUB_REPO_URL,
  NON_COMMERCIAL_NOTICE,
  UPDATE_CYCLE_NOTICE,
} from "../../const/Site";

/**
 * 전역 푸터.
 * 데이터 출처·원본 링크·비영리 고지·면책·연락처·라이선스를 노출한다.
 * 산림조합중앙회 문의 메일에서 약속한 표기 사항이므로 항목을 임의로 제거하지 않는다.
 */
const AppFooter = () => {
  return (
    <Box
      component="footer"
      data-testid={TEST_IDS.APP_FOOTER}
      sx={{
        mt: 8,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 5 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={0.75}>
            <Typography
              variant="overline"
              sx={{ color: "text.secondary", letterSpacing: "0.08em" }}
            >
              데이터 출처
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              <Link
                href={DATA_SOURCE.url}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{ color: "text.primary", fontWeight: 600 }}
              >
                {DATA_SOURCE.name}
              </Link>
              {" — 원본 페이지에서 직접 확인하실 수 있습니다."}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {UPDATE_CYCLE_NOTICE}
            </Typography>
          </Stack>

          <Divider flexItem />

          {/** 지역 페이지로 가는 링크를 전 페이지에 두어 크롤러 순회 경로를 만든다 */}
          <Stack spacing={0.75}>
            <Typography
              variant="overline"
              sx={{ color: "text.secondary", letterSpacing: "0.08em" }}
            >
              지역별 시세
            </Typography>
            <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
              {AVAILABLE_REGIONS.map((region) => (
                <Link
                  key={region}
                  component={RouterLink}
                  to={regionPath(region)}
                  underline="hover"
                  variant="body2"
                  sx={{ color: "text.secondary" }}
                >
                  {region} 송이 시세
                </Link>
              ))}
              <Link
                component={RouterLink}
                to={REGION_ROUTE_PREFIX}
                underline="hover"
                variant="body2"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                전체 조합 보기
              </Link>
            </Stack>
          </Stack>

          <Divider flexItem />

          <Stack spacing={0.75}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {DISCLAIMER}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {NON_COMMERCIAL_NOTICE}
            </Typography>
          </Stack>

          <Divider flexItem />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 2 }}
            useFlexGap
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              © 2026 오송이 · 개인 비영리 프로젝트
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              <Link
                href={`mailto:${CONTACT_EMAIL}`}
                underline="hover"
                variant="caption"
                sx={{ color: "text.secondary" }}
              >
                문의 · 중단 요청 {CONTACT_EMAIL}
              </Link>
              <Link
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                variant="caption"
                sx={{ color: "text.secondary" }}
              >
                GitHub
              </Link>
              <Link
                href={CODE_LICENSE.url}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                variant="caption"
                sx={{ color: "text.secondary" }}
              >
                코드 {CODE_LICENSE.name}
              </Link>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default AppFooter;
