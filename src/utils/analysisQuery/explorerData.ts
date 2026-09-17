import { buildRankModel, type RankItem } from "./rankModel";
import { buildRelationModel, type RelationModel } from "./relationModel";
import { selectByPlaceAndGrade } from "./rows";
import { runAnalysisQuery, shiftTimeByYears } from "./runQuery";
import { buildCoverage, buildSeasonSummaries, type Coverage, type SeasonSummaryRow } from "./seasonTables";
import { sumQuantityByDate } from "./seasonWindow";
import { listYears } from "./rows";
import type { AnalysisQuery, AnalysisResult, AnalysisResultCore, GradeRow } from "./types";

/** 데이터셋 전체 요약 — 템플릿·머리글이 쓰는 값 */
export type ExplorerMeta = {
  availableYears: number[];
  latestDate: string | null;
  /** 공판 건수 (날짜 × 조합) */
  recordCount: number;
};

/** 뷰 결과 (원본 행 대신 행 수만) */
export type ExplorerResult = AnalysisResultCore & { rowCount: number };

/**
 * 한 번의 조회로 화면 전체가 쓰는 계산 결과.
 * 원본 행이 필요한 모델(순위·관계·커버리지·시즌 요약)은 여기서 미리 만들어
 * 워커 → 메인 스레드로 3만 행을 복사하지 않게 한다.
 */
export type ExplorerData = {
  /** 이 데이터를 만든 쿼리 — 계산 중에도 화면이 결과와 어긋나지 않게 이것으로 그린다 */
  query: AnalysisQuery;
  result: ExplorerResult;
  comparison: ExplorerResult | null;
  /** 시즌 스트립 막대 — 지역·조합·등급 필터 적용, 전체 기간 */
  dailyQuantity: Map<string, number>;
  /** 스트립 막대를 결정하는 필터 키 — 같으면 이전 막대를 재사용한다 */
  dailyKey: string;
  /** 참여 조합 분모 — 지역·조합 범위의 전체 조합 수 */
  scopeUnionCount: number;
  seasonSummaries: SeasonSummaryRow[] | null;
  rankItems: RankItem[] | null;
  relation: RelationModel | null;
  coverage: Coverage | null;
};

/** 스트립 막대 필터 키 */
export const toDailyKey = (query: Pick<AnalysisQuery, "regions" | "unions" | "grades">): string =>
  [query.regions.join(","), query.unions.join(","), query.grades.join(",")].join("|");

/** 원본 행을 떼어낸다 */
const stripRows = ({ rows, ...core }: AnalysisResult): ExplorerResult => ({ ...core, rowCount: rows.length });

/** 데이터셋 요약 */
export const computeExplorerMeta = (rows: GradeRow[]): ExplorerMeta => {
  let latestDate: string | null = null;
  const records = new Set<string>();
  for (const row of rows) {
    if (latestDate === null || row.date > latestDate) latestDate = row.date;
    records.add(`${row.date}|${row.union}`);
  }
  return { availableYears: listYears(rows), latestDate, recordCount: records.size };
};

/** 시즌 요약 표를 쓰는 조합인지 */
export const isSeasonSummaryQuery = (query: AnalysisQuery): boolean =>
  query.view === "table" && query.granularity === "season" && query.groupBy === "year";

/** 쿼리 하나에 필요한 모든 계산 */
export const computeExplorerData = (rows: GradeRow[], query: AnalysisQuery): ExplorerData => {
  const result = runAnalysisQuery(rows, query);
  const comparison =
    query.compare === "prevYear"
      ? runAnalysisQuery(rows, { ...query, compare: "none", time: shiftTimeByYears(query.time, -1) })
      : null;

  return {
    query,
    result: stripRows(result),
    comparison: comparison ? stripRows(comparison) : null,
    dailyQuantity: sumQuantityByDate(selectByPlaceAndGrade(rows, query)),
    dailyKey: toDailyKey(query),
    scopeUnionCount: new Set(selectByPlaceAndGrade(rows, { ...query, grades: [] }).map((row) => row.union)).size,
    seasonSummaries: isSeasonSummaryQuery(query) ? buildSeasonSummaries(result.rows) : null,
    rankItems: query.view === "rank" ? buildRankModel(result, query, comparison) : null,
    relation: query.view === "relation" ? buildRelationModel(result, query) : null,
    coverage: query.view === "coverage" ? buildCoverage(result.rows) : null,
  };
};
