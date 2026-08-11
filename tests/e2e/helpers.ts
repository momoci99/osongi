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

/** 초기 데이터 다운로드·IndexedDB 저장은 첫 방문에서 수 초가 걸린다 */
const DATA_READY_TIMEOUT_MS = 60000;

/**
 * 앱 셸(AppBar)이 붙을 때까지 대기.
 * getByRole("banner")은 Dialog 오픈 시 aria-modal로 접근성 트리에서 숨겨지므로
 * CSS 셀렉터로 DOM에서 직접 AppBar를 찾는다.
 */
export const waitForAppReady = async (page: Page) => {
  await page.locator(`[data-testid="${TEST_IDS.APP_BAR}"]`).waitFor({ timeout: 30000 });
};

/**
 * DataInitializer가 초기화를 끝내고 실제 화면이 나올 때까지 대기.
 *
 * AppBar는 로딩 화면 위에도 떠 있어 AppBar만 기다리면 "데이터 준비 중" 상태에서
 * 본문을 단언하게 된다. 워커를 병렬로 띄우면 매 워커가 데이터를 새로 받으므로
 * 기본 5초 안에 끝나지 않아 페이지·필터 단언이 함께 무너졌다.
 *
 * 로딩 화면이 사라지기를 기다리는 방식은 쓰지 않는다. 초기 렌더에는 로딩 화면도
 * 아직 없어("초기화 대기 중") 조건이 곧바로 참이 되기 때문이다. 완료 표식이 붙는
 * 쪽을 기다려야 한다.
 */
export const waitForDataReady = async (page: Page) => {
  await waitForAppReady(page);
  await page
    .locator(`[data-testid="${TEST_IDS.APP_CONTENT}"]`)
    .waitFor({ state: "attached", timeout: DATA_READY_TIMEOUT_MS });
};
