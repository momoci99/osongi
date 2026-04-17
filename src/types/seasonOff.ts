export type SeasonSummary = {
  year: number;
  startDate: string;
  endDate: string;
  totalQuantityKg: number;
  totalAmountWon: number;
  avgPricePerKg: number;
  highestPrice: { date: string; gradeKey: string; price: number } | null;
  lowestPrice: { date: string; gradeKey: string; price: number } | null;
};

export type MonthlyPattern = {
  month: number;
  avgQuantityKg: number;
  avgPriceWon: number;
  yearCount: number;
};

export type RegionRanking = {
  region: string;
  avgPriceWon: number;
  totalQuantityKg: number;
};

export type RegionSeasonSummary = {
  totalQuantityKg: number;
  totalAmountWon: number;
  avgPricePerKg: number;
};

export type SeasonManifest = {
  generatedAt: string;
  latestSeasonSummary: SeasonSummary | null;
  regionSeasonSummaries: Record<string, RegionSeasonSummary>;
  monthlyPatterns: MonthlyPattern[];
  regionRanking: RegionRanking[];
};

export type YearlyEntry = {
  totalQuantityKg: number;
  totalAmountWon: number;
  topRegion: { region: string; quantityKg: number } | null;
  topUnion: { union: string; quantityKg: number } | null;
};

export type YearlyManifest = {
  generatedAt: string;
  yearly: Record<string, YearlyEntry>;
  regionYearly: Record<
    string,
    Record<string, { totalQuantityKg: number; totalAmountWon: number }>
  >;
};
