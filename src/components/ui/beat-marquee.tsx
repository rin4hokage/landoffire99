import { Play } from "lucide-react";

type MarqueeBeat = {
  id: string;
  title: string;
  artist?: string;
  imageUrl?: string;
  bpm?: number;
};

/**
 * Infinite-scrolling row of beat cover thumbnails.
 *
 * Renders the beat list TWICE in a single track and animates translateX
 * from 0 → -50% so the loop is seamless. Pauses on hover. Items are
 * clickable — onSelect fires with the beat id (deduped from doubled list).
 *
 * Place full-bleed beneath the hero. Styling lives in index.css under
 * `.void-marquee` so layout tweaks don't require touching the JSX.
 */
export const BeatMarquee = ({
  beats,
  onSelect,
  speedSeconds = 50,
}: {
  beats: MarqueeBeat[];
  onSelect: (id: string) => void;
  speedSeconds?: number;
}) => {
  if (beats.length === 0) return null;
  // Duplicate so the loop is seamless
  const items = [...beats, ...beats];
  return (
    <div className="void-marquee" aria-label="Featured beats marquee">
      <div
        className="void-marquee-track"
        style={{ animationDuration: `${speedSeconds}s` }}
      >
        {items.map((beat, idx) => (
          <button
            key={`${beat.id}-${idx}`}
            type="button"
            onClick={() => onSelect(beat.id)}
            className="void-marquee-item"
            aria-label={`Open ${beat.title}`}
            data-cursor="open"
            data-cursor-label="Open"
          >
            {beat.imageUrl ? (
              <img src={beat.imageUrl} alt={beat.title} loading="lazy" />
            ) : (
              <div className="void-marquee-item-fallback" aria-hidden="true" />
            )}
            <div className="void-marquee-item-overlay">
              <span className="void-marquee-item-play" aria-hidden="true">
                <Play size={18} fill="currentColor" />
              </span>
              <div className="void-marquee-item-meta">
                <span className="void-marquee-item-title">{beat.title}</span>
                {beat.bpm ? (
                  <span className="void-marquee-item-bpm">BPM {beat.bpm}</span>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
