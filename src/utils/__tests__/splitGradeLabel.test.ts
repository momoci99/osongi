import { describe, it, expect } from "vitest";
import splitGradeLabel from "../splitGradeLabel";

describe("splitGradeLabel", () => {
  it("괄호 속 세부 구분을 분리한다", () => {
    expect(splitGradeLabel("3등품(생장정지품)")).toEqual({
      main: "3등품",
      qualifier: "생장정지품",
    });
  });

  it("괄호가 없으면 qualifier는 null", () => {
    expect(splitGradeLabel("1등품")).toEqual({ main: "1등품", qualifier: null });
  });
});
