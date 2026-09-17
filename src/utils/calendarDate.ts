/** `YYYY-MM-DD` 형식 패턴 */
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * `YYYY-MM-DD` 문자열이 달력에 실제로 존재하는 날짜인지 검사한다.
 * `2023-11-31`처럼 형식은 맞지만 존재하지 않는 날짜는 `new Date()`가
 * 다음 달로 넘겨버리므로 연·월·일을 되돌려 비교한다.
 */
export const isValidCalendarDate = (value: string): boolean => {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export default isValidCalendarDate;
