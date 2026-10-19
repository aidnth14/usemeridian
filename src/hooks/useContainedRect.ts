import { useEffect, useState, type RefObject } from 'react';

type Rect = { top: number; left: number; width: number; height: number };

// Mirrors an `object-contain` image's actual rendered box inside its container,
// so overlay content can be positioned against the real artwork, not the letterboxed frame.
export function useContainedRect(containerRef: RefObject<HTMLElement | null>, aspect: number): Rect {
  const [rect, setRect] = useState<Rect>({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const containerWidth = el.clientWidth;
      const containerHeight = el.clientHeight;
      if (!containerWidth || !containerHeight) return;

      const containerAspect = containerWidth / containerHeight;
      let width: number;
      let height: number;

      if (containerAspect > aspect) {
        height = containerHeight;
        width = height * aspect;
      } else {
        width = containerWidth;
        height = width / aspect;
      }

      setRect({
        width,
        height,
        left: (containerWidth - width) / 2,
        top: (containerHeight - height) / 2,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, aspect]);

  return rect;
}
