import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AppFooter from "../AppFooter";
import {
  CODE_LICENSE,
  CONTACT_EMAIL,
  DATA_SOURCE,
  DISCLAIMER,
  NON_COMMERCIAL_NOTICE,
} from "../../../const/Site";

describe("AppFooter", () => {
  it("데이터 출처를 원본 페이지 링크와 함께 노출한다", () => {
    render(<AppFooter />);

    const sourceLink = screen.getByRole("link", { name: DATA_SOURCE.name });
    expect(sourceLink).toHaveAttribute("href", DATA_SOURCE.url);
    expect(sourceLink).toHaveAttribute("target", "_blank");
  });

  it("면책 고지와 비영리 고지를 노출한다", () => {
    render(<AppFooter />);

    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByText(NON_COMMERCIAL_NOTICE)).toBeInTheDocument();
  });

  it("중단 요청 창구가 되는 연락처를 mailto 링크로 노출한다", () => {
    render(<AppFooter />);

    const contactLink = screen.getByRole("link", { name: /중단 요청/ });
    expect(contactLink).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
  });

  it("코드 라이선스 링크를 노출한다", () => {
    render(<AppFooter />);

    const licenseLink = screen.getByRole("link", {
      name: new RegExp(CODE_LICENSE.name),
    });
    expect(licenseLink).toHaveAttribute("href", CODE_LICENSE.url);
  });
});
