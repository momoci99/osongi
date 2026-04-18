import { MUSHROOM_SEASON } from "../const/Numbers";

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

/**
 * 다음 시즌 시작일까지 남은 일수를 반환합니다.
 * 시즌 중이면 0을 반환합니다.
 */
export const daysUntilNextSeason = (today: Date): number => {
  const normalizedToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const seasonStartThisYear = new Date(
    normalizedToday.getFullYear(),
    MUSHROOM_SEASON.START_MONTH - 1,
    1,
  );
  const seasonEndThisYear = new Date(
    normalizedToday.getFullYear(),
    MUSHROOM_SEASON.END_MONTH,
    0,
  );

  if (
    normalizedToday >= seasonStartThisYear &&
    normalizedToday <= seasonEndThisYear
  ) {
    return 0;
  }

  const nextSeasonStart =
    normalizedToday < seasonStartThisYear
      ? seasonStartThisYear
      : new Date(
          normalizedToday.getFullYear() + 1,
          MUSHROOM_SEASON.START_MONTH - 1,
          1,
        );

  const diffMs = nextSeasonStart.getTime() - normalizedToday.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export default isInSeason;
