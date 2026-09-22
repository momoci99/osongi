import {
  KMA_ASOS_DAILY,
  KMA_DAILY_FIELDS,
  KMA_RESULT_CODE,
  SOIL_TEMP_STATION_IDS,
  UNION_WEATHER_STATION,
  WEATHER_COLLECTION_WINDOW,
} from "../../const/Weather";

/** 보존 필드만 남긴 일자료 한 행 (값은 응답 문자열 그대로) */
export type KmaDailyRow = Record<(typeof KMA_DAILY_FIELDS)[number], string>;

/** 지점·연도 단위 원본 파일 */
export type KmaRawYearFile = {
  stationId: number;
  year: number;
  startDt: string;
  endDt: string;
  /** 수집 창 끝까지 받았는지 — false 면 다음 실행에서 다시 받는다 */
  complete: boolean;
  fetchedAt: string;
  rows: KmaDailyRow[];
};

/** 수집 기간 (YYYYMMDD) */
export type CollectionRange = {
  startDt: string;
  endDt: string;
  complete: boolean;
};

/** 공공데이터포털이 정상 코드가 아닌 응답을 돌려줬을 때 */
export class KmaApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = "KmaApiError";
    this.code = code;
  }
}

const KST_OFFSET_HOURS = 9;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Date → KST 기준 YYYYMMDD */
const toKstYmd = (date: Date): string =>
  new Date(date.getTime() + KST_OFFSET_HOURS * MS_PER_HOUR)
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

/**
 * 현재 시각에 조회 가능한 마지막 일자 (YYYYMMDD).
 * D-1 자료는 KST 11시 이후 공개되므로 그 전에는 D-2 까지만 받는다.
 */
export const latestAvailableYmd = (now: Date): string => {
  const kstHour = (now.getUTCHours() + KST_OFFSET_HOURS) % 24;
  const lagDays = kstHour >= KMA_ASOS_DAILY.PREV_DAY_OPEN_HOUR_KST ? 1 : 2;
  return toKstYmd(new Date(now.getTime() - lagDays * MS_PER_DAY));
};

/**
 * 연도별 수집 창을 현재 시각 기준으로 잘라낸다.
 * 창이 아직 시작되지 않았으면 null.
 */
export const collectionRange = (
  year: number,
  now: Date,
): CollectionRange | null => {
  const startDt = `${year}${WEATHER_COLLECTION_WINDOW.START_MMDD}`;
  const windowEnd = `${year}${WEATHER_COLLECTION_WINDOW.END_MMDD}`;
  const latest = latestAvailableYmd(now);

  if (latest < startDt) return null;
  if (latest >= windowEnd) return { startDt, endDt: windowEnd, complete: true };
  return { startDt, endDt: latest, complete: false };
};

/** 수집 대상 지점 — 조합 매핑 지점 + 지온 검증용 지점 (중복 제거, 오름차순) */
export const collectionStationIds = (): number[] =>
  [
    ...new Set([
      ...Object.values(UNION_WEATHER_STATION).map((s) => s.stationId),
      ...SOIL_TEMP_STATION_IDS,
    ]),
  ].sort((a, b) => a - b);

/**
 * 요청 URL 조립.
 * 서비스키는 포털의 Encoding 키(퍼센트 인코딩 포함)와 Decoding 키 모두 받는다.
 * Encoding 키를 URLSearchParams 에 넣으면 이중 인코딩되므로 직접 붙인다.
 */
export const buildDailyRequestUrl = (
  serviceKey: string,
  stationId: number,
  range: Pick<CollectionRange, "startDt" | "endDt">,
  pageNo = 1,
): string => {
  const encodedKey = serviceKey.includes("%")
    ? serviceKey
    : encodeURIComponent(serviceKey);
  const params = new URLSearchParams({
    pageNo: String(pageNo),
    numOfRows: String(KMA_ASOS_DAILY.ROWS_PER_PAGE),
    dataType: "JSON",
    dataCd: KMA_ASOS_DAILY.DATA_CODE,
    dateCd: KMA_ASOS_DAILY.DATE_CODE,
    startDt: range.startDt,
    endDt: range.endDt,
    stnIds: String(stationId),
  });
  return `${KMA_ASOS_DAILY.ENDPOINT}?serviceKey=${encodedKey}&${params}`;
};

/** 로그·에러 메시지에서 서비스키를 가린다 */
export const maskServiceKey = (text: string, serviceKey: string): string => {
  if (!serviceKey) return text;
  const variants = [serviceKey, encodeURIComponent(serviceKey)];
  return variants.reduce((acc, v) => acc.split(v).join("***"), text);
};

type KmaResponseBody = {
  totalCount?: number;
  items?: { item?: Record<string, unknown>[] } | "";
};

type KmaResponse = {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: KmaResponseBody;
  };
};

/** 응답 항목에서 보존 필드만 문자열로 추린다 (null·누락은 빈 문자열) */
export const pickDailyFields = (item: Record<string, unknown>): KmaDailyRow =>
  Object.fromEntries(
    KMA_DAILY_FIELDS.map((field) => [field, String(item[field] ?? "")]),
  ) as KmaDailyRow;

/**
 * 응답 본문 해석.
 * 포털은 키 오류 등을 XML 로 돌려주기도 하므로 JSON 이 아니면 원문 일부를 담아 던진다.
 * NODATA(03)는 에러가 아니라 빈 결과로 취급한다.
 */
export const parseDailyResponse = (
  text: string,
): { rows: KmaDailyRow[]; totalCount: number } => {
  let json: KmaResponse;
  try {
    json = JSON.parse(text) as KmaResponse;
  } catch {
    const reason = text.match(/<returnAuthMsg>([^<]+)</)?.[1];
    throw new KmaApiError("NON_JSON", reason ?? text.slice(0, 200));
  }

  const code = json.response?.header?.resultCode ?? "UNKNOWN";
  if (code === KMA_RESULT_CODE.NO_DATA) return { rows: [], totalCount: 0 };
  if (code !== KMA_RESULT_CODE.OK) {
    throw new KmaApiError(code, json.response?.header?.resultMsg ?? "");
  }

  const body = json.response?.body;
  const items = body?.items ? (body.items.item ?? []) : [];
  return {
    rows: items.map(pickDailyFields),
    totalCount: body?.totalCount ?? items.length,
  };
};

/** 원본 파일을 다시 받아야 하는지 — 없거나 미완료면 true */
export const needsFetch = (existing: KmaRawYearFile | null): boolean =>
  existing === null || !existing.complete;
