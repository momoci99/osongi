import { defineConfig } from "vitest/config";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { compression } from "vite-plugin-compression2";
import { playwright } from "@vitest/browser-playwright";

// https://vite.dev/config/
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),

    // 압축 설정 - 필요한 파일들만 선택적으로 압축
    compression({
      include: [
        /\.(js|css|html|svg|txt|xml)$/, // 기본 웹 에셋들
        /complete-dataset\.json$/, // complete-dataset.json만 압축
        /manifest\.json$/, // manifest 파일들 압축
      ],
      threshold: 1024,
      deleteOriginalAssets: false,
    }),
  ],
  // 빌드 최적화
  build: {
    rollupOptions: {
      output: {
        // 청크 분할로 캐싱 효율성 증대
        manualChunks: (id) => {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) return "vendor";
          if (id.includes("node_modules/react-router")) return "router";
          if (id.includes("node_modules/@mui")) return "ui";
          if (id.includes("node_modules/d3")) return "charts";
          if (id.includes("node_modules/date-fns")) return "date";
        },
      },
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          globals: true,
          setupFiles: ["src/test-setup.ts"],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
