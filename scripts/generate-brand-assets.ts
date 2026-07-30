#!/usr/bin/env node
/*
  브랜드 래스터 자산 생성기.
  public/favicon.svg 를 기준으로 PNG 아이콘과 OG 이미지를 만든다.

  SVG 파비콘만으로는 부족한 곳이 있어 PNG가 필요하다.
  - iOS 홈 화면 추가(apple-touch-icon): SVG 미지원. 웹 푸시 전제 조건
  - PWA manifest 아이콘: 설치 가능 판정에 192/512 PNG 요구
  - OG 이미지: 카카오톡 등 다수 공유 미리보기가 SVG를 렌더하지 않음

  실행: npm run generate-brand-assets
  결과물은 커밋한다. (빌드마다 브라우저를 띄우지 않기 위함)
*/
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { chromium } from "playwright";

const PUBLIC_DIR = join(process.cwd(), "public");
const FAVICON_PATH = join(PUBLIC_DIR, "favicon.svg");

/** 브랜드 컬러 (src/theme.ts 라이트 팔레트와 일치시킨다) */
const BRAND = {
  primary: "#166534",
  accent: "#B45309",
  background: "#FAFAF9",
  foreground: "#1C1917",
  muted: "#57534E",
} as const;

/** 생성할 정사각 PNG 아이콘 (파일명, 한 변 길이) */
const ICON_SIZES: ReadonlyArray<[fileName: string, size: number]> = [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];

/** OG 이미지 규격 (페이스북·카카오·슬랙 공통 권장) */
const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * OG 이미지 HTML.
 * 검색·공유 미리보기에서 "무엇을 볼 수 있는 사이트인지"가 3초 안에 읽혀야 하므로
 * 로고 + 제품 한 줄 + 출처를 담는다.
 */
const buildOgHtml = (faviconSvg: string): string => {
  /**
   * 워터마크용 마크. 파비콘의 라운드 사각 배경을 제거하고 버섯 실루엣만 남긴다.
   * 배경판을 그대로 두면 잘린 덩어리로 보여 지저분하다.
   */
  const watermarkSvg = faviconSvg
    .replace(/<rect[^>]*\/>/, "")
    .replace(/fill="#FAFAF9"/g, `fill="${BRAND.primary}"`)
    .replace(/fill="#B45309"/g, `fill="${BRAND.primary}"`);

  return `
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;800&display=swap"
      rel="stylesheet"
    />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: ${OG_SIZE.width}px;
        height: ${OG_SIZE.height}px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 40px;
        padding: 88px 96px;
        background:
          radial-gradient(120% 140% at 88% 8%, #E7F0E7 0%, ${BRAND.background} 55%);
        font-family: "Noto Sans KR", sans-serif;
        color: ${BRAND.foreground};
        position: relative;
        overflow: hidden;
      }
      /* 우측 워터마크 마크 — 텍스트를 가리지 않고 여백을 채운다 */
      .watermark {
        position: absolute;
        right: 40px;
        bottom: -40px;
        width: 400px;
        opacity: 0.08;
      }
      .brand { display: flex; align-items: center; gap: 22px; }
      .brand svg { width: 84px; height: 84px; }
      .brand-name { font-size: 56px; font-weight: 800; letter-spacing: -0.02em; }
      .brand-name .accent { color: ${BRAND.primary}; }
      h1 {
        font-size: 76px;
        font-weight: 800;
        line-height: 1.22;
        letter-spacing: -0.035em;
      }
      h1 em { font-style: normal; color: ${BRAND.primary}; }
      .footer { display: flex; align-items: center; gap: 16px; font-size: 28px; color: ${BRAND.muted}; }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: ${BRAND.accent}; }
      .rule { height: 6px; width: 132px; border-radius: 3px; background: ${BRAND.primary}; }
    </style>
  </head>
  <body>
    <div class="watermark">${watermarkSvg}</div>
    <div class="brand">
      ${faviconSvg}
      <div class="brand-name"><span class="accent">오</span>송이</div>
    </div>
    <div class="rule"></div>
    <h1>송이버섯 <em>공판 시세</em>를<br />매일 한 화면에서</h1>
    <div class="footer">
      <span>2013년부터의 지역별 시세 · 추이 · 비교</span>
      <span class="dot"></span>
      <span>출처 산림조합중앙회</span>
    </div>
  </body>
</html>
`;
};

const main = async (): Promise<void> => {
  const faviconSvg = readFileSync(FAVICON_PATH, "utf-8");
  const browser = await chromium.launch();

  try {
    /** 정사각 아이콘: 파비콘 SVG를 크기별로 래스터화 */
    for (const [fileName, size] of ICON_SIZES) {
      const page = await browser.newPage({
        viewport: { width: size, height: size },
        deviceScaleFactor: 1,
      });
      await page.setContent(
        `<body style="margin:0">
           <div style="width:${size}px;height:${size}px">${faviconSvg}</div>
         </body>`
      );
      const buffer = await page.screenshot({ omitBackground: true });
      writeFileSync(join(PUBLIC_DIR, fileName), buffer);
      await page.close();
      console.log(`생성: public/${fileName} (${size}x${size})`);
    }

    /** OG 이미지 */
    const ogPage = await browser.newPage({
      viewport: OG_SIZE,
      deviceScaleFactor: 1,
    });
    await ogPage.setContent(buildOgHtml(faviconSvg), {
      waitUntil: "networkidle",
    });
    const ogBuffer = await ogPage.screenshot();
    writeFileSync(join(PUBLIC_DIR, "og-image.png"), ogBuffer);
    await ogPage.close();
    console.log(`생성: public/og-image.png (${OG_SIZE.width}x${OG_SIZE.height})`);
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error("[generate-brand-assets] 실패:", error);
  process.exit(1);
});
