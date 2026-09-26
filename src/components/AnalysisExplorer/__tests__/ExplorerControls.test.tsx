import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import ExplorerControls from "../Controls";
import TemplateBar from "../TemplateBar";
import ViewTabs from "../Controls/ViewTabs";
import { makeQuery } from "../../../utils/analysisQuery/__tests__/fixtures";
import type { AnalysisQuery } from "../../../utils/analysisQuery/types";

const renderControls = (query: AnalysisQuery, onQueryChange = vi.fn()) => {
  render(
    <ThemeProvider theme={theme}>
      <ExplorerControls query={query} onQueryChange={onQueryChange} />
    </ThemeProvider>,
  );
  return onQueryChange;
};

describe("ViewTabs", () => {
  it("탭 클릭·좌우 화살표로 뷰를 바꾼다", () => {
    const onChange = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <ViewTabs view="timeline" onChange={onChange} />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "연도 겹침" }));
    expect(onChange).toHaveBeenLastCalledWith("overlay");

    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("heatmap");
  });
});

describe("ExplorerControls", () => {
  it("사이드바에는 뷰 탭 없이 보기 설정과 범위 필터만 둔다", () => {
    renderControls(makeQuery({ view: "overlay" }));

    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "보기 설정" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "지역" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "등급" })).toBeInTheDocument();
  });

  it("선택지가 하나뿐인 컨트롤은 숨긴다", () => {
    renderControls(makeQuery({ view: "overlay", groupBy: "year" }));

    expect(screen.queryByLabelText("묶기")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "정렬" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "비교" })).toBeInTheDocument();
  });

  it("조절할 옵션이 없는 뷰는 빈 옵션 줄을 남기지 않는다", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <ExplorerControls query={makeQuery({ view: "coverage" })} onQueryChange={vi.fn()} />
      </ThemeProvider>,
    );

    expect(container.querySelector("hr")).toBeNull();
    expect(screen.queryByRole("group", { name: "단위" })).not.toBeInTheDocument();
  });

  it("등급 칩은 토글, 전 등급은 선택을 비운다", () => {
    const onChange = renderControls(makeQuery({ grades: ["grade1"] }));

    fireEvent.click(screen.getByRole("button", { name: "2등품" }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ grades: ["grade1", "grade2"] }),
    );

    fireEvent.click(screen.getByRole("button", { name: "전 등급" }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ grades: [] }));
  });

  it("전국을 누르면 지역·조합 선택을 모두 비운다", () => {
    const onChange = renderControls(makeQuery({ regions: ["경북"], unions: ["봉화"] }));

    fireEvent.click(screen.getByRole("button", { name: "전국" }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ regions: [], unions: [] }));
  });
});

describe("TemplateBar", () => {
  it("활성 템플릿을 표시하고 클릭 시 ID를 전달한다", () => {
    const onSelect = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <TemplateBar activeId="unionRank" onSelect={onSelect} />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: /조합 순위/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /시즌 요약/ }));
    expect(onSelect).toHaveBeenCalledWith("seasonSummary");
  });
});
