import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import FireEventList from "../ScopeYearlyChart/FireEventList";
import { groupBySeason, markerRadius } from "../ScopeYearlyChart/drawFireMarkers";
import type { FireEvent } from "../../../utils/wildfire/unionFires";

const uljin: FireEvent = {
  eventId: "2022-uljin-samcheok",
  label: "울진·삼척 산불",
  startDate: "2022-03-04",
  seasonYear: 2022,
  totalHa: 16302,
  counties: ["울진", "삼척"],
  source: "산림청",
  affected: [{ union: "삼척", damageHa: null }],
};

const gyeongbuk: FireEvent = {
  eventId: "2025-gyeongbuk",
  label: "경북 산불 (의성 발화)",
  startDate: "2025-03-22",
  seasonYear: 2025,
  totalHa: 99289,
  counties: ["의성", "안동"],
  source: "산림청",
  affected: [
    { union: "의성", damageHa: 28853 },
    { union: "안동", damageHa: 26709 },
  ],
};

describe("FireEventList", () => {
  it("산불마다 연월·이름·피해를 한 줄로 쓴다", () => {
    render(
      <ThemeProvider theme={theme}>
        <FireEventList events={[uljin, gyeongbuk]} />
      </ThemeProvider>
    );
    const items = within(screen.getByRole("region", { name: "대형 산불 기록" })).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("2022.03울진·삼척 산불울진·삼척 합계 16,302ha");
    expect(items[1]).toHaveTextContent("의성 28,853 · 안동 26,709ha");
  });
});

describe("groupBySeason", () => {
  it("축 범위 안 시즌만 시즌별로 묶는다", () => {
    const grouped = groupBySeason([uljin, gyeongbuk], [2020, 2021, 2022, 2023]);
    expect([...grouped.keys()]).toEqual([2022]);
  });
});

describe("markerRadius", () => {
  it("100ha 는 최소, 10배마다 커지고 최대에서 멈춘다", () => {
    expect(markerRadius(100)).toBe(3);
    expect(markerRadius(1000)).toBeCloseTo(4.4);
    expect(markerRadius(1_000_000)).toBe(7);
  });
});
