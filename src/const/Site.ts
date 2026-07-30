/**
 * 사이트 운영 정보 및 법적 표기 상수.
 * 데이터 출처 표기·면책·연락처는 산림조합중앙회 문의 메일에서 약속한 사항이므로
 * 임의로 축소하지 않는다. (docs/planning/data-rights-check.md 참조)
 */

/** 배포 도메인. canonical·OG 절대 URL 생성 기준 */
export const SITE_URL = "https://osongi.vercel.app";

/** 데이터 원본: 산림조합중앙회 송이 공판 현황 */
export const DATA_SOURCE = {
  name: "산림조합중앙회 송이 공판 현황",
  url: "https://iforest.nfcf.or.kr/forest/user.tdf?a=user.songi.SongiApp&c=1001&mc=CYB_FIF_DGS_SNI&pmsh_item_c=01",
} as const;

/** 운영자 연락처 (데이터 중단 요청 창구 겸용) */
export const CONTACT_EMAIL = "ykmo.work@gmail.com";

/** GitHub 저장소 */
export const GITHUB_REPO_URL = "https://github.com/momoci99/osongi";

/** 코드 라이선스 (데이터는 별도 — 원 저작권자 소유) */
export const CODE_LICENSE = {
  name: "MIT License",
  url: `${GITHUB_REPO_URL}/blob/main/LICENSE`,
} as const;

/** 면책 고지 */
export const DISCLAIMER =
  "표시되는 가격은 산림조합중앙회가 공개한 공판 실적을 가공한 참고 정보이며, 실제 거래가를 보장하지 않습니다.";

/** 운영 성격 고지 */
export const NON_COMMERCIAL_NOTICE =
  "개인이 비영리로 운영하는 서비스입니다. 광고나 유료 기능이 없으며, 데이터 원 저작권자의 요청 시 즉시 게시를 중단합니다.";

/** 데이터 갱신 주기 안내 (README의 '실시간' 표현을 대체) */
export const UPDATE_CYCLE_NOTICE =
  "시즌(9~11월) 중 약 1시간 주기로 갱신되며, 원본 게시 시점과 차이가 있을 수 있습니다.";
