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
} as const satisfies Record<string, PageMeta>;

/** 경로를 canonical 절대 URL로 변환 */
export const toCanonicalUrl = (path: string): string => `${SITE_URL}${path}`;
