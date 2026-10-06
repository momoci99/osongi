import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../theme";
import { SITE_URL } from "../../const/Site";
import { WILDFIRE_PUBLIC_PATH } from "../../const/Wildfire";
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

/** 산불 파일 요청에는 빈 목록, 그 밖에는 주어진 매니페스트로 응답한다 */
const mockManifestFetch = (body: unknown) =>
  vi.fn((url: string) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => (url === WILDFIRE_PUBLIC_PATH ? { unions: [] } : body),
    })
  );

beforeEach(() => {
  document.head.innerHTML = "";
  vi.stubGlobal(
    "fetch",
    mockManifestFetch(manifest)
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
    /** 값과 단위를 분리해 렌더하므로 숫자만으로 찾는다 */
    expect(screen.getByText("300,000")).toBeInTheDocument();
    expect(screen.getByText("820,000")).toBeInTheDocument();
  });

  it("순위 모집단을 캡션에 밝힌다", async () => {
    await renderAt("/region/경북/봉화");

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(screen.getByText("2025 시즌 집계 21개 조합 중")).toBeInTheDocument();
  });

  it("다른 조합 시세에 현재 조합 대비 차이를 붙인다", async () => {
    await renderAt("/region/경북/봉화");

    /** 울진 270,000원은 봉화 300,000원 대비 10% 낮다 */
    expect(
      await screen.findByRole("navigation", { name: "경북의 다른 조합 시세" })
    ).toBeInTheDocument();
    expect(screen.getByText("봉화 대비 단가 차이", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/10%/)).toBeInTheDocument();
  });

  it("비교 기준 단가가 없으면 캡션에서 대비 문구를 뺀다", async () => {
    const offSeason = makeRegionManifest();
    offSeason.unions["봉화"] = { ...offSeason.unions["봉화"], season: null };
    vi.stubGlobal(
      "fetch",
      mockManifestFetch(offSeason)
    );
    await renderAt("/region/경북/봉화");

    expect(
      await screen.findByRole("navigation", { name: "경북의 다른 조합 시세" })
    ).toBeInTheDocument();
    expect(screen.queryByText("대비 단가 차이", { exact: false })).not.toBeInTheDocument();
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
    expect(screen.getByText("곳")).toBeInTheDocument();
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

  describe("구역 순서", () => {
    /** 앞 요소가 뒤 요소보다 문서상 먼저 나오는지 */
    const isBefore = (a: HTMLElement, b: HTMLElement) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    const findSections = async () => ({
      daily: await screen.findByRole("heading", { name: /최신 공판일 시세/ }),
      season: screen.getByRole("heading", { name: "2025 시즌 등급별 시세" }),
      chart: screen.getByRole("img", { name: /연도별 공판량과 평균 단가 추이 차트/ }),
    });

    afterEach(() => {
      vi.doUnmock("../../utils/isInSeason");
    });

    it("시즌 중에는 최신 공판일 시세가 맨 위, 연도별 차트가 맨 아래에 온다", async () => {
      vi.doMock("../../utils/isInSeason", () => ({ default: () => true }));
      await renderAt("/region/경북/봉화");
      const { daily, season, chart } = await findSections();
      const rank = screen.getByRole("heading", { name: "경북의 다른 조합 시세" });

      expect(isBefore(daily, season)).toBe(true);
      expect(isBefore(rank, chart)).toBe(true);
    });

    it("시즌 외에는 시즌 등급표가 먼저 온다", async () => {
      vi.doMock("../../utils/isInSeason", () => ({ default: () => false }));
      await renderAt("/region/경북/봉화");
      const { daily, season } = await findSections();

      expect(isBefore(season, daily)).toBe(true);
    });
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
