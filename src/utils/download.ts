/** UTF-8 BOM — Excel이 한글 CSV를 깨뜨리지 않게 한다 */
const UTF8_BOM = "﻿";

/** PNG 내보내기 배율 (고해상도 화면 대응) */
const PNG_SCALE = 2;

/** Blob을 파일로 내려받는다 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** CSV 문자열을 내려받는다 */
export const downloadCsv = (content: string, filename: string) =>
  downloadBlob(new Blob([UTF8_BOM + content], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);

/**
 * SVG 차트를 배경색을 깐 PNG로 내려받는다.
 * SVG에 폰트가 포함되지 않으므로 시스템 한글 폰트로 렌더된다.
 */
export const downloadSvgAsPng = (svg: SVGSVGElement, backgroundColor: string, filename: string) => {
  const width = Number(svg.getAttribute("width")) || svg.getBoundingClientRect().width;
  const height = Number(svg.getAttribute("height")) || svg.getBoundingClientRect().height;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("font-family", getComputedStyle(document.body).fontFamily);

  const svgUrl = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" }),
  );
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * PNG_SCALE);
    canvas.height = Math.round(height * PNG_SCALE);
    const context = canvas.getContext("2d");
    if (context) {
      context.scale(PNG_SCALE, PNG_SCALE);
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${filename}.png`);
      }, "image/png");
    }
    URL.revokeObjectURL(svgUrl);
  };
  image.src = svgUrl;
};
