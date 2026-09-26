import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../theme";
import NarrowScreenNotice from "../NarrowScreenNotice";

const renderNotice = (onProceed = vi.fn()) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <NarrowScreenNotice onProceed={onProceed} />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe("NarrowScreenNotice", () => {
  it("모바일에서 볼 곳(대시보드·지역 시세)으로 안내한다", () => {
    renderNotice();
    expect(screen.getByRole("link", { name: /오늘 시세/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /지역별 시세/ })).toHaveAttribute("href", "/region");
  });

  it("그래도 보기를 누르면 분석 도구를 연다", async () => {
    const onProceed = vi.fn();
    renderNotice(onProceed);
    await userEvent.click(screen.getByRole("button", { name: "그래도 분석 도구 보기" }));
    expect(onProceed).toHaveBeenCalledOnce();
  });
});
