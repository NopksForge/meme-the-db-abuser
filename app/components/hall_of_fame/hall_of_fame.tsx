import type { SliderMode } from "../modes/config";
import Image from "next/image";
import { HALL_OF_FAME_LIST } from "./list";

type HallOfFameProps = {
  mode: SliderMode;
};

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function HallOfFame({ mode }: HallOfFameProps) {
  const items = HALL_OF_FAME_LIST.filter((entry) => entry.mode === mode);
  if (items.length === 0) return null;

  return (
    <section className="w-full max-w-xl space-y-2">
      {items.map((item, index) => (
        <div
          key={`${item.mode}-${item.username}-${item.achievementName}-${index}`}
          className="flex items-center gap-2 rounded-lg border border-emerald-300/50 bg-emerald-50/70 px-3 py-2 shadow-sm dark:bg-linear-to-r dark:from-black dark:via-black dark:to-emerald-700 dark:bg-zinc-900"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-emerald-200 dark:border-emerald-500/40">
            <Image
              src={item.pic}
              alt={`${item.username} achievement`}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-zinc-900 dark:text-emerald-100">
              {item.achievementName}
            </p>
            <p className="line-clamp-1 text-[11px] text-zinc-600 dark:text-zinc-200/90">
              <i>{item.description}</i>
            </p>

            <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500 dark:text-emerald-200/80">
              <span>@{item.username}</span>
              <span>{formatDate(item.achievedAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
