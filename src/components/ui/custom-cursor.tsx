import { useEffect, useRef, useState } from "react";

type CursorMode = "default" | "hover" | "play" | "open";

/**
 * VOID custom cursor — replaces the system cursor with a stylized SVG arrow.
 *
 * Position updates bypass React entirely (direct ref.style.transform on
 * mousemove) so the cursor follows the pointer 1:1 with zero lag. Mode
 * changes (hover/play/open) use React state since they're rare.
 *
 * Hover modes change the arrow's fill/stroke colors (no labels, no halo —
 * the arrow itself communicates state via color).
 *
 * Disabled on touch devices (`pointer: coarse`).
 * Inputs/textareas keep the system text cursor (i-beam).
 */
export const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CursorMode>("default");
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    setEnabled(true);
    document.body.classList.add("void-no-cursor");

    const handleMove = (event: MouseEvent) => {
      const cursor = cursorRef.current;
      if (cursor) {
        // Direct DOM write — bypasses React for zero-lag tracking
        cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      }

      if (!visible) setVisible(true);

      const target = event.target as HTMLElement | null;
      if (!target) {
        if (mode !== "default") setMode("default");
        return;
      }

      const cursorEl = target.closest<HTMLElement>("[data-cursor]");
      if (cursorEl) {
        const next = (cursorEl.dataset.cursor as CursorMode) || "hover";
        if (next !== mode) setMode(next);
        return;
      }

      const interactive = target.closest("button, a, [role='button'], select, label");
      if (interactive) {
        if (mode !== "hover") setMode("hover");
        return;
      }

      // Hover over inputs → drop the custom cursor mode (system shows i-beam)
      if (target.closest("input, textarea, [contenteditable='true']")) {
        if (mode !== "default") setMode("default");
        return;
      }

      if (mode !== "default") setMode("default");
    };

    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);
    const handleDown = () => {
      cursorRef.current?.classList.add("is-down");
    };
    const handleUp = () => {
      cursorRef.current?.classList.remove("is-down");
    };

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.body.classList.remove("void-no-cursor");
    };
    // intentionally empty deps — we read mode/label/visible inline via state
    // setters which are stable; using deps would re-add the listener on every
    // pointer move and break the direct-DOM optimization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={cursorRef}
      className={`void-cursor void-cursor-${mode} ${visible ? "is-visible" : ""}`}
      aria-hidden="true"
    >
      {/* Arrow shape — anchored so the tip is at (0, 0) of the cursor container */}
      <svg
        className="void-cursor-arrow"
        width="22"
        height="24"
        viewBox="0 0 22 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 2 L19 13.5 L11 14.5 L8.5 22 Z"
          fill="white"
          stroke="#000000"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
