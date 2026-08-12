/**
 * 프리렌더 본문 전용 스타일.
 *
 * 클라이언트 렌더가 시작되면 교체되는 화면이지만, 크롤러가 보는 유일한 화면이고
 * 사용자에게도 첫 페인트로 노출되므로 Modern Forest 토큰을 그대로 따른다.
 */
export const PRERENDER_STYLE = `
:root{--pr-bg:#FAFAF9;--pr-paper:#F7F6F4;--pr-border:#E7E5E4;--pr-fg:#1C1917;--pr-muted:#78716C;--pr-primary:#166534}
@media (prefers-color-scheme:dark){:root{--pr-bg:#171412;--pr-paper:#211E1A;--pr-border:#2C2520;--pr-fg:#FAF9F7;--pr-muted:#8C7E73;--pr-primary:#22C55E}}
body{margin:0;background:var(--pr-bg);color:var(--pr-fg);font-family:"Pretendard","Noto Sans KR",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.prerender{max-width:1152px;margin:0 auto;padding:24px 16px 48px}
.prerender h1{font-size:1.75rem;font-weight:700;letter-spacing:-0.01em;margin:0 0 4px}
.prerender h2{font-size:1rem;font-weight:700;margin:32px 0 12px}
.prerender p{margin:0 0 8px;line-height:1.75;color:var(--pr-muted);max-width:62ch;font-size:0.9375rem}
.scope-breadcrumb{font-size:0.8125rem;color:var(--pr-muted);margin-bottom:12px}
.scope-breadcrumb a{color:inherit;text-decoration:none}
.scope-breadcrumb a:hover{text-decoration:underline}
.scope-breadcrumb .sep{margin:0 6px;opacity:0.5}
.scope-subtitle{font-size:0.875rem!important;margin-bottom:16px!important}
.scope-kpis{border:1px solid var(--pr-border);border-radius:0.75rem;background:var(--pr-paper);margin:20px 0 0;overflow:hidden;max-width:360px}
.scope-kpis div{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:12px 16px}
.scope-kpis div+div{border-top:1px solid var(--pr-border)}
.scope-kpis dt{font-size:0.8125rem;color:var(--pr-muted);font-weight:500}
.scope-kpis dd{margin:0;font-size:1.125rem;font-weight:700;line-height:1.25;text-align:right;font-variant-numeric:tabular-nums}
.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.prerender table{width:100%;min-width:340px;border-collapse:collapse;border:1px solid var(--pr-border);border-radius:0.75rem;background:var(--pr-paper);overflow:hidden;font-size:0.875rem}
.prerender thead th{text-align:right;font-weight:600;color:var(--pr-muted);padding:10px 12px;border-bottom:1px solid var(--pr-border);font-size:0.8125rem}
.prerender thead th:first-child{text-align:left}
.prerender tbody th{text-align:left;font-weight:500;padding:10px 12px}
.prerender tbody td{text-align:right;padding:10px 12px;font-variant-numeric:tabular-nums}
.prerender tbody tr+tr th,.prerender tbody tr+tr td{border-top:1px solid var(--pr-border)}
.scope-links{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.scope-links li{border:1px solid var(--pr-border);border-radius:0.75rem;background:var(--pr-paper);padding:12px}
.scope-links a{display:block;color:var(--pr-fg);font-weight:600;font-size:0.875rem;text-decoration:none}
.scope-links a:hover{color:var(--pr-primary)}
.scope-links span{display:block;font-size:0.75rem;color:var(--pr-muted);margin-top:2px}
.scope-more{margin-top:4px}
.scope-more summary{cursor:pointer;list-style:none;font-size:0.8125rem;font-weight:600;color:var(--pr-muted);margin-bottom:8px}
.scope-more summary::-webkit-details-marker{display:none}
.scope-more summary::after{content:"▼";font-size:0.625rem;margin-left:6px;opacity:0.7}
.scope-more[open] summary::after{content:"▲"}
.scope-source{font-size:0.75rem!important;margin-top:32px!important}
.scope-source a{color:inherit}
@media (max-width:600px){.prerender h1{font-size:1.5rem}.prerender{padding:16px 12px 40px}.prerender table{font-size:0.8125rem}.prerender thead th,.prerender tbody th,.prerender tbody td{padding:8px 10px;white-space:nowrap}.scope-links{grid-template-columns:1fr}.scope-links li{display:flex;align-items:center;justify-content:space-between;gap:8px}.scope-links span{margin-top:0;text-align:right;white-space:nowrap}}
`.trim();
