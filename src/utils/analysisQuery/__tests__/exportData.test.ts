import { describe, expect, it } from "vitest";
import { buildExportFilename, buildRawRowsCsv, buildSeriesCsv, toCsvString } from "../exportData";
import { runAnalysisQuery } from "../runQuery";
import { makeQuery, makeRow } from "./fixtures";

describe("CSV 내보내기", () => {
  it("셀을 따옴표로 감싸고 내부 따옴표를 이중화한다", () => {
    expect(toCsvString([["a\"b", 1]])).toBe('"a""b","1"');
  });

  it("원본 행은 날짜순, 등급은 한국어", () => {
    const csv = buildRawRowsCsv([
      makeRow("2024-09-21", { quantity: 2, unitPrice: 100 }),
      makeRow("2024-09-20", { grade: "gradeBelow" }),
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain("단가(원/kg)");
    expect(lines[1]).toBe('"2024-09-20","강원","양양","등외품","1","100","100"');
  });

  it("집계 결과는 원시 단위로 시리즈×구간", () => {
    const query = makeQuery({ time: { kind: "seasons", years: [2024] } });
    const csv = buildSeriesCsv(query, runAnalysisQuery([makeRow("2024-09-20", { unitPrice: 500_000 })], query));
    expect(csv.split("\r\n")).toEqual([
      '"시리즈","시즌","구간","단가(원/kg)","공판 건수","공판일"',
      '"전체","2024","2024.09.20","500000","1","1"',
    ]);
  });

  it("파일 이름", () => {
    expect(buildExportFilename(makeQuery({ view: "overlay", time: { kind: "seasons", years: [2021, 2026] } }))).toBe(
      "osongi_overlay_2021-2026",
    );
    expect(
      buildExportFilename(makeQuery({ time: { kind: "range", start: "2025-09-01", end: "2025-09-30" } })),
    ).toBe("osongi_timeline_2025-09-01_2025-09-30");
  });
});
