import { cn } from "@/lib/utils";

/**
 * Base shimmering skeleton block — peach shimmer on faint white bg.
 * Uses the .void-skel class defined in index.css.
 *
 * Usage:
 *   <VoidSkel className="h-5 w-32" />
 *   <VoidSkel className="aspect-square w-full" />
 */
export const VoidSkel = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => <div className={cn("void-skel", className)} style={style} aria-hidden="true" />;

/**
 * Skeleton matching the dimensions/feel of a beat card.
 * Drop in while beats data is loading.
 */
export const VoidBeatCardSkeleton = () => (
  <div className="flex h-full flex-col gap-3 rounded-[18px] border border-white/8 bg-[#0b0b0e]/60 p-3">
    <VoidSkel className="aspect-square w-full" />
    <VoidSkel className="h-5 w-3/4" />
    <VoidSkel className="h-4 w-1/2" />
    <div className="mt-auto flex gap-2 pt-2">
      <VoidSkel className="h-9 w-9 rounded-full" />
      <VoidSkel className="h-9 flex-1" />
      <VoidSkel className="h-9 flex-1" />
    </div>
  </div>
);

/**
 * Full grid of beat card skeletons matching the actual grid layout.
 * Defaults to 8 placeholders.
 */
export const VoidBeatGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
    {Array.from({ length: count }).map((_, i) => (
      <VoidBeatCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Horizontal scroller of skeletons for featured/marquee sections.
 */
export const VoidBeatScrollerSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-hidden pb-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="min-w-[285px] max-w-[320px] flex-none">
        <VoidBeatCardSkeleton />
      </div>
    ))}
  </div>
);
