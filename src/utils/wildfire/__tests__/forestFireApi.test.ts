import { describe, expect, it } from "vitest";
import { buildForestFireUrl, ForestFireApiError, parseForestFireResponse } from "../forestFireApi";

const item = {
  damagearea: 52707.3,
  endday: "30",
  endmonth: "03",
  endtime: "17:00:00",
  endyear: 2025,
  firecause: "농산부산물소각",
  locbunji: "산52-1",
  locdong: "용기",
  locgungu: "의성",
  locmenu: "안계",
  locsi: "경북",
  startday: "22",
  startdayofweek: "토요일",
  startmonth: "03",
  starttime: "11:24:00",
  startyear: 2025,
};

const response = (items: unknown, totalCount: number, resultCode = "00") =>
  JSON.stringify({ response: { header: { resultCode, resultMsg: "MSG" }, body: { items, totalCount } } });

describe("parseForestFireResponse", () => {
  it("한 건이면 item 이 객체여도 목록으로 읽는다", () => {
    const { fires, totalCount } = parseForestFireResponse(response({ item }, 1));
    expect(totalCount).toBe(1);
    expect(fires).toEqual([
      {
        startDate: "2025-03-22",
        endDate: "2025-03-30",
        province: "경북",
        county: "의성",
        township: "안계",
        village: "용기",
        cause: "농산부산물소각",
        damageHa: 52707.3,
      },
    ]);
  });

  it("여러 건은 배열 그대로", () => {
    expect(parseForestFireResponse(response({ item: [item, item] }, 2)).fires).toHaveLength(2);
  });

  it("빠진 위치 칸은 빈 문자열", () => {
    const { locdong: _omitted, ...partial } = item;
    expect(parseForestFireResponse(response({ item: partial }, 1)).fires[0].village).toBe("");
  });

  it("0건이면 items 가 빈 문자열", () => {
    expect(parseForestFireResponse(response("", 0))).toEqual({ fires: [], totalCount: 0 });
  });

  it("오류 코드면 예외", () => {
    expect(() => parseForestFireResponse(response("", 0, "30"))).toThrow(ForestFireApiError);
  });

  it("XML 인증 오류도 예외", () => {
    expect(() => parseForestFireResponse("<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>")).toThrow(
      /SERVICE_KEY/,
    );
  });
});

describe("buildForestFireUrl", () => {
  it("키를 한 번만 인코딩하고 기간·JSON 을 붙인다", () => {
    const url = buildForestFireUrl("a+b", "20250101", "20251231");
    expect(url).toContain("serviceKey=a%2Bb&");
    expect(url).toContain("searchStDt=20250101");
    expect(url).toContain("_type=json");
    expect(buildForestFireUrl("a%2Bb", "1", "2")).toContain("serviceKey=a%2Bb&");
  });
});
