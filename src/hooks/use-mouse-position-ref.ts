import { RefObject, useEffect, useRef } from "react";

/**
 * Tracks the current mouse position via a ref (NOT React state) so reads are
 * cheap and don't trigger re-renders. Optionally relative to a container.
 *
 * Use inside an animation frame loop to read positionRef.current.{x, y}.
 *
 * Pattern from danielpetho/use-mouse-position-ref — used by the parallax
 * floating component to drive the per-frame transforms.
 */
export const useMousePositionRef = (
  containerRef?: RefObject<HTMLElement | SVGElement | null>,
) => {
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (x: number, y: number) => {
      if (containerRef && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        positionRef.current = { x: x - rect.left, y: y - rect.top };
      } else {
        positionRef.current = { x, y };
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      updatePosition(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) updatePosition(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [containerRef]);

  return positionRef;
};
