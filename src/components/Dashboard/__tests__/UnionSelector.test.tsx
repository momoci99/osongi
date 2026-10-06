import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import { useSettingsStore } from "../../../stores/useSettingsStore";
import UnionSelector from "../UnionSelector";

const renderSelector = (tradedUnions: string[] = ["봉화"]) =>
  render(
    <ThemeProvider theme={theme}>
      <UnionSelector tradedUnions={tradedUnions} />
    </ThemeProvider>,
  );

describe("UnionSelector", () => {
  beforeEach(() => {
    useSettingsStore.setState({ myRegion: "경북", myUnion: null });
  });

  it("조합을 고르지 않았으면 지역 전체로 표시한다", () => {
    renderSelector();
    expect(screen.getByRole("combobox", { name: "조합 선택" })).toHaveTextContent("지역 전체");
  });

  it("내 지역 조합만 나열하고 거래 없는 조합에는 표시를 붙인다", async () => {
    renderSelector();
    await userEvent.click(screen.getByRole("combobox", { name: "조합 선택" }));
    const listbox = screen.getByRole("listbox");

    expect(within(listbox).getByRole("option", { name: "봉화" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: /청송\s*거래 없음/ })).toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: /홍천/ })).toBeNull();
  });

  it("조합을 고르면 설정에 저장하고, 지역 전체를 고르면 비운다", async () => {
    renderSelector();
    const combobox = screen.getByRole("combobox", { name: "조합 선택" });

    await userEvent.click(combobox);
    await userEvent.click(screen.getByRole("option", { name: "봉화" }));
    expect(useSettingsStore.getState().myUnion).toBe("봉화");

    await userEvent.click(combobox);
    await userEvent.click(screen.getByRole("option", { name: "지역 전체" }));
    expect(useSettingsStore.getState().myUnion).toBeNull();
  });

  it("지역을 정하지 않았으면 그리지 않는다", () => {
    useSettingsStore.setState({ myRegion: null });
    const { container } = renderSelector();
    expect(container).toBeEmptyDOMElement();
  });
});
