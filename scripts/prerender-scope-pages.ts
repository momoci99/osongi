#!/usr/bin/env node
/*
  지역·조합 페이지 프리렌더 → dist/region/**\/index.html

  CSR SPA는 초기 HTML이 비어 있어 크롤러가 JS 실행에 성공해야만 색인된다.
  빌드 타임에 이미 확정된 지표를 정적 HTML로 심어 두면
  JS 실행 여부와 무관하게 본문·메타·구조화 데이터가 색인된다.
  클라이언트에서는 createRoot 가 #root 내용을 교체하므로 하이드레이션 불일치가 없다.

  실행: npm run prerender (빌드 후 자동 실행)
*/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  PAGE_META,
  regionPageMeta,
  toCanonicalUrl,
  unionPageMeta,
  type PageMeta,
} from "../src/const/Seo";
import { encodeRoute, regionPath, unionPath } from "../src/const/Regions";
import { DATA_SOURCE, SITE_URL } from "../src/const/Site";
import { GradeKeyToKorean } from "../src/const/Common";
import { KILOGRAMS_PER_TON } from "../src/const/Units";
import { buildScopeNarrative, toScopeMetaFacts } from "../src/utils/regionNarrative";
import type { RegionManifest, ScopeStats } from "../src/types/region";
import { PRERENDER_STYLE } from "./prerenderStyle";

const DIST_DIR = join(process.cwd(), "dist");
const TEMPLATE_PATH = join(DIST_DIR, "index.html");
const MANIFEST_PATH = join(
  process.cwd(),
  "public",
  "auction-stats",
  "region-manifest.json"
);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const number = (value: number): string =>
  Math.round(value).toLocaleString("ko-KR");

const gradeLabel = (gradeKey: string): string =>
  GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey;

/** 기존 메타 태그를 지우고 페이지별 값으로 다시 심는다 */
const applyMeta = (template: string, meta: PageMeta, jsonLd: string): string => {
  const canonical = toCanonicalUrl(encodeRoute(meta.path));
  const stripped = template
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta[^>]*name="description"[^>]*>/i, "")
    .replace(/<link[^>]*rel="canonical"[^>]*>/i, "")
    .replace(/<meta[^>]*property="og:title"[^>]*>/i, "")
    .replace(/<meta[^>]*property="og:description"[^>]*>/i, "")
    .replace(/<meta[^>]*property="og:url"[^>]*>/i, "")
    .replace(/<meta[^>]*name="twitter:title"[^>]*>/i, "")
    .replace(/<meta[^>]*name="twitter:description"[^>]*>/i, "");

  const head = `
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <script type="application/ld+json">
${jsonLd}
    </script>
    <style>${PRERENDER_STYLE}</style>
  </head>`;

  return stripped.replace("</head>", head);
};

/** #root 안에 정적 본문을 넣는다. 클라이언트 렌더가 시작되면 교체된다 */
const applyBody = (template: string, body: string): string =>
  template.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

type BreadcrumbItem = { name: string; path: string };

const buildJsonLd = (meta: PageMeta, breadcrumbs: BreadcrumbItem[]): string => {
  const graph = [
    {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: toCanonicalUrl(encodeRoute(crumb.path)),
      })),
    },
    {
      "@type": "WebPage",
      "@id": `${toCanonicalUrl(encodeRoute(meta.path))}#webpage`,
      url: toCanonicalUrl(encodeRoute(meta.path)),
      name: meta.title,
      description: meta.description,
      inLanguage: "ko-KR",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#dataset` },
    },
  ];

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
};

const gradeTable = (
  stats: Pick<ScopeStats, "grades">,
  caption: string
): string => {
  if (stats.grades.length === 0) return "";
  const rows = stats.grades
    .map(
      (grade) => `<tr>
        <th scope="row">${escapeHtml(gradeLabel(grade.gradeKey))}</th>
        <td>${number(grade.avgUnitPriceWon)}</td>
        <td>${number(grade.quantityKg)}</td>
      </tr>`
    )
    .join("");

  return `<h2>${escapeHtml(caption)}</h2>
    <table>
      <thead><tr><th scope="col">등급</th><th scope="col">평균 단가(원/kg)</th><th scope="col">공판량(kg)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
};

const yearlyTable = (stats: ScopeStats): string => {
  if (stats.yearly.length === 0) return "";
  const rows = [...stats.yearly]
    .reverse()
    .map(
      (entry) => `<tr>
        <th scope="row">${entry.year}</th>
        <td>${number(entry.avgPricePerKg)}</td>
        <td>${(entry.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1)}</td>
      </tr>`
    )
    .join("");

  return `<h2>연도별 공판 추이</h2>
    <table>
      <thead><tr><th scope="col">연도</th><th scope="col">평균 단가(원/kg)</th><th scope="col">공판량(톤)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
};

const linkList = (
  title: string,
  items: { label: string; path: string; note: string }[]
): string => {
  if (items.length === 0) return "";
  const links = items
    .map(
      (item) =>
        `<li><a href="${encodeRoute(item.path)}">${escapeHtml(item.label)}</a><span>${escapeHtml(item.note)}</span></li>`
    )
    .join("");
  return `<h2>${escapeHtml(title)}</h2><ul class="scope-links">${links}</ul>`;
};

const kpiList = (stats: ScopeStats): string => {
  const entries: { term: string; value: string }[] = [
    {
      term: `${stats.latestSeasonYear} 시즌 평균 단가`,
      value: stats.season ? `${number(stats.season.avgPricePerKg)}원/kg` : "집계 없음",
    },
    {
      term: "시즌 공판량",
      value: stats.season
        ? `${(stats.season.totalQuantityKg / KILOGRAMS_PER_TON).toFixed(1)}톤`
        : "집계 없음",
    },
    {
      term: "시즌 최고 단가",
      value: stats.peak
        ? `${number(stats.peak.priceWon)}원/kg (${stats.peak.date}, ${gradeLabel(stats.peak.gradeKey)})`
        : "집계 없음",
    },
  ];

  if (stats.quantityRank) {
    entries.push({
      term: "전국 조합 물량 순위",
      value: `${stats.quantityRank.rank}위 / ${stats.quantityRank.of}곳`,
    });
  }

  return `<dl class="scope-kpis">${entries
    .map(
      (entry) =>
        `<div><dt>${escapeHtml(entry.term)}</dt><dd>${escapeHtml(entry.value)}</dd></div>`
    )
    .join("")}</dl>`;
};

const breadcrumbNav = (breadcrumbs: BreadcrumbItem[]): string => {
  const items = breadcrumbs
    .map((crumb, index) =>
      index === breadcrumbs.length - 1
        ? `<span aria-current="page">${escapeHtml(crumb.name)}</span>`
        : `<a href="${encodeRoute(crumb.path)}">${escapeHtml(crumb.name)}</a>`
    )
    .join('<span class="sep">›</span>');
  return `<nav class="scope-breadcrumb" aria-label="현재 위치">${items}</nav>`;
};

const sourceNote = (latestDate: string): string =>
  `<p class="scope-source">출처: <a href="${DATA_SOURCE.url}" rel="noopener noreferrer">${escapeHtml(DATA_SOURCE.name)}</a> · 최신 공판 데이터 ${escapeHtml(latestDate)} 기준. 표시 가격은 공판 실적을 가공한 참고 정보입니다.</p>`;

type PagePlan = {
  meta: PageMeta;
  breadcrumbs: BreadcrumbItem[];
  body: string;
};

const HOME_CRUMB: BreadcrumbItem = { name: "송이 시세", path: "/" };
const REGION_CRUMB: BreadcrumbItem = { name: "지역별 시세", path: "/region" };

const planScopePage = (
  manifest: RegionManifest,
  stats: ScopeStats,
  options: { isUnion: boolean }
): PagePlan => {
  const path = options.isUnion
    ? unionPath(stats.region, stats.name)
    : regionPath(stats.region);
  const facts = toScopeMetaFacts(stats);
  const meta = options.isUnion
    ? unionPageMeta(stats.region, stats.name, path, facts)
    : regionPageMeta(stats.region, path, facts);

  const breadcrumbs: BreadcrumbItem[] = options.isUnion
    ? [
        HOME_CRUMB,
        REGION_CRUMB,
        { name: stats.region, path: regionPath(stats.region) },
        { name: stats.name, path },
      ]
    : [HOME_CRUMB, REGION_CRUMB, { name: stats.region, path }];

  const siblings = (manifest.regions[stats.region]?.unions ?? [])
    .filter((name) => name !== stats.name)
    .map((name) => {
      const unionStats = manifest.unions[name];
      return {
        label: name,
        path: unionPath(stats.region, name),
        note: unionStats?.season
          ? `평균 ${number(unionStats.season.avgPricePerKg)}원/kg`
          : "최신 시즌 집계 없음",
      };
    });

  const heading = options.isUnion
    ? `${stats.name} 송이 시세`
    : `${stats.region} 송이 시세`;
  const subtitle = options.isUnion
    ? `${stats.region} ${stats.name}산림조합 공판 현황`
    : `${stats.region} 지역 산림조합 공판 현황`;

  const body = `<main class="prerender">
    ${breadcrumbNav(breadcrumbs)}
    <h1>${escapeHtml(heading)}</h1>
    <p class="scope-subtitle">${escapeHtml(subtitle)}</p>
    ${buildScopeNarrative(stats)
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("")}
    ${kpiList(stats)}
    ${gradeTable(stats, `${stats.latestSeasonYear} 시즌 등급별 시세`)}
    ${stats.latestDaily && stats.latestDaily.grades.length > 0 ? gradeTable(stats.latestDaily, `최신 공판일 시세 (${stats.latestDaily.date})`) : ""}
    ${yearlyTable(stats)}
    ${linkList(
      options.isUnion ? `${stats.region}의 다른 조합 시세` : `${stats.region} 조합별 시세`,
      siblings
    )}
    ${sourceNote(manifest.latestDate)}
  </main>`;

  return { meta, breadcrumbs, body };
};

const planIndexPage = (manifest: RegionManifest): PagePlan => {
  const regionItems = Object.values(manifest.regions).map((region) => ({
    label: `${region.name} (조합 ${region.unions.length}곳)`,
    path: regionPath(region.name),
    note: region.season ? `평균 ${number(region.season.avgPricePerKg)}원/kg` : "집계 없음",
  }));

  const unionItems = Object.values(manifest.unions)
    .sort((a, b) => (b.season?.totalQuantityKg ?? 0) - (a.season?.totalQuantityKg ?? 0))
    .map((union) => ({
      label: `${union.region} ${union.name}`,
      path: unionPath(union.region, union.name),
      note: union.season ? `평균 ${number(union.season.avgPricePerKg)}원/kg` : "집계 없음",
    }));

  const body = `<main class="prerender">
    ${breadcrumbNav([HOME_CRUMB, REGION_CRUMB])}
    <h1>지역별 송이 시세</h1>
    <p>강원·경북·경남 ${Object.keys(manifest.regions).length}개 지역과 ${unionItems.length}개 산림조합의 송이버섯 공판 시세를 지역별로 제공합니다. ${manifest.latestSeasonYear} 시즌 등급별 평균 단가와 공판량, 연도별 추이를 각 페이지에서 확인할 수 있습니다.</p>
    ${linkList("지역", regionItems)}
    ${linkList("산림조합 (최신 시즌 물량순)", unionItems)}
    ${sourceNote(manifest.latestDate)}
  </main>`;

  return {
    meta: PAGE_META.regionIndex,
    breadcrumbs: [HOME_CRUMB, REGION_CRUMB],
    body,
  };
};

if (!existsSync(TEMPLATE_PATH)) {
  throw new Error("dist/index.html 이 없다. vite build 후에 실행해야 한다.");
}
if (!existsSync(MANIFEST_PATH)) {
  throw new Error("region-manifest.json 이 없다. npm run generate-region-stats 를 먼저 실행한다.");
}

const template = readFileSync(TEMPLATE_PATH, "utf-8");
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as RegionManifest;

const plans: PagePlan[] = [
  planIndexPage(manifest),
  ...Object.values(manifest.regions).map((region) =>
    planScopePage(manifest, region, { isUnion: false })
  ),
  ...Object.values(manifest.unions).map((union) =>
    planScopePage(manifest, union, { isUnion: true })
  ),
];

for (const plan of plans) {
  const html = applyBody(applyMeta(template, plan.meta, buildJsonLd(plan.meta, plan.breadcrumbs)), plan.body);
  const outputDir = join(DIST_DIR, ...plan.meta.path.split("/").filter(Boolean));
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "index.html"), html, "utf-8");
}

console.log(`프리렌더: ${plans.length}개 페이지 (dist${plans[0].meta.path} 외)`);
