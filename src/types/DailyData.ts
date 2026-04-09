import * as z from "zod";

const GradeBreakdownSchema = z.object({
  gradeKey: z.string(),
  quantityKg: z.number(),
  unitPriceWon: z.number(),
});

const DayOverDayChangeSchema = z.object({
  gradeKey: z.string(),
  currentPrice: z.number(),
  previousPrice: z.number(),
  changePercent: z.number(),
});

export const DailyDataScheme = z.object({
  generatedAt: z.string(),
  latestDate: z.string(),
  latestDaily: z.object({
    totalQuantityTodayKg: z.number(),
    topRegion: z.object({
      region: z.string(),
      quantityKg: z.number(),
    }),
    topUnion: z.object({
      union: z.string(),
      quantityKg: z.number(),
    }),
    topGradeByQuantity: z.object({
      gradeKey: z.string(),
      quantityKg: z.number(),
    }),
    gradeBreakdown: z.array(GradeBreakdownSchema),
    // V2: 지역별 등급 시세
    regionGradeBreakdown: z
      .record(z.string(), z.array(GradeBreakdownSchema))
      .optional(),
    // V2: 전일 대비 변동
    previousDayComparison: z
      .object({
        previousDate: z.string(),
        gradeChanges: z.array(DayOverDayChangeSchema),
      })
      .nullable()
      .optional(),
  }),
});

export type DailyDataType = z.infer<typeof DailyDataScheme>;
