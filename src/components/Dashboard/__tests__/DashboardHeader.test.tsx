import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import { TEST_IDS } from "../../../test-ids";
import { useSettingsStore } from "../../../stores/useSettingsStore";
import DashboardHeader from "../DashboardHeader";

const renderHeader = () =>
  render(
    <ThemeProvider theme={theme}>
      <DashboardHeader
        latestDate="2026-10-05"
        isRefreshing={false}
        onRefresh={() => {}}
        inSeason
        tradedUnions={["봉화"]}
      />
    </ThemeProvider>,
  );

const regionCombobox = () =>
  screen.getByTestId(TEST_IDS.REGION_SELECT).querySelector('[role="combobox"]') as HTMLElement;

describe("DashboardHeader 지역 셀렉터", () => {
  beforeEach(() => {
    useSettingsStore.setState({ myRegion: "경북", myUnion: "봉화" });
  });

  it("전국을 고르면 지역·조합을 비우고 조합 셀렉터를 숨긴다", async () => {
    renderHeader();
    expect(screen.getByRole("combobox", { name: "조합 선택" })).toBeInTheDocument();

    await userEvent.click(regionCombobox());
    await userEvent.click(screen.getByRole("option", { name: "전국" }));

    expect(useSettingsStore.getState()).toMatchObject({ myRegion: null, myUnion: null });
    expect(regionCombobox()).toHaveTextContent("전국");
    expect(screen.queryByRole("combobox", { name: "조합 선택" })).toBeNull();
  });
});
