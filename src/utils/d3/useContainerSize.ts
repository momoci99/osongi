import { useEffect, useRef, useState } from "react";
import { RESIZE_DEBOUNCE_MS } from "../../const/Numbers";

type ContainerWidthResult = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  width: number;
};

type ContainerSizeResult = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
};

/**
 * 컨테이너의 너비만 ResizeObserver로 추적합니다.
 */
export const useContainerWidth = (): ContainerWidthResult => {
  const { containerRef, width } = useContainerSize();

  return { containerRef, width };
};

/**
 * 컨테이너의 너비와 높이를 ResizeObserver로 추적합니다.
 *
 * 높이를 측정할 수 없는 경우 `fallbackHeight` 값을 사용합니다.
 */
export const useContainerSize = (
  fallbackHeight = 0
): ContainerSizeResult => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: fallbackHeight });

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      const { width, height } = entry.contentRect;
      const nextHeight = height || fallbackHeight;

      /** 연속 리사이즈를 디바운스해 D3 전체 재구축 빈도를 낮춘다. */
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setSize((prev) =>
          prev.width === width && prev.height === nextHeight
            ? prev
            : { width, height: nextHeight }
        );
      }, RESIZE_DEBOUNCE_MS);
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(debounceTimer);
      resizeObserver.disconnect();
    };
  }, [fallbackHeight]);

  return {
    containerRef,
    width: size.width,
    height: size.height,
  };
};
