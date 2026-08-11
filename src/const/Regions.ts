import { AVAILABLE_REGIONS, REGION_BASE_HUES, REGION_UNION_MAP } from "./Common";

/** 지역 색 도트의 채도·명도 (HSL) */
const REGION_DOT_SATURATION = 58;
const REGION_DOT_LIGHTNESS = 48;

export type RegionName = (typeof AVAILABLE_REGIONS)[number];

/** 지역·조합 상세 페이지 경로 접두어 */
export const REGION_ROUTE_PREFIX = "/region";

/**
 * 경로에 지역·조합명을 한글 그대로 쓴다.
 * 검색어("봉화 송이 시세")와 URL 문자열이 일치할 때 검색 결과 노출·클릭률에 유리하고,
 * 구글·네이버 모두 디코딩된 한글로 표시한다. sitemap 등 기계 판독용 위치에서만
 * encodeRoute 로 퍼센트 인코딩한다.
 */
export const regionPath = (region: string): string =>
  `${REGION_ROUTE_PREFIX}/${region}`;

export const unionPath = (region: string, union: string): string =>
  `${REGION_ROUTE_PREFIX}/${region}/${union}`;

/** 한글 경로를 sitemap·canonical 용 퍼센트 인코딩 경로로 변환 */
export const encodeRoute = (path: string): string =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

/**
 * 지역 식별 색.
 * 조합 목록이 지역 구분 없이 나열되면 어디 조합인지 매번 이름을 읽어야 한다.
 * 대시보드가 쓰는 지역 색조를 그대로 재사용해 화면 간 색 의미를 통일한다.
 */
export const regionColor = (region: string): string => {
  const hue = REGION_BASE_HUES[region];
  return hue === undefined
    ? "transparent"
    : `hsl(${hue}, ${REGION_DOT_SATURATION}%, ${REGION_DOT_LIGHTNESS}%)`;
};

/** 유효한 지역명인지 검사 */
export const isRegionName = (value: string | undefined): value is RegionName =>
  value !== undefined && (AVAILABLE_REGIONS as readonly string[]).includes(value);

/** 해당 지역에 속한 조합인지 검사 */
export const isUnionOfRegion = (
  region: string | undefined,
  union: string | undefined
): boolean =>
  isRegionName(region) &&
  union !== undefined &&
  REGION_UNION_MAP[region].includes(union);

/** 조합이 속한 지역을 찾는다. 없으면 null */
export const findRegionOfUnion = (union: string): RegionName | null => {
  for (const region of AVAILABLE_REGIONS) {
    if (REGION_UNION_MAP[region].includes(union)) return region;
  }
  return null;
};

export type ScopeRoute = {
  /** 사람이 읽는 한글 경로 */
  path: string;
  region: RegionName;
  /** 지역 페이지는 undefined */
  union?: string;
};

/**
 * 프리렌더·sitemap 대상 경로 전체 (지역 3개 + 조합 21개).
 * 큐레이션된 REGION_UNION_MAP 을 유일한 출처로 삼아
 * 라우트·sitemap·프리렌더가 어긋나지 않게 한다.
 */
export const SCOPE_ROUTES: readonly ScopeRoute[] = AVAILABLE_REGIONS.flatMap(
  (region) => [
    { path: regionPath(region), region },
    ...REGION_UNION_MAP[region].map((union) => ({
      path: unionPath(region, union),
      region,
      union,
    })),
  ]
);

/** 같은 지역 내 다른 조합 목록 (내부 링크용) */
export const siblingUnions = (region: string, union: string): string[] =>
  isRegionName(region)
    ? REGION_UNION_MAP[region].filter((name) => name !== union)
    : [];
