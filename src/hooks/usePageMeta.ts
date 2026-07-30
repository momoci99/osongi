import { useEffect } from "react";
import { toCanonicalUrl, type PageMeta } from "../const/Seo";

/**
 * name 속성으로 식별되는 메타 태그 (description, twitter:*)
 */
const setNamedMeta = (name: string, content: string): void => {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`
  );
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

/**
 * property 속성으로 식별되는 Open Graph 태그
 */
const setPropertyMeta = (property: string, content: string): void => {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`
  );
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

/**
 * canonical 링크
 */
const setCanonical = (url: string): void => {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
};

/**
 * 라우트별 title·description·canonical·OG 태그를 갱신한다.
 *
 * CSR SPA라 index.html의 정적 메타가 모든 라우트에 그대로 적용된다.
 * 크롤러가 JS 실행 후 읽는 값을 페이지에 맞게 바꿔야 라우트가 개별 색인되고,
 * canonical이 잘못된 URL을 가리키는 것도 막을 수 있다.
 */
const usePageMeta = (meta: PageMeta): void => {
  const { title, description, path } = meta;

  useEffect(function syncPageMeta() {
    const canonicalUrl = toCanonicalUrl(path);

    document.title = title;
    setNamedMeta("description", description);
    setCanonical(canonicalUrl);

    setPropertyMeta("og:title", title);
    setPropertyMeta("og:description", description);
    setPropertyMeta("og:url", canonicalUrl);

    setNamedMeta("twitter:title", title);
    setNamedMeta("twitter:description", description);
  }, [title, description, path]);
};

export default usePageMeta;
