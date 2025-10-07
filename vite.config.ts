/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { compression } from "vite-plugin-compression2";

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
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router"],
          ui: ["@mui/material", "@mui/icons-material"],
          charts: ["d3"],
          date: ["date-fns"],
        },
      },
    },
  },
  test: {
    projects: [
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
            provider: "playwright",
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
