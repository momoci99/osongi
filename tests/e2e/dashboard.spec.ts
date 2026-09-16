import { test, expect } from "@playwright/test";
import { setupCompletedOnboarding, waitForDataReady } from "./helpers";
import { TEST_IDS } from "../../src/test-ids";

test.describe("대시보드", () => {
  test.beforeEach(async ({ page }) => {
    await setupCompletedOnboarding(page);
  });

  /** 시즌 판별은 최신 데이터 날짜에 달려 있어 ?season 쿼리로 고정한다 */
  test("시즌 외에는 페이지 타이틀과 시즌 외 안내가 렌더링된다", async ({
    page,
  }) => {
    await page.goto("/?season=off");
    await waitForDataReady(page);
    await expect(page.getByText("송이버섯 시세 대시보드")).toBeVisible();
    await expect(page.getByText("현재 시즌 외 기간입니다")).toBeVisible();
  });

  test("시즌 중에는 기준일 헤더가 렌더링되고 시즌 외 안내는 없다", async ({
    page,
  }) => {
    await page.goto("/?season=on");
    await waitForDataReady(page);
    await expect(page.getByText(/\d{4}-\d{2}-\d{2} 기준/)).toBeVisible();
    await expect(page.getByText("현재 시즌 외 기간입니다")).toHaveCount(0);
  });

  test("지역 셀렉터에 설정된 지역이 표시된다", async ({ page }) => {
    await page.goto("/");
    await waitForDataReady(page);
    await expect(page.getByText("내 지역")).toBeVisible();
    // MUI Select의 선택된 값이 텍스트로 표시됨
    await expect(
      page.locator(`[data-testid="${TEST_IDS.REGION_SELECT}"]`),
    ).toBeVisible();
  });
});
