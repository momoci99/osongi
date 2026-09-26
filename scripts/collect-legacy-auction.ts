#!/usr/bin/env node
/*
  산림조합 옛 송이 공판현황 게시판(2008~2012) 수집기 → data/legacy-auction/raw/

  게시판 목록을 전부 돌며 글 번호(seq)를 모으고, 각 글의 첨부파일(xls/pdf/tif 등)을 받는다.
  원본은 권리 문제로 git 에 올리지 않는다(.gitignore). 정제 결과만 추적한다.
  이미 받은 파일은 건너뛰므로 중단 후 다시 실행하면 이어서 받는다.

  실행: npm run collect-legacy-auction
*/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ORIGIN = "https://iforest.nfcf.or.kr";
const BOARD_QUERY = "a=user.board.BoardApp&board_id=GPB_SONGI&mc=CYB_FIF_DGS_SNI_02";
const LIST_PAGE_SIZE = 10;
/** 서버 부담을 줄이기 위한 요청 간격(ms) */
const REQUEST_INTERVAL_MS = 400;

const RAW_ROOT = join(process.cwd(), "data", "legacy-auction", "raw");
const FILES_DIR = join(RAW_ROOT, "files");
const MANIFEST_PATH = join(RAW_ROOT, "manifest.json");

/** 게시물 첨부파일 한 건 */
type LegacyAttachment = {
  /** 서버 경로 (/upload/...) */
  serverPath: string;
  /** 게시판에 표시된 원래 파일명 */
  originalName: string;
  /** 로컬 저장 파일명 (seq 접두어로 충돌 방지) */
  localName: string;
};

/** 게시물 한 건 */
type LegacyPost = {
  seq: number;
  title: string;
  registeredAt: string;
  body: string;
  attachments: LegacyAttachment[];
};

const decoder = new TextDecoder("euc-kr");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** EUC-KR 페이지를 받아 문자열로 */
const fetchPage = async (query: string): Promise<string> => {
  const response = await fetch(`${ORIGIN}/forest/user.tdf?${BOARD_QUERY}&${query}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${query}`);
  return decoder.decode(await response.arrayBuffer());
};

const stripTags = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

/** 목록 한 페이지의 글 번호들 */
const parseListSeqs = (html: string): number[] => {
  const seqs = [...html.matchAll(/c=2002&amp;[^"']*?seq=(\d+)/g)].map((m) => Number(m[1]));
  return [...new Set(seqs)];
};

/** 제목 등 th 라벨(alt) 옆 td 의 텍스트 */
const cellAfterLabel = (html: string, label: string): string => {
  const match = html.match(new RegExp(`alt="${label}"[^>]*/?>\\s*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`));
  return match ? stripTags(match[1]) : "";
};

/** 본문 영역 (spanBbsContent) */
const parseBody = (html: string): string => {
  const match = html.match(/id="spanBbsContent">([\s\S]*?)<\/span>\s*<script/);
  return match ? stripTags(match[1]) : "";
};

const parseAttachments = (html: string, seq: number): LegacyAttachment[] =>
  [...html.matchAll(/download\.jsp\?fp=([^&"]+)&amp;fn=([^"]+)"/g)].map((m) => {
    const originalName = decodeURIComponent(m[2]);
    return { serverPath: m[1], originalName, localName: `${seq}__${originalName}` };
  });

const parsePost = (html: string, seq: number): LegacyPost => ({
  seq,
  title: cellAfterLabel(html, "제목"),
  registeredAt: cellAfterLabel(html, "등록일시"),
  body: parseBody(html),
  attachments: parseAttachments(html, seq),
});

/** 목록 페이지를 끝까지 돌며 글 번호 수집 */
const collectAllSeqs = async (): Promise<number[]> => {
  const all = new Set<number>();
  for (let page = 1; ; page += 1) {
    const html = await fetchPage(`c=2001&cp=${page}&pg=1&npp=${LIST_PAGE_SIZE}`);
    const seqs = parseListSeqs(html).filter((seq) => !all.has(seq));
    if (seqs.length === 0) break;
    seqs.forEach((seq) => all.add(seq));
    console.log(`목록 ${page}쪽: ${seqs.length}건 (누계 ${all.size})`);
    await sleep(REQUEST_INTERVAL_MS);
  }
  return [...all].sort((a, b) => a - b);
};

const downloadAttachment = async (attachment: LegacyAttachment): Promise<void> => {
  const target = join(FILES_DIR, attachment.localName);
  if (existsSync(target)) return;
  const url = `${ORIGIN}/forest/mobile/download.jsp?fp=${attachment.serverPath}&fn=${encodeURIComponent(attachment.originalName)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${attachment.localName}`);
  writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  await sleep(REQUEST_INTERVAL_MS);
};

const loadManifest = (): Map<number, LegacyPost> => {
  if (!existsSync(MANIFEST_PATH)) return new Map();
  const posts = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as LegacyPost[];
  return new Map(posts.map((post) => [post.seq, post]));
};

const saveManifest = (posts: Map<number, LegacyPost>) => {
  const sorted = [...posts.values()].sort((a, b) => a.seq - b.seq);
  writeFileSync(MANIFEST_PATH, JSON.stringify(sorted, null, 2));
};

const main = async () => {
  mkdirSync(FILES_DIR, { recursive: true });
  const posts = loadManifest();
  const seqs = await collectAllSeqs();
  console.log(`전체 글 ${seqs.length}건`);

  const failures: string[] = [];
  for (const seq of seqs) {
    try {
      if (!posts.has(seq)) {
        posts.set(seq, parsePost(await fetchPage(`c=2002&seq=${seq}`), seq));
        saveManifest(posts);
        await sleep(REQUEST_INTERVAL_MS);
      }
      const post = posts.get(seq)!;
      for (const attachment of post.attachments) await downloadAttachment(attachment);
      console.log(`seq ${seq} ${post.title} — 첨부 ${post.attachments.length}`);
    } catch (error) {
      failures.push(`seq ${seq}: ${(error as Error).message}`);
      console.error(`❌ seq ${seq}`, error);
    }
  }

  console.log(`완료. 실패 ${failures.length}건`);
  failures.forEach((line) => console.log(`  ${line}`));
};

main();
