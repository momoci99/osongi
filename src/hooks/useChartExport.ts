import { useCallback } from "react";

/** SVG 차트를 2× 해상도 PNG로 내보낸다 */
export const useChartExport = (
  svgRef: React.RefObject<SVGSVGElement | null>,
  backgroundColor = "#ffffff",
) => {
  const exportToPng = useCallback(
    (filename: string) => {
      const svg = svgRef.current;
      if (!svg) return;

      const bbox = svg.getBoundingClientRect();
      const width = bbox.width || Number(svg.getAttribute("width") ?? 800);
      const height = bbox.height || Number(svg.getAttribute("height") ?? 400);

      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.scale(scale, scale);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
        }, "image/png");

        URL.revokeObjectURL(svgUrl);
      };
      img.src = svgUrl;
    },
    [svgRef, backgroundColor],
  );

  return { exportToPng };
};
