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

/**
 * 사용 가능한 지역 목록
 */
export const AVAILABLE_REGIONS = ["강원", "경북", "경남"] as const;

/**
 * 지역별 조합 맵
 */
export const REGION_UNION_MAP: Record<
  (typeof AVAILABLE_REGIONS)[number],
  string[]
> = {
  강원: ["홍천", "양구", "인제", "고성", "양양", "강릉", "삼척", "의성"],
  경북: [
    "의성",
    "안동",
    "청송",
    "영덕",
    "포항",
    "청도",
    "상주",
    "문경",
    "예청",
    "영주",
    "봉화",
    "울진",
  ],
  경남: ["거창"],
};
