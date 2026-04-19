import type { Page } from "@playwright/test";
import { TEST_IDS } from "../../src/test-ids";

/** 온보딩을 완료한 상태로 localStorage를 설정 */
export const setupCompletedOnboarding = async (
  page: Page,
  region: "강원" | "경북" | "경남" = "강원",
) => {
  await page.addInitScript(
    ({ region }) => {
      const settings = {
        state: {
          themeMode: "dark",
          myRegion: region,
          myUnion: null,
          hasCompletedOnboarding: true,
          displayMode: "default",
        },
        version: 0,
      };
      localStorage.setItem("osongi-settings", JSON.stringify(settings));
    },
    { region },
  );
};

/**
 * DataInitializer가 초기화를 완료할 때까지 대기.
 * getByRole("banner")은 Dialog 오픈 시 aria-modal로 접근성 트리에서 숨겨지므로
 * CSS 셀렉터로 DOM에서 직접 AppBar를 찾는다.
 */
export const waitForAppReady = async (page: Page) => {
  await page.locator(`[data-testid="${TEST_IDS.APP_BAR}"]`).waitFor({ timeout: 30000 });
};
