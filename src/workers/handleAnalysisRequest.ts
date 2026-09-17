import { loadGradeRows } from "./loadGradeRows";
import { computeExplorerData, computeExplorerMeta } from "../utils/analysisQuery/explorerData";
import { buildRawRowsCsv } from "../utils/analysisQuery/exportData";
import { runAnalysisQuery } from "../utils/analysisQuery/runQuery";
import type { AnalysisRequest, AnalysisResponse } from "./analysisProtocol";

/** 요청 하나를 처리한다 — 워커와 동기 폴백이 공유 */
export const handleAnalysisRequest = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
  try {
    const rows = await loadGradeRows(request.version);
    switch (request.type) {
      case "meta":
        return { type: "meta", id: request.id, meta: computeExplorerMeta(rows) };
      case "query":
        return { type: "query", id: request.id, data: computeExplorerData(rows, request.query) };
      case "rawCsv":
        return { type: "rawCsv", id: request.id, csv: buildRawRowsCsv(runAnalysisQuery(rows, request.query).rows) };
    }
  } catch (error) {
    return { type: "error", id: request.id, message: error instanceof Error ? error.message : String(error) };
  }
};
