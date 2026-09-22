import type { GradeKeyToKorean } from "../../const/Common";

/** 등급 키 */
export type GradeKey = keyof typeof GradeKeyToKorean;

/** 분석 뷰 종류 */
export type AnalysisView =
  | "timeline"
  | "overlay"
  | "heatmap"
  | "coverage"
  | "rank"
  | "composition"
  | "relation"
  | "weather"
  | "table";

/** 측정 지표 */
export type AnalysisMetric =
  | "unitPrice"
  | "quantity"
  | "amount"
  | "cumQuantity"
  | "gradeShare";

/** 시리즈 묶기 기준 */
export type AnalysisGroupBy = "none" | "year" | "region" | "union" | "grade";

/** 집계 단위 */
export type AnalysisGranularity = "day" | "week" | "season";

/** 연도 겹침 정렬 기준 — 달력(MM-DD) | 첫 공판일 = 1일차 */
export type AnalysisAlign = "calendar" | "seasonDay";

/** 비교 대상 */
export type AnalysisCompare = "none" | "normal" | "prevYear";

/** 시간 범위 — 시즌(연도) 다중 선택 또는 달력 기간 */
export type AnalysisTime =
  | { kind: "seasons"; years: number[] }
  | { kind: "range"; start: string; end: string };

/** URL로 직렬화되는 분석 조회 상태 */
export type AnalysisQuery = {
  view: AnalysisView;
  time: AnalysisTime;
  align: AnalysisAlign;
  regions: string[];
  unions: string[];
  /** 빈 배열이면 전체 등급 */
  grades: GradeKey[];
  metric: AnalysisMetric;
  groupBy: AnalysisGroupBy;
  granularity: AnalysisGranularity;
  compare: AnalysisCompare;
  /** 선택한 모든 시즌에 공판이 있는 조합만 집계 */
  commonUnitsOnly: boolean;
};

/** 롱 포맷 행 — 공판 레코드 1건 × 수량이 있는 등급 1개 */
export type GradeRow = {
  /** YYYY-MM-DD */
  date: string;
  year: number;
  /** MM-DD */
  monthDay: string;
  region: string;
  union: string;
  grade: GradeKey;
  /** kg */
  quantity: number;
  /** 원/kg */
  unitPrice: number;
  /** 원 */
  amount: number;
};

/** x축 차원 */
export type AnalysisAxis = "date" | "monthDay" | "seasonDay" | "year";

/** 집계 포인트 */
export type AggregatePoint = {
  /** 정렬·조인용 x 값. date·monthDay는 문자열, seasonDay·year는 숫자 */
  x: string | number;
  year: number;
  /** 지표 값. 계산 불가(단가인데 수량 0 등)면 null */
  value: number | null;
  quantity: number;
  amount: number;
  records: number;
  tradingDays: number;
  unions: number;
  lowSample: boolean;
};

/** 시리즈 — 묶기 기준 값 하나 */
export type AggregateSeries = {
  key: string;
  label: string;
  points: AggregatePoint[];
};

/** 평년 밴드 포인트 */
export type NormalBandPoint = {
  x: string | number;
  lower: number;
  median: number;
  upper: number;
  /** 밴드를 구성한 시즌 수 */
  seasons: number;
};

/** 가격 극값 */
export type PriceExtreme = {
  unitPrice: number;
  date: string;
  union: string;
  grade: GradeKey;
};

/** 요약 패널 수치 */
export type AnalysisSummary = {
  tradingDays: number;
  records: number;
  unions: number;
  quantity: number;
  amount: number;
  /** 수량 가중 평균 단가 */
  unitPrice: number | null;
  max: PriceExtreme | null;
  min: PriceExtreme | null;
  lowSample: boolean;
};

/** 쿼리 실행 결과 */
export type AnalysisResult = {
  axis: AnalysisAxis;
  series: AggregateSeries[];
  summary: AnalysisSummary;
  /** 연도별 1일차 날짜 (M3: 필터 적용 후 첫 공판일) */
  seasonStarts: Record<number, string>;
  normalBand: NormalBandPoint[] | null;
  /** 평년에 사용된 시즌 */
  normalYears: number[];
  /** 집계에 실제 포함된 조합 */
  includedUnions: string[];
  /** 모든 필터를 적용한 등급 행 (표·시즌 요약용) */
  rows: GradeRow[];
};

/** 원본 행을 뺀 결과 — 워커가 메인 스레드로 넘기는 형태 */
export type AnalysisResultCore = Omit<AnalysisResult, "rows">;
