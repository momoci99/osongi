import type { RegionManifest, ScopeStats } from "../types/region";

/**
 * 지역·조합 페이지 테스트용 고정 데이터.
 * region-manifest.json 은 빌드 시점에 생성되므로 테스트는 실제 파일 대신
 * 스키마만 같은 최소 표본을 쓴다.
 */

/** 기본값 위에 필요한 필드만 덮어써 ScopeStats 를 만든다 */
export const makeScopeStats = (
  overrides: Partial<ScopeStats> = {}
): ScopeStats => ({
  name: "봉화",
  region: "경북",
  latestSeasonYear: 2025,
  season: {
    startDate: "2025-09-22",
    endDate: "2025-11-12",
    totalQuantityKg: 12000,
    totalAmountWon: 3600000000,
    avgPricePerKg: 300000,
  },
  grades: [
    { gradeKey: "grade1", quantityKg: 3000, avgUnitPriceWon: 500000 },
    { gradeKey: "grade2", quantityKg: 9000, avgUnitPriceWon: 260000 },
  ],
  yearly: [
    {
      year: 2023,
      totalQuantityKg: 8000,
      totalAmountWon: 2000000000,
      avgPricePerKg: 250000,
    },
    {
      year: 2024,
      totalQuantityKg: 15000,
      totalAmountWon: 4200000000,
      avgPricePerKg: 280000,
    },
    {
      year: 2025,
      totalQuantityKg: 12000,
      totalAmountWon: 3600000000,
      avgPricePerKg: 300000,
    },
  ],
  peak: { date: "2025-09-30", gradeKey: "grade1", priceWon: 820000 },
  latestDaily: {
    date: "2025-11-12",
    totalQuantityKg: 120,
    grades: [{ gradeKey: "grade1", quantityKg: 120, avgUnitPriceWon: 410000 }],
  },
  quantityRank: { rank: 3, of: 21 },
  ...overrides,
});

/** 경북 지역 + 봉화·울진 조합만 담은 매니페스트 */
export const makeRegionManifest = (): RegionManifest => ({
  generatedAt: "2026-07-30T15:16:25.040Z",
  latestDate: "2025-11-12",
  latestSeasonYear: 2025,
  regions: {
    경북: {
      ...makeScopeStats({
        name: "경북",
        region: "경북",
        quantityRank: undefined,
      }),
      unions: ["봉화", "울진"],
    },
  },
  unions: {
    봉화: makeScopeStats({ name: "봉화", region: "경북" }),
    울진: makeScopeStats({
      name: "울진",
      region: "경북",
      season: {
        startDate: "2025-09-20",
        endDate: "2025-11-12",
        totalQuantityKg: 30000,
        totalAmountWon: 8100000000,
        avgPricePerKg: 270000,
      },
      quantityRank: { rank: 1, of: 21 },
    }),
  },
});
