import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../theme";
import { SITE_URL } from "../../const/Site";
import { makeRegionManifest } from "../../test-fixtures/region";

/**
 * 매니페스트 캐시가 모듈 스코프라 테스트마다 페이지를 새로 불러온다.
 * 그래야 로딩·실패 경로를 각각 독립적으로 검증할 수 있다.
 */
const renderAt = async (path: string) => {
  vi.resetModules();
  const RegionDetail = (await import("../RegionDetail")).default;

  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/region" element={<h1>지역 허브</h1>} />
          <Route path="/region/:region" element={<RegionDetail />} />
          <Route path="/region/:region/:union" element={<RegionDetail />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

const manifest = makeRegionManifest();

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

describe("RegionDetail", () => {
  it("조합 페이지에 조합명 H1과 지표를 렌더한다", async () => {
    await renderAt("/region/경북/봉화");

    expect(
      await screen.findByRole("heading", { level: 1, name: "봉화 송이 시세" })
    ).toBeInTheDocument();
    expect(screen.getByText("300,000원")).toBeInTheDocument();
    expect(screen.getByText("820,000원")).toBeInTheDocument();
  });

  it("조합 페이지 제목·canonical을 조합 기준으로 갱신한다", async () => {
    await renderAt("/region/경북/봉화");

    await waitFor(() =>
      expect(document.title).toBe("봉화 송이 시세 (경북 봉화산림조합) | 오송이")
    );
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")
    ).toBe(`${SITE_URL}/region/경북/봉화`);
  });

  it("지역 페이지는 소속 조합 수와 조합 링크를 보여준다", async () => {
    await renderAt("/region/경북");

    expect(
      await screen.findByRole("heading", { level: 1, name: "경북 송이 시세" })
    ).toBeInTheDocument();
    expect(screen.getByText("2곳")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /울진/ })).toBeInTheDocument();
  });

  it("연도별 추이 차트를 접근 가능한 이름과 함께 렌더한다", async () => {
    await renderAt("/region/경북/봉화");

    expect(
      await screen.findByRole("img", {
        name: "봉화 연도별 공판량과 평균 단가 추이 차트",
      })
    ).toBeInTheDocument();
  });

  it("없는 지역이면 허브로 돌려보낸다", async () => {
    await renderAt("/region/서울");

    expect(
      await screen.findByRole("heading", { level: 1, name: "지역 허브" })
    ).toBeInTheDocument();
  });

  it("지역과 짝이 맞지 않는 조합이면 허브로 돌려보낸다", async () => {
    await renderAt("/region/경북/양양");

    expect(
      await screen.findByRole("heading", { level: 1, name: "지역 허브" })
    ).toBeInTheDocument();
  });

  it("매니페스트 로드에 실패하면 오류 문구를 보여준다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );

    await renderAt("/region/경북/봉화");

    expect(
      await screen.findByText(
        "시세 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      )
    ).toBeInTheDocument();
  });
});
