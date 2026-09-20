import { useEffect, useState, type RefObject } from "react";

/** 스크롤 위치가 끝에 붙었다고 볼 여유 (px) */
const EDGE_TOLERANCE = 1;

/** 가로 스크롤 영역의 양 끝 도달 여부 */
export type ScrollEdges = { start: boolean; end: boolean };

/**
 * 가로 스크롤 영역에서 더 볼 내용이 남았는지 알려준다.
 * `revision`이 바뀌면(내용 교체) 다시 잰다.
 */
const useScrollEdges = (ref: RefObject<HTMLElement | null>, revision?: unknown): ScrollEdges => {
  const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false });

  useEffect(
    function trackScrollEdges() {
      const element = ref.current;
      if (!element) return;

      const measure = () => {
        const maxScroll = element.scrollWidth - element.clientWidth;
        setEdges((previous) => {
          const next = {
            start: element.scrollLeft > EDGE_TOLERANCE,
            end: element.scrollLeft < maxScroll - EDGE_TOLERANCE,
          };
          return previous.start === next.start && previous.end === next.end ? previous : next;
        });
      };

      measure();
      element.addEventListener("scroll", measure, { passive: true });
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      /** 내용 폭이 바뀌어도 컨테이너 크기는 그대로일 수 있다 */
      if (element.firstElementChild) observer.observe(element.firstElementChild);

      return () => {
        element.removeEventListener("scroll", measure);
        observer.disconnect();
      };
    },
    [ref, revision],
  );

  return edges;
};

export default useScrollEdges;
