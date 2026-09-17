import type { ExplorerData, ExplorerMeta } from "../utils/analysisQuery/explorerData";
import type { AnalysisQuery } from "../utils/analysisQuery/types";

/** 메인 → 워커 요청 */
export type AnalysisRequest =
  | { type: "meta"; id: number; version: string }
  | { type: "query"; id: number; version: string; query: AnalysisQuery }
  | { type: "rawCsv"; id: number; version: string; query: AnalysisQuery };

/** 워커 → 메인 응답 */
export type AnalysisResponse =
  | { type: "meta"; id: number; meta: ExplorerMeta }
  | { type: "query"; id: number; data: ExplorerData }
  | { type: "rawCsv"; id: number; csv: string }
  | { type: "error"; id: number; message: string };

/** 요청 종류별 응답 매핑 */
export type ResponseOf<T extends AnalysisRequest["type"]> = Extract<AnalysisResponse, { type: T }>;
