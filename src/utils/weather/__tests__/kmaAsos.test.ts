import { describe, expect, it } from "vitest";
import { REGION_UNION_MAP } from "../../../const/Common";
import { SOIL_TEMP_STATION_IDS, UNION_WEATHER_STATION } from "../../../const/Weather";
import {
  buildDailyRequestUrl,
  collectionRange,
  collectionStationIds,
  KmaApiError,
  latestAvailableYmd,
  maskServiceKey,
  needsFetch,
  parseDailyResponse,
  type KmaRawYearFile,
} from "../kmaAsos";

/** KST 시각으로 Date 생성 */
const kst = (iso: string) => new Date(`${iso}+09:00`);

describe("latestAvailableYmd", () => {
  it("KST 11시 이후면 전일까지", () => {
    expect(latestAvailableYmd(kst("2026-09-22T11:00:00"))).toBe("20260921");
  });

  it("KST 11시 전이면 전전일까지", () => {
    expect(latestAvailableYmd(kst("2026-09-22T10:59:00"))).toBe("20260920");
  });

  it("UTC 날짜가 하루 늦은 KST 새벽도 KST 기준으로 계산", () => {
    expect(latestAvailableYmd(kst("2026-09-22T01:00:00"))).toBe("20260920");
  });
});

describe("collectionRange", () => {
  it("지난 연도는 수집 창 전체, 완료", () => {
    expect(collectionRange(2025, kst("2026-09-22T12:00:00"))).toEqual({
      startDt: "20250701",
      endDt: "20251130",
      complete: true,
    });
  });

  it("진행 중인 연도는 조회 가능일까지, 미완료", () => {
    expect(collectionRange(2026, kst("2026-09-22T12:00:00"))).toEqual({
      startDt: "20260701",
      endDt: "20260921",
      complete: false,
    });
  });

  it("수집 창 시작 전이면 null", () => {
    expect(collectionRange(2027, kst("2026-09-22T12:00:00"))).toBeNull();
    expect(collectionRange(2026, kst("2026-07-01T10:00:00"))).toBeNull();
  });
});

describe("지점 매핑", () => {
  it("모든 공판 조합에 지점이 매핑돼 있다", () => {
    const unions = Object.values(REGION_UNION_MAP).flat();
    expect(Object.keys(UNION_WEATHER_STATION).sort()).toEqual([...unions].sort());
  });

  it("대체 지점은 거리를 가진다", () => {
    Object.values(UNION_WEATHER_STATION)
      .filter((s) => s.isSubstitute)
      .forEach((s) => expect(s.distanceKm).toBeGreaterThan(0));
  });

  it("수집 대상은 매핑 지점과 지온 검증 지점의 중복 없는 합집합", () => {
    const ids = collectionStationIds();
    expect(new Set(ids).size).toBe(ids.length);
    SOIL_TEMP_STATION_IDS.forEach((id) => expect(ids).toContain(id));
    Object.values(UNION_WEATHER_STATION).forEach((s) => expect(ids).toContain(s.stationId));
  });
});

describe("buildDailyRequestUrl", () => {
  const range = { startDt: "20250701", endDt: "20251130" };

  it("Encoding 키는 그대로 붙인다 (이중 인코딩 방지)", () => {
    const url = buildDailyRequestUrl("ab%2Fcd%3D%3D", 271, range);
    expect(url).toContain("serviceKey=ab%2Fcd%3D%3D&");
    expect(url).not.toContain("%252F");
  });

  it("Decoding 키는 인코딩해서 붙인다", () => {
    expect(buildDailyRequestUrl("ab/cd==", 271, range)).toContain("serviceKey=ab%2Fcd%3D%3D&");
  });

  it("필수 파라미터를 포함한다", () => {
    const params = new URL(buildDailyRequestUrl("k", 271, range, 2)).searchParams;
    expect(params.get("dataCd")).toBe("ASOS");
    expect(params.get("dateCd")).toBe("DAY");
    expect(params.get("stnIds")).toBe("271");
    expect(params.get("startDt")).toBe("20250701");
    expect(params.get("endDt")).toBe("20251130");
    expect(params.get("pageNo")).toBe("2");
    expect(params.get("dataType")).toBe("JSON");
  });
});

describe("maskServiceKey", () => {
  it("원문·인코딩 형태의 키를 모두 가린다", () => {
    const key = "ab/cd==";
    const text = `x?serviceKey=${encodeURIComponent(key)} raw=${key}`;
    expect(maskServiceKey(text, key)).toBe("x?serviceKey=*** raw=***");
  });
});

describe("parseDailyResponse", () => {
  const response = (resultCode: string, items: unknown, totalCount = 1) =>
    JSON.stringify({
      response: {
        header: { resultCode, resultMsg: "MSG" },
        body: { items, totalCount },
      },
    });

  it("정상 응답은 보존 필드만 문자열로 추린다", () => {
    const { rows, totalCount } = parseDailyResponse(
      response("00", { item: [{ tm: "2025-09-01", avgTa: "25.9", avgCm5Te: "", sumRn: null, extra: "x" }] }),
    );
    expect(totalCount).toBe(1);
    expect(rows[0].tm).toBe("2025-09-01");
    expect(rows[0].avgTa).toBe("25.9");
    expect(rows[0].avgCm5Te).toBe("");
    expect(rows[0].sumRn).toBe("");
    expect(rows[0]).not.toHaveProperty("extra");
  });

  it("NODATA(03)는 빈 결과", () => {
    expect(parseDailyResponse(response("03", "", 0))).toEqual({ rows: [], totalCount: 0 });
  });

  it("오류 코드는 KmaApiError 로 던진다", () => {
    expect(() => parseDailyResponse(response("22", ""))).toThrow(KmaApiError);
    try {
      parseDailyResponse(response("22", ""));
    } catch (error) {
      expect((error as KmaApiError).code).toBe("22");
    }
  });

  it("XML 오류 응답은 인증 메시지를 담아 던진다", () => {
    const xml = "<OpenAPI_ServiceResponse><cmmMsgHeader><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg></cmmMsgHeader></OpenAPI_ServiceResponse>";
    expect(() => parseDailyResponse(xml)).toThrow("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
  });
});

describe("needsFetch", () => {
  const file = (complete: boolean) => ({ complete }) as KmaRawYearFile;

  it("파일이 없거나 미완료면 다시 받는다", () => {
    expect(needsFetch(null)).toBe(true);
    expect(needsFetch(file(false))).toBe(true);
  });

  it("완료된 파일은 건너뛴다", () => {
    expect(needsFetch(file(true))).toBe(false);
  });
});
