import * as z from "zod";

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
    gradeBreakdown: z.array(
      z.object({
        gradeKey: z.string(),
        quantityKg: z.number(),
        unitPriceWon: z.number(),
      })
    ),
  }),
});

export type DailyDataType = z.infer<typeof DailyDataScheme>;
