import { SITE_URL } from "./Site";

/** 라우트별 검색·공유 메타 정보 */
export type PageMeta = {
  /** <title>. 브랜드명까지 포함한 완성형 문자열 */
  title: string;
  /** meta[name=description]. 검색 결과 스니펫으로 노출된다 */
  description: string;
  /** canonical 경로. 반드시 슬래시로 시작한다 */
  path: string;
};

/**
 * 검색어는 "송이 시세", "송이 가격", "송이 공판" 형태로 들어온다.
 * 스니펫 첫 문장에서 그 의도가 바로 충족돼야 클릭률이 유지된다.
 */
export const PAGE_META = {
  dashboard: {
    title: "오송이 | 송이버섯 공판 시세 대시보드",
    description:
      "오늘의 송이버섯 공판 시세를 지역·조합·등급별로 확인하세요. 산림조합중앙회 공판 현황을 시즌 중 약 1시간 주기로 갱신해 등급별 단가와 거래량, 전일 대비 변동을 한 화면에 제공합니다.",
    path: "/",
  },
  dataAnalysis: {
    title: "송이 시세 데이터 분석 | 오송이",
    description:
      "2013년부터의 송이버섯 공판 데이터를 기간·지역·조합·등급으로 필터링해 분석합니다. 가중 평균 단가, 등급 분포, 지역 비교, 전년 대비 추이를 확인할 수 있습니다.",
    path: "/data-analysis",
  },
  regionIndex: {
    title: "지역별 송이버섯 공판 시세 | 오송이",
    description:
      "강원·경북·경남 지역과 21개 산림조합의 송이버섯 공판 시세를 한곳에서 확인하세요. 조합별 평균 단가와 공판량, 연도별 추이를 지역 페이지에서 제공합니다.",
    path: "/region",
  },
} as const satisfies Record<string, PageMeta>;

/** 경로를 canonical 절대 URL로 변환 */
export const toCanonicalUrl = (path: string): string => `${SITE_URL}${path}`;

/** 지역·조합 페이지 메타 생성에 쓰이는 최소 지표 */
export type ScopeMetaFacts = {
  seasonYear: number;
  avgPricePerKg: number | null;
  peakPriceWon: number | null;
  totalQuantityKg: number | null;
  firstYear: number | null;
};

const won = (value: number): string => `${Math.round(value).toLocaleString("ko-KR")}원`;

/**
 * 지표를 넣은 한 문장을 만든다.
 * 스니펫에 숫자가 있으면 "시세" 검색 의도가 제목만 보고도 충족돼 클릭률이 올라간다.
 */
const factSentence = (facts: ScopeMetaFacts | undefined): string => {
  if (!facts || facts.avgPricePerKg === null) return "";
  const parts = [`${facts.seasonYear} 시즌 평균 kg당 ${won(facts.avgPricePerKg)}`];
  if (facts.peakPriceWon) parts.push(`최고 ${won(facts.peakPriceWon)}`);
  if (facts.totalQuantityKg) {
    parts.push(`공판량 ${Math.round(facts.totalQuantityKg).toLocaleString("ko-KR")}kg`);
  }
  return `${parts.join(", ")}. `;
};

const historyPhrase = (facts: ScopeMetaFacts | undefined): string =>
  facts?.firstYear ? `${facts.firstYear}년부터의` : "역대";

/** 지역 페이지 메타 (예: /region/경북) */
export const regionPageMeta = (
  region: string,
  path: string,
  facts?: ScopeMetaFacts
): PageMeta => ({
  title: `${region} 송이버섯 공판 시세 | 오송이`,
  description:
    `${region} 지역 송이버섯 공판 시세. ${factSentence(facts)}` +
    `${region} 산림조합별 등급 단가와 거래량, ${historyPhrase(facts)} 연도별 추이를 확인하세요.`,
  path,
});

/** 조합 페이지 메타 (예: /region/경북/봉화) */
export const unionPageMeta = (
  region: string,
  union: string,
  path: string,
  facts?: ScopeMetaFacts
): PageMeta => ({
  title: `${union} 송이 시세 (${region} ${union}산림조합) | 오송이`,
  description:
    `${region} ${union}산림조합 송이버섯 공판 시세. ${factSentence(facts)}` +
    `등급별 단가와 공판량, ${historyPhrase(facts)} 연도별 추이를 제공합니다.`,
  path,
});
