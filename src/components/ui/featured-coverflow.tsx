import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

type CoverflowBeat = {
  id: string;
  title: string;
  artist?: string;
  imageUrl?: string;
  bpm?: number;
};

/**
 * 3D coverflow carousel for the Featured Beats home section.
 *
 * Two distinct actions per active beat:
 *  - `onPlay(id)` — fired when the user clicks the big circular play
 *    button. The beat should preview in place on the home page.
 *  - `onOpen(id)` — fired when the user clicks the "Go To Beat" pill.
 *    Should navigate the user to the Beats section with the beat selected.
 *
 * Layout transforms based on offset from the active index:
 *  - 0  (center):  large, flat, full opacity, on top
 *  - ±1 (sides):   smaller, tilted ~28°, partial opacity, fades back
 *  - ±2 (further): smaller still, more tilted, lower opacity
 *  - ±3+:          off-screen, hidden
 *
 * Auto-advances every `autoplayMs`, pauses on hover. Side cards are
 * clickable to focus them. The center card's empty area also fires onPlay
 * so the whole thing feels tappable.
 */
export const FeaturedCoverflow = ({
  beats,
  onPlay,
  onOpen,
  playingId,
  autoplayMs = 5500,
}: {
  beats: CoverflowBeat[];
  onPlay: (id: string) => void;
  onOpen: (id: string) => void;
  playingId?: string | null;
  autoplayMs?: number;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (beats.length <= 1 || paused) return;
    const t = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % beats.length);
    }, autoplayMs);
    return () => window.clearInterval(t);
  }, [beats.length, paused, autoplayMs]);

  if (beats.length === 0) return null;

  const next = () => setActiveIndex((i) => (i + 1) % beats.length);
  const prev = () => setActiveIndex((i) => (i - 1 + beats.length) % beats.length);

  return (
    <div
      className="void-coverflow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="void-coverflow-stage" style={{ perspective: "1600px" }}>
        {beats.map((beat, index) => {
          // Shortest signed distance from active, looping around the list
          let offset = index - activeIndex;
          if (offset > beats.length / 2) offset -= beats.length;
          if (offset < -beats.length / 2) offset += beats.length;

          const abs = Math.abs(offset);
          // Cards beyond ±3 are hidden offscreen
          const visible = abs <= 3;

          const x = offset * 220;
          const rotateY = offset === 0 ? 0 : offset > 0 ? -28 : 28;
          const scale = abs === 0 ? 1.05 : abs === 1 ? 0.86 : abs === 2 ? 0.72 : 0.6;
          const opacity = abs === 0 ? 1 : abs === 1 ? 0.78 : abs === 2 ? 0.4 : 0;
          const zIndex = 100 - abs;
          const blur = abs === 0 ? 0 : abs === 1 ? 1.2 : 2.6;

          const isCenter = offset === 0;
          const isPlaying = playingId === beat.id;
          return (
            <motion.div
              key={beat.id}
              role={isCenter ? undefined : "button"}
              tabIndex={isCenter ? -1 : 0}
              onClick={() => {
                if (!isCenter) setActiveIndex(index);
              }}
              onKeyDown={(event) => {
                if (!isCenter && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  setActiveIndex(index);
                }
              }}
              animate={{
                x,
                rotateY,
                scale,
                opacity,
                filter: `blur(${blur}px)`,
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 26,
                mass: 0.9,
              }}
              style={{
                zIndex,
                pointerEvents: visible ? "auto" : "none",
                transformStyle: "preserve-3d",
                cursor: isCenter ? "default" : "pointer",
              }}
              className="void-coverflow-card"
              aria-label={beat.title}
            >
              {beat.imageUrl ? (
                <img src={beat.imageUrl} alt={beat.title} className="void-coverflow-img" />
              ) : (
                <div className="void-coverflow-fallback" />
              )}
              <div className="void-coverflow-overlay">
                {isCenter ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onPlay(beat.id);
                    }}
                    className="void-coverflow-play"
                    aria-label={isPlaying ? `Pause ${beat.title}` : `Play ${beat.title}`}
                    data-cursor="play"
                    data-cursor-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
                  </button>
                ) : null}
                <div className="void-coverflow-meta">
                  <span className="void-coverflow-title">{beat.title}</span>
                  {beat.artist ? (
                    <span className="void-coverflow-artist">{beat.artist}</span>
                  ) : null}
                  {beat.bpm ? (
                    <span className="void-coverflow-bpm">BPM {beat.bpm}</span>
                  ) : null}
                  {isCenter ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen(beat.id);
                      }}
                      className="void-coverflow-goto"
                      data-cursor="open"
                      data-cursor-label="Open"
                    >
                      Go To Beat
                      <ArrowRight size={14} />
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={prev}
        className="void-coverflow-arrow void-coverflow-arrow-left"
        aria-label="Previous beat"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={next}
        className="void-coverflow-arrow void-coverflow-arrow-right"
        aria-label="Next beat"
      >
        <ChevronRight size={22} />
      </button>

      <div className="void-coverflow-dots" aria-hidden="true">
        {beats.map((beat, index) => (
          <button
            key={beat.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`void-coverflow-dot ${index === activeIndex ? "is-active" : ""}`}
            aria-label={`Jump to ${beat.title}`}
          />
        ))}
      </div>
    </div>
  );
};
