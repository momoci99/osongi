import { Box, Typography } from "@mui/material";
import { LARGE_FIRE_MIN_HA } from "../../../const/Wildfire";
import {
  describeFireDamage,
  formatFireMonth,
  type FireEvent,
} from "../../../utils/wildfire/unionFires";

type FireEventListProps = {
  events: FireEvent[];
};

/**
 * 차트 표식의 내용을 글로 풀어 둔다.
 * 모바일은 표식에 마우스를 올릴 수 없어, 목록이 없으면 어떤 산불인지 알 길이 없다.
 */
const FireEventList = ({ events }: FireEventListProps) => (
  <Box
    component="section"
    aria-label="대형 산불 기록"
    sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}
  >
    <Typography
      variant="caption"
      component="h4"
      sx={{ display: "block", fontWeight: 600, color: "text.primary", mb: 1 }}
    >
      대형 산불 ({LARGE_FIRE_MIN_HA}ha 이상)
    </Typography>
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 0.75 }}>
      {events.map((event) => (
        <Box
          component="li"
          key={event.eventId}
          sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}
        >
          <Box
            aria-hidden
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: "chart.fire",
              flexShrink: 0,
              alignSelf: "center",
            }}
          />
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary", minWidth: 56 }}
          >
            {formatFireMonth(event.startDate)}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {event.label}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {describeFireDamage(event)}
          </Typography>
        </Box>
      ))}
    </Box>
    <Typography variant="caption" sx={{ display: "block", mt: 1.25, color: "text.secondary" }}>
      차트의 점선은 불난 뒤 첫 시즌 앞에 표시했습니다. 피해면적은 산림청 산불통계·발표 기준입니다.
    </Typography>
  </Box>
);

export default FireEventList;
