import { useEffect, type RefObject } from "react";

type AutoScrollOptions = {
  enabled?: boolean;
};

export const useAutoScroll = (
  containerRef: RefObject<HTMLDivElement | null>,
  dependencies: unknown[] = [],
  options: AutoScrollOptions = {}
) => {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [enabled, containerRef, ...dependencies]);
};
