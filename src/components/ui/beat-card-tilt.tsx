import { ReactNode, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

type Props = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  dataBeatId?: string;
};

/**
 * Beat card wrapper that adds:
 *  - 3D tilt that follows the cursor (rotateX/rotateY with spring smoothing)
 *  - CSS variables (--mx, --my) so the card stylesheet can render a
 *    cursor-tracking radial glow border via ::before
 *  - Standard mount-in animation matching the previous beat card
 *
 * The visual hover effects (glow, image zoom, play scale) live in
 * index.css under .void-product-card so they apply to every beat card
 * automatically once this wrapper is in place.
 */
export const BeatCardTilt = ({
  children,
  className,
  onClick,
  onKeyDown,
  dataBeatId,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse position normalized 0..1 across the card
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Rotate up to ±6° based on cursor position. Y axis tilts on horizontal
  // mouse position; X axis tilts on vertical (inverted so the card "leans
  // toward" the cursor).
  const rotateX = useTransform(mouseY, [0, 1], [6, -6]);
  const rotateY = useTransform(mouseX, [0, 1], [-6, 6]);

  // Spring-smooth the tilt so it doesn't feel jittery
  const rotateXSpring = useSpring(rotateX, { stiffness: 220, damping: 22 });
  const rotateYSpring = useSpring(rotateY, { stiffness: 220, damping: 22 });

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (event.clientX - rect.left) / rect.width;
    const my = (event.clientY - rect.top) / rect.height;
    mouseX.set(mx);
    mouseY.set(my);
    if (ref.current) {
      ref.current.style.setProperty("--mx", `${mx * 100}%`);
      ref.current.style.setProperty("--my", `${my * 100}%`);
    }
  };

  const handleLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      data-beat-id={dataBeatId}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
        transformStyle: "preserve-3d",
        transformPerspective: 1200,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
