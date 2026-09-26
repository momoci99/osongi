/**
 * 산림조합 옛 송이 공판 게시판(2008~2012) 정제 상수
 */

/** 옛 집계표 등급 열 순서 → 현행 등급 키. 등외품(혼합품)은 하나의 열이라 gradeBelow 로 묶는다 */
export const LEGACY_GRADE_KEYS = [
  "grade1",
  "grade2",
  "grade3Stopped",
  "grade3Estimated",
  "gradeBelow",
] as const;

/** 집계표 열 배치 (도별 열 기준 오프셋) */
export const LEGACY_COLUMN = {
  region: 0,
  union: 1,
  quantityStart: 2,
  amountStart: 5,
  gradeStart: 8,
} as const;

/** 단가 기준. 2008~2009 는 등급별 최고가, 2010~ 는 낙찰 평균 단가 */
export type LegacyPriceBasis = "max" | "avg";

/** 정합성 검사 허용 오차 */
export const LEGACY_TOLERANCE = {
  /** 수량 합계 비교 허용 오차(kg). 원본이 소수 둘째 자리 반올림 */
  quantityKg: 0.05,
  /** 금액 합계 비교 허용 오차(원) */
  amountWon: 10,
  /** 평균 단가 × 수량 ≈ 금일 금액 비교 허용 비율 */
  amountRatio: 0.02,
} as const;
