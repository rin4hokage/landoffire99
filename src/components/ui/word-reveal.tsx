import { motion } from "framer-motion";

/**
 * Splits a string into words and fades each one up + un-blurs in sequence
 * as the element enters the viewport. Designed for hero/bio paragraphs
 * that should feel like a "moment" rather than just text.
 *
 * Use as a drop-in replacement for a span/p body of text:
 *   <p><WordReveal text="Some long sentence here." /></p>
 */
export const WordReveal = ({
  text,
  className,
  delay = 0,
  staggerPerWord = 0.045,
}: {
  text: string;
  className?: string;
  delay?: number;
  staggerPerWord?: number;
}) => {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{
            duration: 0.6,
            delay: delay + i * staggerPerWord,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ display: "inline-block", marginRight: "0.27em" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};
