import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../theme";
import { makeRegionManifest, makeScopeStats } from "../../test-fixtures/region";
import type { RegionManifest } from "../../types/region";

/** 매니페스트 캐시가 모듈 스코프라 테스트마다 페이지를 새로 불러온다 */
const renderIndex = async () => {
  vi.resetModules();
  const RegionIndex = (await import("../RegionIndex")).default;

  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <RegionIndex />
      </MemoryRouter>
    </ThemeProvider>
  );
};

/** 집계 없는 조합과 다른 지역 조합을 섞은 매니페스트 */
const manifest: RegionManifest = (() => {
  const base = makeRegionManifest();
  base.regions["경북"].unions = ["봉화", "울진", "영천"];
  base.regions["강원"] = {
    ...makeScopeStats({
      name: "강원",
      region: "강원",
      quantityRank: undefined,
      season: {
        startDate: "2025-09-20",
        endDate: "2025-11-12",
        totalQuantityKg: 5000,
        totalAmountWon: 1600000000,
        avgPricePerKg: 320000,
      },
    }),
    unions: ["인제"],
  };
  base.unions["영천"] = makeScopeStats({
    name: "영천",
    region: "경북",
    season: null,
    peak: null,
    quantityRank: undefined,
  });
  base.unions["인제"] = makeScopeStats({
    name: "인제",
    region: "강원",
    season: {
      startDate: "2025-09-20",
      endDate: "2025-11-12",
      totalQuantityKg: 5000,
      totalAmountWon: 1600000000,
      avgPricePerKg: 320000,
    },
  });
  return base;
})();

const unionNav = () =>
  within(screen.getByRole("navigation", { name: "산림조합" }));

/** 순위 열을 제외한 조합 이름 순서 */
const unionOrder = () =>
  unionNav()
    .getAllByRole("link")
    .map((link) => link.textContent ?? "");

beforeEach(() => {
  document.head.innerHTML = "";
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => manifest })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RegionIndex", () => {
  it("지역 요약 카드에 소속 조합 수를 붙인다", async () => {
    await renderIndex();

    /** 전체 스위트를 병렬로 돌리면 매니페스트 fetch 가 기본 1초를 넘길 때가 있다 */
    expect(
      await screen.findByText("산림조합 3곳", {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(screen.getByText("산림조합 1곳")).toBeInTheDocument();
  });

  it("상단 KPI에 최고 단가 조합과 전체 공판량을 건다", async () => {
    await renderIndex();

    expect(
      await screen.findByText("최신 시즌 최고 단가", {}, { timeout: 3000 })
    ).toBeInTheDocument();
    /** 인제 320,000원이 최고 단가 */
    expect(screen.getByText("강원 인제 · kg당")).toBeInTheDocument();
    /** 경북 12,000kg + 강원 5,000kg */
    expect(screen.getByText("전체 공판량")).toBeInTheDocument();
    expect(screen.getByText("17.0")).toBeInTheDocument();
  });

  it("조합 목록을 기본으로 물량 내림차순 정렬한다", async () => {
    await renderIndex();
    await screen.findByRole("navigation", { name: "산림조합" });

    const order = unionOrder();
    /** 울진 30,000 > 봉화 12,000 > 인제 5,000 > 집계 없는 영천 */
    expect(order[0]).toContain("울진");
    expect(order[1]).toContain("봉화");
    expect(order[2]).toContain("인제");
    expect(order[3]).toContain("영천");
  });

  it("집계 없는 조합은 순위 없이 목록 끝에 둔다", async () => {
    await renderIndex();
    await screen.findByRole("navigation", { name: "산림조합" });

    const rows = unionNav().getAllByRole("link");
    const last = rows[rows.length - 1];
    expect(last).toHaveTextContent("영천");
    expect(last).toHaveTextContent("집계 없음");
  });

  it("정렬을 단가순으로 바꾸면 순서가 바뀐다", async () => {
    const user = userEvent.setup();
    await renderIndex();
    await screen.findByRole("navigation", { name: "산림조합" });

    await user.click(screen.getByRole("button", { name: "단가순" }));

    const order = unionOrder();
    /** 인제 320,000 > 봉화 300,000 > 울진 270,000 */
    expect(order[0]).toContain("인제");
    expect(order[1]).toContain("봉화");
    expect(order[2]).toContain("울진");
  });

  it("지역 칩으로 조합 목록을 걸러 낸다", async () => {
    const user = userEvent.setup();
    await renderIndex();
    const filters = await screen.findByRole("group", { name: "지역 필터" });

    await user.click(within(filters).getByText("강원"));

    const order = unionOrder();
    expect(order).toHaveLength(1);
    expect(order[0]).toContain("인제");
  });

  it("로드에 실패하면 오류 문구를 보여준다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );

    await renderIndex();

    expect(
      await screen.findByText(
        "시세 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      )
    ).toBeInTheDocument();
  });
});
