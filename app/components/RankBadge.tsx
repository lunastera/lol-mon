import { type Rank, rankEmblemUrl } from "~/lib/rank";

export function RankBadge({ rank }: { rank: Rank }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* The emblem art is a 1280x720 frame with large transparent margins;
          show it enlarged inside a cropping viewport. */}
      <div className="relative h-44 w-60 overflow-hidden">
        <img
          src={rankEmblemUrl(rank)}
          alt={`${rank.label}のエンブレム`}
          className="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-[47%]"
          style={{
            width: 640,
            filter: `drop-shadow(0 0 24px ${rank.color}66)`,
          }}
        />
      </div>
      <span
        className="whitespace-nowrap text-xl font-black"
        style={{ color: rank.color }}
      >
        {rank.label}
      </span>
      <p className="text-sm text-gold-light/80">{rank.comment}</p>
    </div>
  );
}
