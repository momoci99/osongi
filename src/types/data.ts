import * as z from "zod";

export type MushroomAuctionDataRaw = {
  region: string; // 지역: 산림 조합이 위치한 지역 명
  union: string; // 조합: 조합 명
  date?: string; // 날짜 (파일 내 스냅샷 날짜) - 일부 구버전 타입 누락되어 optional 처리
  lastUpdated?: string; // 마지막 업데이트 타임스탬프 - optional
  auctionQuantity: {
    untilYesterday: string; // 공판량 전일까지: 올해 기준, 어제까지 수매한 송이버섯의 수량 (kg)
    today: string; // 공판량 금일: 당일 수매한 송이버섯의 수량 (kg)
    total: string; // 공판량 누계: 전일 + 금일까지의 송이버섯 수량 (kg)
  };
  auctionAmount: {
    untilYesterday: string; // 공판금액 전일까지: 올해 기준, 어제까지 수매한 송이버섯의 수매 금액 (원)
    today: string; // 공판금액 금일: 당일 수매 금액 (원)
    total: string; // 공판금액 누계: 전일 + 금일까지의 수매 금액 (원)
  };
  grade1: {
    quantity: string; // 1등품 수량: 1등품의 수량
    unitPrice: string; // 1등품 단가: 1등품의 단가
  };
  grade2: {
    quantity: string; // 2등품 수량: 2등품의 수량
    unitPrice: string; // 2등품 단가: 2등품의 단가
  };
  grade3Stopped: {
    quantity: string; // 3등품(생장정지품) 수량: 3등품(생장정지품)의 수량
    unitPrice: string; // 3등품(생장정지품) 단가: 3등품(생장정지품)의 단가
  };
  grade3Estimated: {
    quantity: string; // 3등품(개산품) 수량: 3등품(개산품)의 수량
    unitPrice: string; // 3등품(개산품) 단가: 3등품(개산품)의 단가
  };
  gradeBelow: {
    quantity: string; // 등외품 수량: 등외품의 수량
    unitPrice: string; // 등외품 단가: 등외품의 단가
  };
  mixedGrade: {
    quantity: string; // 혼합품 수량: 혼합품의 수량
    unitPrice: string; // 혼합품 단가: 혼합품의 단가
  };
};

// Weekly chart data types
export type WeeklyPriceDatum = {
  date: string; // YYYY-MM-DD
  gradeKey: string; // grade1, grade2, etc.
  quantityKg: number;
  unitPriceWon: number;
};

export type WeeklyManifest = {
  generatedAt: string;
  weeklyData: WeeklyPriceDatum[];
};

// Weekly data zod schemas
export const WeeklyPriceDatumSchema = z.object({
  date: z.string(),
  gradeKey: z.string(),
  quantityKg: z.number(),
  unitPriceWon: z.number(),
});

export const WeeklyManifestSchema = z.object({
  generatedAt: z.string(),
  weeklyData: z.array(WeeklyPriceDatumSchema),
});

export type WeeklyPriceDatumType = z.infer<typeof WeeklyPriceDatumSchema>;
export type WeeklyManifestType = z.infer<typeof WeeklyManifestSchema>;
