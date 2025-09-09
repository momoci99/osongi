import { Box, Card, Container, Grid, Typography } from "@mui/material";

const Dashboard = () => {
  return (
    <Container>
      <Typography variant="h4">송이버섯 시세 대시보드</Typography>
      <Typography variant="body1">
        송이버섯 시세를 한눈에 확인할 수 있는 대시보드입니다.
      </Typography>

      {/* 주요 정보 섹션 */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ width: "100%", p: 2 }}>asdf</Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ width: "100%", p: 2 }}>asdf</Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ width: "100%", p: 2 }}>asdf</Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ width: "100%", p: 2 }}>asdf</Card>
        </Grid>
      </Grid>

      {/* 메인 차트 1, 2 섹션 */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Card sx={{ width: "100%", p: 2 }}>차트 1</Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Card sx={{ width: "100%", p: 2 }}>차트 2</Card>
        </Grid>
      </Grid>

      {/* 메인차트 3 */}
      <Grid container>
        <Card sx={{ width: "100%", p: 2, mt: 2 }}>차트 3</Card>
      </Grid>
    </Container>
  );
};
export default Dashboard;
