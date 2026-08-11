import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import AppFooter from "../AppFooter";
import { AVAILABLE_REGIONS } from "../../../const/Common";
import { REGION_ROUTE_PREFIX, regionPath } from "../../../const/Regions";
import {
  CODE_LICENSE,
  CONTACT_EMAIL,
  DATA_SOURCE,
  DISCLAIMER,
  NON_COMMERCIAL_NOTICE,
} from "../../../const/Site";

/** 지역 링크가 RouterLink라 라우터 컨텍스트가 필요하다 */
const renderFooter = () =>
  render(
    <MemoryRouter>
      <AppFooter />
    </MemoryRouter>
  );

describe("AppFooter", () => {
  it("데이터 출처를 원본 페이지 링크와 함께 노출한다", () => {
    renderFooter();

    const sourceLink = screen.getByRole("link", { name: DATA_SOURCE.name });
    expect(sourceLink).toHaveAttribute("href", DATA_SOURCE.url);
    expect(sourceLink).toHaveAttribute("target", "_blank");
  });

  it("면책 고지와 비영리 고지를 노출한다", () => {
    renderFooter();

    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByText(NON_COMMERCIAL_NOTICE)).toBeInTheDocument();
  });

  it("중단 요청 창구가 되는 연락처를 mailto 링크로 노출한다", () => {
    renderFooter();

    const contactLink = screen.getByRole("link", { name: /중단 요청/ });
    expect(contactLink).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
  });

  it("코드 라이선스 링크를 노출한다", () => {
    renderFooter();

    const licenseLink = screen.getByRole("link", {
      name: new RegExp(CODE_LICENSE.name),
    });
    expect(licenseLink).toHaveAttribute("href", CODE_LICENSE.url);
  });

  it("지역별 시세 페이지로 가는 링크를 모든 지역에 대해 노출한다", () => {
    renderFooter();

    for (const region of AVAILABLE_REGIONS) {
      expect(
        screen.getByRole("link", { name: `${region} 송이 시세` })
      ).toHaveAttribute("href", regionPath(region));
    }
  });

  it("조합 허브 페이지 링크를 노출한다", () => {
    renderFooter();

    expect(screen.getByRole("link", { name: "전체 조합 보기" })).toHaveAttribute(
      "href",
      REGION_ROUTE_PREFIX
    );
  });
});
