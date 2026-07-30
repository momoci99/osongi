#!/usr/bin/env node
/*
  sitemap.xml 생성기.
  lastmod 를 실제 최신 공판 데이터 날짜로 채운다.

  수동 관리 시 lastmod 가 없거나 낡은 값으로 남는데,
  시즌 중 매일 갱신되는 사이트에서는 이것이 재크롤링 빈도에 직접 영향을 준다.

  실행: npm run generate-sitemap (빌드 전 자동 실행)
*/
import { existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const SITE_URL = "https://osongi.vercel.app";
const DATA_ROOT = join(process.cwd(), "public", "auction-data");
const OUTPUT_PATH = join(process.cwd(), "public", "sitemap.xml");

type SitemapEntry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
};

const ENTRIES: readonly SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/data-analysis", changefreq: "weekly", priority: "0.8" },
];

/** 디렉터리명 중 숫자인 것만 내림차순으로 반환 */
const numericDirsDesc = (dir: string): number[] =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map((entry) => Number(entry.name))
    .sort((a, b) => b - a);

/**
 * public/auction-data/YYYY/MM/DD.json 구조에서 가장 최신 날짜를 찾는다.
 * 데이터가 없으면 오늘 날짜로 대체한다.
 */
const findLatestDataDate = (): string => {
  const today = new Date().toISOString().slice(0, 10);
  if (!existsSync(DATA_ROOT)) return today;

  for (const year of numericDirsDesc(DATA_ROOT)) {
    const yearDir = join(DATA_ROOT, String(year));
    for (const month of numericDirsDesc(yearDir)) {
      const monthDir = join(yearDir, String(month));
      const days = readdirSync(monthDir)
        .filter((file) => /^\d+\.json$/.test(file))
        .map((file) => Number(file.replace(".json", "")))
        .sort((a, b) => b - a);

      if (days.length > 0) {
        const pad = (value: number) => String(value).padStart(2, "0");
        return `${year}-${pad(month)}-${pad(days[0])}`;
      }
    }
  }

  return today;
};

const buildSitemap = (lastmod: string): string => {
  const urls = ENTRIES.map(
    ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
};

const lastmod = findLatestDataDate();
writeFileSync(OUTPUT_PATH, buildSitemap(lastmod), "utf-8");
console.log(`생성: public/sitemap.xml (${ENTRIES.length}개 URL, lastmod ${lastmod})`);
