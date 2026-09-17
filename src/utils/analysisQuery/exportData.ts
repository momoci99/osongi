import { GradeKeyToKorean } from "../../const/Common";
import { formatAxisValue } from "./format";
import { METRIC_LABELS } from "./labels";
import type { AnalysisQuery, AnalysisResultCore, GradeRow } from "./types";

/** CSV 셀 이스케이프 — 모든 셀을 따옴표로 감싼다 */
const escapeCell = (cell: string | number): string => `"${String(cell).replace(/"/g, '""')}"`;

/** 2차원 배열 → CSV 문자열 (CRLF, Excel 호환) */
export const toCsvString = (rows: (string | number)[][]): string =>
  rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");

/** 필터를 적용한 원본 등급 행 CSV */
export const buildRawRowsCsv = (rows: GradeRow[]): string =>
  toCsvString([
    ["날짜", "지역", "조합", "등급", "수량(kg)", "단가(원/kg)", "금액(원)"],
    ...[...rows]
      .sort((a, b) => a.date.localeCompare(b.date) || a.union.localeCompare(b.union))
      .map((row) => [
        row.date,
        row.region,
        row.union,
        GradeKeyToKorean[row.grade],
        row.quantity,
        row.unitPrice,
        Math.round(row.amount),
      ]),
  ]);

/** 지표 원시 단위 — 표시용 축약(만원·톤) 없이 내보낸다 */
const RAW_UNITS: Record<AnalysisQuery["metric"], string> = {
  unitPrice: "원/kg",
  quantity: "kg",
  amount: "원",
  cumQuantity: "kg",
  gradeShare: "비율",
};

/** 현재 뷰의 집계 결과 CSV — 시리즈 × 구간 롱 포맷 */
export const buildSeriesCsv = (query: AnalysisQuery, result: AnalysisResultCore): string =>
  toCsvString([
    ["시리즈", "시즌", "구간", `${METRIC_LABELS[query.metric]}(${RAW_UNITS[query.metric]})`, "공판 건수", "공판일"],
    ...result.series.flatMap((series) =>
      series.points.map((point) => [
        series.label,
        point.year,
        formatAxisValue(result.axis, point.x, query.granularity),
        point.value ?? "",
        point.records,
        point.tradingDays,
      ]),
    ),
  ]);

/** 파일 이름 — 뷰와 기간을 담고 파일 시스템에 안전한 문자만 남긴다 */
export const buildExportFilename = (query: AnalysisQuery): string => {
  const period =
    query.time.kind === "range"
      ? `${query.time.start}_${query.time.end}`
      : query.time.years.length > 1
        ? `${query.time.years[0]}-${query.time.years[query.time.years.length - 1]}`
        : String(query.time.years[0] ?? "");
  return `osongi_${query.view}_${period}`.replace(/[^\w.-]/g, "_");
};
