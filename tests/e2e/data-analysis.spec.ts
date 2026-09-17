import { test, expect } from "@playwright/test";
import { setupCompletedOnboarding, waitForDataReady } from "./helpers";

/** 모든 조회 조건을 명시한 순위 뷰 링크 */
const RANK_URL =
  "/data-analysis?view=rank&years=2025&align=calendar&regions=&unions=&grades=grade1&metric=unitPrice&by=union&unit=season&compare=none&common=0";

test.describe("데이터 분석", () => {
  test.beforeEach(async ({ page }) => {
    await setupCompletedOnboarding(page);
  });

  test("헤더·질문 템플릿·조회 기간·요약이 렌더링된다", async ({ page }) => {
    await page.goto("/data-analysis?season=off");
    await waitForDataReady(page);

    await expect(page.getByRole("heading", { name: "데이터 분석", level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "질문 템플릿" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "조회 기간" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "요약" })).toBeVisible();
    /** 비시즌 기본 템플릿은 전 시즌 히트맵 */
    await expect(page.getByRole("button", { name: /전 시즌 한눈에/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("img", { name: /히트맵/ })).toBeVisible();
  });

  test("템플릿을 누르면 조건이 URL에 기록되고 해당 뷰가 그려진다", async ({ page }) => {
    await page.goto("/data-analysis");
    await waitForDataReady(page);

    await page.getByRole("button", { name: /시즌 요약/ }).click();

    await expect(page).toHaveURL(/view=table/);
    await expect(page.getByRole("columnheader", { name: "피크일" })).toBeVisible();
  });

  test("링크로 연 조건이 그대로 복원되고 뷰 탭으로 전환할 수 있다", async ({ page }) => {
    await page.goto(RANK_URL);
    await waitForDataReady(page);

    await expect(page.getByRole("tab", { name: "순위" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("img", { name: /조합별 단가 순위/ })).toBeVisible();

    await page.getByRole("tab", { name: "연도 겹침" }).click();

    await expect(page).toHaveURL(/view=overlay/);
    await expect(page.getByRole("img", { name: /선 차트/ })).toBeVisible();
  });

  test("집계 결과를 CSV로 내보낼 수 있다", async ({ page }) => {
    await page.goto(RANK_URL);
    await waitForDataReady(page);

    await page.getByRole("button", { name: "내보내기" }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: /집계 결과 CSV/ }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("osongi_rank_2025.csv");
  });
});
