import { GradeKeyToKorean } from "../../const/Common";
import type { WeeklyPriceDatum } from "../../types/data";

/**
 * 등급별 시즌 분석 항목이다.
 */
export type GradeAnalysisItem = {
  gradeKey: string;
  avgPrice: number;
  totalQuantity: number;
  quantityShare: number;
  priceChange: number | null;
};

/**
 * 지역별 시즌 분석 항목이다.
 */
export type RegionAnalysisItem = {
  region: string;
  avgPrice: number;
  totalQuantity: number;
  rank: number;
};

type SeasonReportSummary = {
  totalTradingDays: number;
  totalQuantityKg: number;
  totalAmountWon: number;
  avgPricePerKg: number;
};

type SeasonReportPriceHighlights = {
  peakDate: string;
  peakPrice: number;
  peakGrade: string;
  troughDate: string;
  troughPrice: number;
  troughGrade: string;
};

type GradeVolatilityItem = {
  gradeKey: string;
  priceStdDev: number;
  priceCV: number;
};

type SeasonReportVolatility = {
  priceStdDev: number;
  priceCV: number;
  stableGrade: string | null;
  volatileGrade: string | null;
  gradeMetrics: GradeVolatilityItem[];
};

type SeasonReportYoYComparison = {
  avgPriceChange: number;
  quantityChange: number;
  tradingDaysChange: number;
};

/**
 * 시즌 리포트 구조이다.
 */
export type SeasonReport = {
  period: {
    start: string;
    end: string;
  };
  summary: SeasonReportSummary;
  gradeAnalysis: GradeAnalysisItem[];
  regionAnalysis: RegionAnalysisItem[];
  priceHighlights: SeasonReportPriceHighlights;
  volatility: SeasonReportVolatility;
  yoyComparison: SeasonReportYoYComparison | null;
  insights: string[];
};

/**
 * 금액을 3자리마다 쉼표가 포함된 문자열로 포맷한다.
 */
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value));
};

/**
 * 등급 키를 한글명으로 변환한다.
 */
const getGradeLabel = (gradeKey: string): string => {
  return GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey;
};

/**
 * 변동률을 계산한다.
 */
const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
};

/**
 * 평균 가격을 계산한다.
 */
const calculateAveragePrice = (totalAmountWon: number, totalQuantityKg: number): number => {
  if (totalQuantityKg === 0) {
    return 0;
  }

  return totalAmountWon / totalQuantityKg;
};

/**
 * 평균과 표준편차, 변동계수를 계산한다.
 */
const calculatePriceVolatility = (
  prices: number[]
): { priceStdDev: number; priceCV: number } => {
  if (prices.length === 0) {
    return { priceStdDev: 0, priceCV: 0 };
  }

  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const variance =
    prices.reduce((sum, price) => sum + (price - avgPrice) ** 2, 0) / prices.length;
  const priceStdDev = Math.round(Math.sqrt(variance));
  const priceCV =
    avgPrice > 0 ? Number(((priceStdDev / avgPrice) * 100).toFixed(1)) : 0;

  return { priceStdDev, priceCV };
};

/**
 * 리포트 요약을 계산한다.
 */
const calculateSummary = (data: WeeklyPriceDatum[]): SeasonReportSummary => {
  const totalTradingDays = new Set(data.map((datum) => datum.date)).size;
  const totalQuantityKg = data.reduce((sum, datum) => sum + datum.quantityKg, 0);
  const totalAmountWon = data.reduce(
    (sum, datum) => sum + datum.quantityKg * datum.unitPriceWon,
    0
  );

  return {
    totalTradingDays,
    totalQuantityKg,
    totalAmountWon,
    avgPricePerKg: calculateAveragePrice(totalAmountWon, totalQuantityKg),
  };
};

/**
 * 등급별 리포트를 생성한다.
 */
const calculateGradeAnalysis = (
  data: WeeklyPriceDatum[],
  selectedGrades: string[],
  totalQuantityKg: number,
  comparisonData?: WeeklyPriceDatum[]
): GradeAnalysisItem[] => {
  return selectedGrades.map((gradeKey) => {
    const currentGradeData = data.filter((datum) => datum.gradeKey === gradeKey);
    const totalQuantity = currentGradeData.reduce(
      (sum, datum) => sum + datum.quantityKg,
      0
    );
    const totalAmountWon = currentGradeData.reduce(
      (sum, datum) => sum + datum.quantityKg * datum.unitPriceWon,
      0
    );
    const avgPrice = calculateAveragePrice(totalAmountWon, totalQuantity);

    const comparisonGradeData = comparisonData?.filter(
      (datum) => datum.gradeKey === gradeKey
    );
    const comparisonQuantity = comparisonGradeData?.reduce(
      (sum, datum) => sum + datum.quantityKg,
      0
    );
    const comparisonAmount = comparisonGradeData?.reduce(
      (sum, datum) => sum + datum.quantityKg * datum.unitPriceWon,
      0
    );
    const comparisonAvgPrice = calculateAveragePrice(
      comparisonAmount ?? 0,
      comparisonQuantity ?? 0
    );

    return {
      gradeKey,
      avgPrice,
      totalQuantity,
      quantityShare: totalQuantityKg > 0 ? totalQuantity / totalQuantityKg : 0,
      priceChange:
        comparisonData === undefined
          ? null
          : calculatePercentChange(avgPrice, comparisonAvgPrice),
    };
  });
};

/**
 * 지역별 리포트를 생성한다.
 */
const calculateRegionAnalysis = (data: WeeklyPriceDatum[]): RegionAnalysisItem[] => {
  const regionMap = new Map<string, { totalQuantity: number; totalAmountWon: number }>();

  data.forEach((datum) => {
    const region = datum.region ?? "미상";
    const current = regionMap.get(region) ?? {
      totalQuantity: 0,
      totalAmountWon: 0,
    };

    current.totalQuantity += datum.quantityKg;
    current.totalAmountWon += datum.quantityKg * datum.unitPriceWon;
    regionMap.set(region, current);
  });

  return Array.from(regionMap.entries())
    .map(([region, { totalQuantity, totalAmountWon }]) => ({
      region,
      avgPrice: calculateAveragePrice(totalAmountWon, totalQuantity),
      totalQuantity,
      rank: 0,
    }))
    .sort((left, right) => right.avgPrice - left.avgPrice)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
};

/**
 * 최고가와 최저가를 추출한다.
 */
const calculatePriceHighlights = (
  data: WeeklyPriceDatum[]
): SeasonReportPriceHighlights => {
  if (data.length === 0) {
    return {
      peakDate: "",
      peakPrice: 0,
      peakGrade: "",
      troughDate: "",
      troughPrice: 0,
      troughGrade: "",
    };
  }

  const peakRecord = data.reduce((highest, datum) => {
    return datum.unitPriceWon > highest.unitPriceWon ? datum : highest;
  }, data[0]);
  const troughRecord = data.reduce((lowest, datum) => {
    return datum.unitPriceWon < lowest.unitPriceWon ? datum : lowest;
  }, data[0]);

  return {
    peakDate: peakRecord.date,
    peakPrice: peakRecord.unitPriceWon,
    peakGrade: peakRecord.gradeKey,
    troughDate: troughRecord.date,
    troughPrice: troughRecord.unitPriceWon,
    troughGrade: troughRecord.gradeKey,
  };
};

/**
 * 시즌 변동성을 계산한다.
 */
const calculateVolatility = (
  data: WeeklyPriceDatum[],
  selectedGrades: string[]
): SeasonReportVolatility => {
  const overall = calculatePriceVolatility(data.map((datum) => datum.unitPriceWon));
  const gradeMetrics = selectedGrades
    .map((gradeKey) => {
      const prices = data
        .filter((datum) => datum.gradeKey === gradeKey)
        .map((datum) => datum.unitPriceWon);

      if (prices.length === 0) {
        return null;
      }

      const { priceStdDev, priceCV } = calculatePriceVolatility(prices);

      return {
        gradeKey,
        priceStdDev,
        priceCV,
      };
    })
    .filter((metric): metric is GradeVolatilityItem => metric !== null);

  const stableGrade =
    gradeMetrics.length > 0
      ? gradeMetrics.reduce((stable, metric) => {
          return metric.priceCV < stable.priceCV ? metric : stable;
        }).gradeKey
      : null;
  const volatileGrade =
    gradeMetrics.length > 0
      ? gradeMetrics.reduce((volatile, metric) => {
          return metric.priceCV > volatile.priceCV ? metric : volatile;
        }).gradeKey
      : null;

  return {
    ...overall,
    stableGrade,
    volatileGrade,
    gradeMetrics,
  };
};

/**
 * 시즌 기간을 계산한다.
 */
const calculatePeriod = (data: WeeklyPriceDatum[]): { start: string; end: string } => {
  if (data.length === 0) {
    return { start: "", end: "" };
  }

  const dates = data.map((datum) => datum.date).sort((left, right) =>
    left.localeCompare(right)
  );

  return {
    start: dates[0],
    end: dates[dates.length - 1],
  };
};

/**
 * 비교용 전년 동기 변동률을 계산한다.
 */
const calculateYoYComparison = (
  summary: SeasonReportSummary,
  comparisonData?: WeeklyPriceDatum[]
): SeasonReportYoYComparison | null => {
  if (comparisonData === undefined) {
    return null;
  }

  const comparisonSummary = calculateSummary(comparisonData);

  return {
    avgPriceChange: calculatePercentChange(
      summary.avgPricePerKg,
      comparisonSummary.avgPricePerKg
    ),
    quantityChange: calculatePercentChange(
      summary.totalQuantityKg,
      comparisonSummary.totalQuantityKg
    ),
    tradingDaysChange: calculatePercentChange(
      summary.totalTradingDays,
      comparisonSummary.totalTradingDays
    ),
  };
};

/**
 * 필터링된 차트 데이터를 기반으로 시즌 리포트를 생성한다.
 */
export const generateSeasonReport = (
  data: WeeklyPriceDatum[],
  selectedGrades: string[],
  comparisonData?: WeeklyPriceDatum[]
): SeasonReport => {
  const period = calculatePeriod(data);
  const summary = calculateSummary(data);
  const gradeAnalysis = calculateGradeAnalysis(
    data,
    selectedGrades,
    summary.totalQuantityKg,
    comparisonData
  );
  const regionAnalysis = calculateRegionAnalysis(data);
  const priceHighlights = calculatePriceHighlights(data);
  const volatility = calculateVolatility(data, selectedGrades);
  const yoyComparison = calculateYoYComparison(summary, comparisonData);

  const report: SeasonReport = {
    period,
    summary,
    gradeAnalysis,
    regionAnalysis,
    priceHighlights,
    volatility,
    yoyComparison,
    insights: [],
  };

  return {
    ...report,
    insights: generateInsights(report),
  };
};

/**
 * SeasonReport를 기반으로 인사이트 문장을 생성한다.
 */
export const generateInsights = (report: SeasonReport): string[] => {
  if (report.summary.totalTradingDays === 0) {
    return [];
  }

  const insights: string[] = [];

  if (
    report.yoyComparison !== null &&
    Math.abs(report.yoyComparison.avgPriceChange) >= 5
  ) {
    const direction =
      report.yoyComparison.avgPriceChange > 0 ? "상승" : "하락";
    insights.push(
      `올해 평균 단가는 ${formatNumber(
        report.summary.avgPricePerKg
      )}원으로 전년 대비 ${Math.abs(report.yoyComparison.avgPriceChange).toFixed(
        1
      )}% ${direction}했습니다.`
    );
  }

  const leadingGrade = report.gradeAnalysis.reduce<GradeAnalysisItem | null>(
    (leader, item) => {
      if (item.totalQuantity === 0) {
        return leader;
      }

      if (leader === null || item.quantityShare > leader.quantityShare) {
        return item;
      }

      return leader;
    },
    null
  );

  if (leadingGrade !== null) {
    insights.push(
      `${getGradeLabel(leadingGrade.gradeKey)}이 전체 거래량의 ${(
        leadingGrade.quantityShare * 100
      ).toFixed(1)}%를 차지하며 가장 많이 거래되었습니다.`
    );
  }

  if (report.priceHighlights.peakDate) {
    insights.push(
      `${report.priceHighlights.peakDate}에 ${getGradeLabel(
        report.priceHighlights.peakGrade
      )} 최고가 ${formatNumber(report.priceHighlights.peakPrice)}원이 기록되었습니다.`
    );
  }

  if (report.volatility.volatileGrade) {
    const volatileMetric = report.volatility.gradeMetrics.find(
      (metric) => metric.gradeKey === report.volatility.volatileGrade
    );

    insights.push(
      `${getGradeLabel(report.volatility.volatileGrade)}이 가장 큰 가격 변동성을 보여 CV ${
        volatileMetric?.priceCV.toFixed(1) ?? "0.0"
      }%를 기록했습니다.`
    );
  }

  const topRegion = report.regionAnalysis[0];

  if (topRegion) {
    insights.push(
      `${topRegion.region} 지역이 평균 단가 ${formatNumber(
        topRegion.avgPrice
      )}원으로 가장 높은 시세를 형성했습니다.`
    );
  }

  return insights.slice(0, 5);
};
