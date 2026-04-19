import { test, expect } from "@playwright/test";
import { setupCompletedOnboarding, waitForAppReady } from "./helpers";
import { TEST_IDS } from "../../src/test-ids";

test.describe("대시보드", () => {
  test.beforeEach(async ({ page }) => {
    await setupCompletedOnboarding(page);
  });

  test("페이지 타이틀과 시즌 외 안내가 렌더링된다", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await expect(page.getByText("송이버섯 시세 대시보드")).toBeVisible();
    await expect(page.getByText("현재 시즌 외 기간입니다")).toBeVisible();
  });

  test("지역 셀렉터에 설정된 지역이 표시된다", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await expect(page.getByText("내 지역")).toBeVisible();
    // MUI Select의 선택된 값이 텍스트로 표시됨
    await expect(
      page.locator(`[data-testid="${TEST_IDS.REGION_SELECT}"]`),
    ).toBeVisible();
  });
});
