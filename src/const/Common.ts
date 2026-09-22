export const GradeKeyToKorean = {
  grade1: "1등품",
  grade2: "2등품",
  grade3Stopped: "3등품(생장정지품)",
  grade3Estimated: "3등품(개산품)",
  gradeBelow: "등외품",
  mixedGrade: "혼합품",
} as const;

export const GRADE_OPTIONS = [
  { value: "grade1", label: "1등품" },
  { value: "grade2", label: "2등품" },
  { value: "grade3Stopped", label: "3등품(생장정지)" },
  { value: "grade3Estimated", label: "3등품(개산)" },
  { value: "gradeBelow", label: "등외품" },
  { value: "mixedGrade", label: "혼합품" },
] as const;

/** 가로 스크롤 끝 페이드 */
export const SCROLL_FADE = {
  /** 페이드 폭 (px) */
  WIDTH: 28,
  /** 고정 머리글·첫 열(zIndex 3)보다 위 */
  Z_INDEX: 4,
} as const;

/**
 * 사용 가능한 지역 목록
 */
export const AVAILABLE_REGIONS = ["강원", "경북", "경남"] as const;

/** 지역별 HSL 기본 색조 (단위: degree) */
export const REGION_BASE_HUES: Record<string, number> = {
  강원: 210,
  경북: 28,
  경남: 270,
};

/**
 * 지역별 HSL 명도 보정 (단위: %p).
 * 보라(270°)는 같은 명도에서도 눈에 훨씬 어두워 다크 배경에 묻히므로 밝게 끌어올린다.
 */
export const REGION_LIGHTNESS_OFFSET: Record<string, number> = {
  경남: 12,
};

/**
 * 지역별 조합 맵
 */
export const REGION_UNION_MAP: Record<
  (typeof AVAILABLE_REGIONS)[number],
  string[]
> = {
  강원: ["홍천", "양구", "인제", "고성", "양양", "강릉", "삼척"],
  경북: [
    "의성",
    "안동",
    "청송",
    "영덕",
    "포항",
    "청도",
    "상주",
    "문경",
    "예천",
    "영주",
    "봉화",
    "울진",
    "영천",
  ],
  경남: ["거창"],
};

/** 대시보드 지역 등급표 */
export const REGION_BREAKDOWN_TABLE = {
  /** 수량 표시 소수 자릿수 (kg) */
  QUANTITY_FRACTION_DIGITS: 2,
  /** 전일 대비 배지 배경 투명도 */
  CHANGE_BADGE_BG_ALPHA: 0.14,
  /** 전일 대비 배지 최소 폭 (px). 행마다 폭이 달라 들쭉날쭉해지는 것을 막는다 */
  CHANGE_BADGE_MIN_WIDTH: 64,
} as const;
