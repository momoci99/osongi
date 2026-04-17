import { useEffect, useRef, useState } from "react";

type ContainerWidthResult = {
  containerRef: React.RefObject<HTMLDivElement>;
  width: number;
};

type ContainerSizeResult = {
  containerRef: React.RefObject<HTMLDivElement>;
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

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        setSize({
          width,
          height: height || fallbackHeight,
        });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [fallbackHeight]);

  return {
    containerRef,
    width: size.width,
    height: size.height,
  };
};
