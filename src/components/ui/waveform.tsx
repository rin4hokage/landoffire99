import { CSSProperties, useMemo } from "react";

/**
 * Animated bar-style waveform.
 *
 * When `isPlaying` is true, each bar bounces with its own randomized
 * duration/delay/maxScale so the row looks organic instead of synced.
 * When false, bars sit flat at a low scale (so the row still has presence
 * as a "no audio yet" indicator).
 *
 * Used inline on beat cards to replace the static progress bar with a live
 * audio meter while the beat is previewing.
 */
export const Waveform = ({
  isPlaying,
  barCount = 44,
  className,
}: {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}) => {
  // Pre-compute random animation params per bar so the waveform looks
  // organic. Memoized on barCount only — re-randomizing on every render
  // would make the bars jitter.
  const bars = useMemo(
    () =>
      Array.from({ length: barCount }).map(() => ({
        duration: 0.55 + Math.random() * 0.6,
        delay: Math.random() * 0.7,
        maxScale: 0.45 + Math.random() * 0.55,
      })),
    [barCount],
  );

  return (
    <div className={`void-waveform ${isPlaying ? "is-playing" : ""} ${className ?? ""}`} aria-hidden="true">
      {bars.map((bar, i) => (
        <span
          key={i}
          className="void-waveform-bar"
          style={
            {
              animationDuration: `${bar.duration}s`,
              animationDelay: `${bar.delay}s`,
              "--max-scale": String(bar.maxScale),
            } as CSSProperties & { "--max-scale": string }
          }
        />
      ))}
    </div>
  );
};
