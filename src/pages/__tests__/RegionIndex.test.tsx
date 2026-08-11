import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

/** 집계 없는 조합을 하나 섞은 매니페스트 */
const manifest: RegionManifest = (() => {
  const base = makeRegionManifest();
  base.regions["경북"].unions = ["봉화", "울진", "영천"];
  base.unions["영천"] = makeScopeStats({
    name: "영천",
    region: "경북",
    season: null,
    peak: null,
    quantityRank: undefined,
  });
  return base;
})();

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
  it("지역 섹션과 조합 섹션을 분리해 노출한다", async () => {
    await renderIndex();

    expect(await screen.findByRole("navigation", { name: "지역" })).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "산림조합 (최신 시즌 물량순)" })
    ).toBeInTheDocument();
  });

  it("지역 카드에 소속 조합 수를 붙인다", async () => {
    await renderIndex();

    const regionNav = within(await screen.findByRole("navigation", { name: "지역" }));
    expect(regionNav.getByText("산림조합 3곳")).toBeInTheDocument();
  });

  it("최신 시즌 집계가 없는 조합은 별도 목록으로 뺀다", async () => {
    await renderIndex();

    const unrecorded = await screen.findByRole("navigation", {
      name: "최신 시즌 집계 없는 조합",
    });
    expect(within(unrecorded).getByRole("link", { name: "경북 영천" })).toBeInTheDocument();

    const unionNav = within(
      screen.getByRole("navigation", { name: "산림조합 (최신 시즌 물량순)" })
    );
    expect(unionNav.queryByText("영천")).not.toBeInTheDocument();
  });

  it("조합을 최신 시즌 물량 내림차순으로 정렬한다", async () => {
    await renderIndex();

    const unionNav = within(
      await screen.findByRole("navigation", { name: "산림조합 (최신 시즌 물량순)" })
    );
    const names = unionNav.getAllByRole("link").map((link) => link.textContent);

    /** 울진 30,000kg > 봉화 12,000kg */
    expect(names[0]).toContain("울진");
    expect(names[1]).toContain("봉화");
  });

  it("최고 단가 조합을 상단 하이라이트로 건다", async () => {
    await renderIndex();

    expect(await screen.findByText("최신 시즌 최고 단가")).toBeInTheDocument();
    expect(screen.getByText("kg당 300,000원")).toBeInTheDocument();
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
