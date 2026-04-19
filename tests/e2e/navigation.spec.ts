import { test, expect } from "@playwright/test";
import { setupCompletedOnboarding, waitForAppReady } from "./helpers";

test.describe("페이지 내비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await setupCompletedOnboarding(page);
  });

  test("대시보드에서 데이터 분석 페이지로 이동할 수 있다", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await page.getByRole("button", { name: "데이터 분석" }).click();
    await expect(page).toHaveURL("/data-analysis");
  });

  test("데이터 분석에서 대시보드로 이동할 수 있다", async ({ page }) => {
    await page.goto("/data-analysis");
    await waitForAppReady(page);
    await page.getByRole("button", { name: "대시보드" }).click();
    await expect(page).toHaveURL("/");
  });
});
