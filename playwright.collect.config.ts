import { defineConfig, devices } from "@playwright/test";

/**
 * 공판 데이터 수집 전용 Playwright 설정
 * - 기본 설정(playwright.config.ts)은 e2e 전용으로 수집 스펙을 제외하므로 분리
 * - 외부 사이트만 조회하므로 dev 서버(webServer) 불필요
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/generateRawData.spec.ts",
  /** 수집 일수에 따라 오래 걸릴 수 있어 넉넉히 설정 (10분) */
  timeout: 10 * 60 * 1000,
  workers: 1,
  reporter: "list",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
