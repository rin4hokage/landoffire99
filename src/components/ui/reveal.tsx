import { ReactNode } from "react";
import { motion } from "framer-motion";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Disable when the section should not animate (e.g. above the fold). */
  disabled?: boolean;
};

/**
 * Wraps a section so it fades up + slightly blurs in as it scrolls into view.
 * Used site-wide on VOID ARCHIVE for the choreographed scroll feel.
 */
export const Reveal = ({ children, delay = 0, className, disabled = false }: RevealProps) => {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
