import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./helpers";

test.describe("온보딩", () => {
  test("처음 방문 시 지역 선택 다이얼로그가 표시된다", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await expect(
      page.getByText("어느 지역의 시세를 보시겠습니까?"),
    ).toBeVisible();
  });

  test("지역 선택 후 시작하기로 온보딩을 완료할 수 있다", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await page.getByRole("button", { name: "강원" }).click();
    await page.getByRole("button", { name: "시작하기" }).click();
    await expect(
      page.getByText("어느 지역의 시세를 보시겠습니까?"),
    ).not.toBeVisible();
  });

  test("나중에 설정으로 온보딩을 건너뛸 수 있다", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await page.getByRole("button", { name: "나중에 설정" }).click();
    await expect(
      page.getByText("어느 지역의 시세를 보시겠습니까?"),
    ).not.toBeVisible();
  });
});
