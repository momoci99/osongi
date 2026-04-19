import { test, expect } from "@playwright/test";
import { setupCompletedOnboarding, waitForAppReady } from "./helpers";
import { TEST_IDS } from "../../src/test-ids";

test.describe("데이터 분석", () => {
  test.beforeEach(async ({ page }) => {
    await setupCompletedOnboarding(page);
  });

  test("페이지 헤더와 필터 영역이 렌더링된다", async ({ page }) => {
    await page.goto("/data-analysis");
    await waitForAppReady(page);
    await expect(
      page.getByRole("heading", { name: "데이터 분석" }),
    ).toBeVisible();
    await expect(
      page.getByText("필터를 조합하여 송이버섯 공판 데이터를 다각도로 분석하세요."),
    ).toBeVisible();
    // 등급 셀렉터 레이블 존재 확인 (strict mode 피하기 위해 label role 사용)
    await expect(page.locator(`[data-testid="${TEST_IDS.GRADE_SELECT}"]`)).toBeVisible();
  });

  test("등급 셀렉터에서 항목을 선택 해제할 수 있다", async ({ page }) => {
    await page.goto("/data-analysis");
    await waitForAppReady(page);
    // 등급 Multiple Select 열기 (해당 FormControl의 combobox)
    const gradeSelect = page
      .locator(`[data-testid="${TEST_IDS.GRADE_SELECT}"]`)
      .locator('[role="combobox"]');
    await gradeSelect.waitFor();
    await gradeSelect.click();
    const option = page.getByRole("option", { name: "1등품" });
    await expect(option).toBeVisible();
    await option.click();
    await page.keyboard.press("Escape");
    // 1등품 칩이 사라짐
    await expect(
      page.locator('[role="button"]').filter({ hasText: /^1등품$/ }),
    ).toHaveCount(0);
  });

  test("비교 모드 토글을 활성화하면 비교 날짜 필드가 표시된다", async ({
    page,
  }) => {
    await page.goto("/data-analysis");
    await waitForAppReady(page);
    const comparisonToggle = page.locator(`[data-testid="${TEST_IDS.COMPARISON_TOGGLE}"]`);
    await comparisonToggle.waitFor();
    await expect(comparisonToggle).not.toBeChecked();
    await comparisonToggle.click();
    // label과 span 두 요소에 텍스트가 있으므로 first() 사용
    await expect(page.getByText("비교 시작일").first()).toBeVisible();
    await expect(page.getByText("비교 종료일").first()).toBeVisible();
  });
});
