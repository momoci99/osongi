/** 최신 데이터가 7일 이내이면 시즌 중. ?season=on|off 로 강제 가능 */
const isInSeason = (latestDate: string): boolean => {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("season");
  if (override === "on") return true;
  if (override === "off") return false;

  const latest = new Date(latestDate);
  const now = new Date();
  const diffMs = now.getTime() - latest.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

export default isInSeason;
