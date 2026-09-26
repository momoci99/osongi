import { FOREST_FIRE_API } from "../../const/Wildfire";

/** API 원본 한 건 (필드명 그대로). 위치·원인 칸은 빠지는 건이 있다 */
type ForestFireApiItem = {
  damagearea: number | string;
  firecause?: string;
  locsi?: string;
  locgungu?: string;
  locmenu?: string;
  locdong?: string;
  startyear: number | string;
  startmonth: string;
  startday: string;
  starttime: string;
  endyear: number | string;
  endmonth: string;
  endday: string;
  endtime: string;
};

/**
 * 산불 한 건. 위치는 **발화 지점** 기준이다 — 여러 시군으로 번진 대형 산불도 발화 시군 하나로만 기록된다.
 */
export type ForestFire = {
  startDate: string;
  endDate: string;
  province: string;
  county: string;
  township: string;
  village: string;
  cause: string;
  /** 피해면적 합계 (ha) */
  damageHa: number;
};

export class ForestFireApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.code = code;
  }
}

const pad2 = (value: string | number) => String(value).padStart(2, "0");

const cleanText = (value: string | number | undefined) => String(value ?? "").trim();

export const buildForestFireUrl = (serviceKey: string, startDt: string, endDt: string, pageNo = 1): string => {
  const encodedKey = serviceKey.includes("%") ? serviceKey : encodeURIComponent(serviceKey);
  const params = new URLSearchParams({
    pageNo: String(pageNo),
    numOfRows: String(FOREST_FIRE_API.ROWS_PER_PAGE),
    searchStDt: startDt,
    searchEdDt: endDt,
    _type: "json",
  });
  return `${FOREST_FIRE_API.ENDPOINT}?serviceKey=${encodedKey}&${params}`;
};

const toForestFire = (item: ForestFireApiItem): ForestFire => ({
  startDate: `${item.startyear}-${pad2(item.startmonth)}-${pad2(item.startday)}`,
  endDate: `${item.endyear}-${pad2(item.endmonth)}-${pad2(item.endday)}`,
  province: cleanText(item.locsi),
  county: cleanText(item.locgungu),
  township: cleanText(item.locmenu),
  village: cleanText(item.locdong),
  cause: cleanText(item.firecause),
  damageHa: Number(item.damagearea) || 0,
});

/** 응답 본문 → 산불 목록. 한 건이면 item 이 배열이 아니고, 0건이면 items 가 빈 문자열이다 */
export const parseForestFireResponse = (text: string): { fires: ForestFire[]; totalCount: number } => {
  let json: {
    response?: {
      header?: { resultCode?: string; resultMsg?: string };
      body?: { items?: { item?: ForestFireApiItem | ForestFireApiItem[] } | ""; totalCount?: number };
    };
  };
  try {
    json = JSON.parse(text);
  } catch {
    const reason = text.match(/<returnAuthMsg>([^<]+)</)?.[1];
    throw new ForestFireApiError("NON_JSON", reason ?? text.slice(0, 200));
  }
  const header = json.response?.header;
  if (header?.resultCode !== "00") throw new ForestFireApiError(header?.resultCode ?? "UNKNOWN", header?.resultMsg ?? "");
  const body = json.response?.body;
  const raw = body?.items ? body.items.item : undefined;
  const items = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  return { fires: items.map(toForestFire), totalCount: body?.totalCount ?? 0 };
};
