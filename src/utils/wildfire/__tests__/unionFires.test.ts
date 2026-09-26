import { describe, expect, it } from "vitest";
import type { ForestFire } from "../forestFireApi";
import {
  buildUnionFireMarks,
  describeFireDamage,
  formatFireMonth,
  groupFireEvents,
  seasonYearOf,
  type MajorFireOverride,
} from "../unionFires";

const fire = (overrides: Partial<ForestFire>): ForestFire => ({
  startDate: "2022-03-05",
  endDate: "2022-03-10",
  province: "강원",
  county: "강릉",
  township: "옥계",
  village: "",
  cause: "기타",
  damageHa: 4190.38,
  ...overrides,
});

const gyeongbuk: MajorFireOverride = {
  id: "2025-gyeongbuk",
  label: "경북 산불 (의성 발화)",
  startDate: "2025-03-22",
  replacesApi: [{ startDate: "2025-03-22", province: "경북", county: "의성" }],
  areas: [
    { province: "경북", county: "의성", damageHa: 28853 },
    { province: "경북", county: "안동", damageHa: 26709 },
  ],
  totalHa: 55562,
  source: "산림청",
  sourceUrl: "https://example.com",
};

const uljin: MajorFireOverride = {
  id: "2022-uljin-samcheok",
  label: "울진·삼척 산불",
  startDate: "2022-03-04",
  replacesApi: [{ startDate: "2022-03-04", province: "경북", county: "울진" }],
  areas: [
    { province: "경북", county: "울진", damageHa: null },
    { province: "강원", county: "삼척", damageHa: null },
  ],
  totalHa: 16302,
  source: "산림청",
  sourceUrl: "https://example.com",
};

const UNIONS = [
  { region: "강원", union: "강릉" },
  { region: "강원", union: "고성" },
  { region: "강원", union: "삼척" },
  { region: "경북", union: "의성" },
  { region: "경북", union: "안동" },
  { region: "경북", union: "울진" },
];

describe("seasonYearOf", () => {
  it("봄 산불은 그해 시즌, 9월 이후는 다음 시즌", () => {
    expect(seasonYearOf("2022-03-04")).toBe(2022);
    expect(seasonYearOf("2022-09-01")).toBe(2023);
  });
});

describe("buildUnionFireMarks", () => {
  it("문턱 이상·같은 도 같은 시군만 조합에 붙인다", () => {
    const marks = buildUnionFireMarks(
      [
        fire({}),
        fire({ damageHa: 50 }),
        /** 경남 고성은 강원 고성 조합과 다르다 */
        fire({ province: "경남", county: "고성", damageHa: 500 }),
      ],
      [],
      UNIONS,
      100,
    );
    expect(Object.keys(marks)).toEqual(["강릉"]);
    expect(marks.강릉[0]).toMatchObject({ label: "강릉 산불", damageHa: 4190.38, seasonYear: 2022 });
  });

  it("보정표가 있는 산불은 API 기록을 대체하고 번진 시군까지 붙인다", () => {
    const marks = buildUnionFireMarks(
      [fire({ startDate: "2025-03-22", province: "경북", county: "의성", damageHa: 52707.3 })],
      [gyeongbuk],
      UNIONS,
      100,
    );
    expect(marks.의성).toHaveLength(1);
    expect(marks.의성[0]).toMatchObject({ eventId: "2025-gyeongbuk", damageHa: 28853, totalHa: 55562 });
    expect(marks.안동[0].damageHa).toBe(26709);
  });

  it("시군별 면적이 없으면 damageHa 는 null, 합계는 유지", () => {
    const marks = buildUnionFireMarks([], [uljin], UNIONS, 100);
    expect(marks.삼척[0]).toMatchObject({ damageHa: null, totalHa: 16302, counties: ["울진", "삼척"] });
  });

  it("'용인 처인' 같은 구 표기도 시군으로 맞춘다", () => {
    const marks = buildUnionFireMarks([fire({ county: "강릉 옥계" })], [], UNIONS, 100);
    expect(marks.강릉).toHaveLength(1);
  });
});

describe("groupFireEvents · describeFireDamage", () => {
  const marks = buildUnionFireMarks([fire({})], [gyeongbuk, uljin], UNIONS, 100);

  it("여러 조합에 걸친 산불을 한 건으로 묶고 날짜순", () => {
    const events = groupFireEvents(marks, ["강릉", "의성", "안동", "울진", "삼척"]);
    expect(events.map((e) => e.eventId)).toEqual(["2022-uljin-samcheok", "2022-03-05-강릉", "2025-gyeongbuk"]);
    expect(events[2].affected.map((a) => a.union)).toEqual(["의성", "안동"]);
  });

  it("조합별 면적을 알면 조합별로 쓴다", () => {
    const [event] = groupFireEvents(marks, ["의성", "안동"]);
    expect(describeFireDamage(event)).toBe("의성 28,853 · 안동 26,709ha");
  });

  it("모르면 산불 전체 합계와 시군 목록", () => {
    const [event] = groupFireEvents(marks, ["삼척"]);
    expect(describeFireDamage(event)).toBe("울진·삼척 합계 16,302ha");
  });

  it("formatFireMonth", () => {
    expect(formatFireMonth("2022-03-04")).toBe("2022.03");
  });
});
