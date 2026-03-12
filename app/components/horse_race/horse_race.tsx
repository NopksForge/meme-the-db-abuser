import { useEffect, useRef, useState } from "react";

type HorseRaceProps = {
  value: number;
  onChange: (value: number) => void;
};

const HORSES = [1, 2, 3, 4, 5];

const HORSE_NAMES: Record<number, string> = {
  1: "Hayate", // 疾風
  2: "Kaminari", // 雷
  3: "Sakura", // 桜
  4: "Ryusei", // 流星
  5: "Fuji", // 富士
};

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function HorseRace({ value, onChange }: HorseRaceProps) {
  const [selectedHorse, setSelectedHorse] = useState<number>(HORSES[0]);
  const [bet, setBet] = useState<string>("");
  const [isRacing, setIsRacing] = useState(false);
  const [results, setResults] = useState<number[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number[]>(() =>
    HORSES.map(() => 0),
  );
  const raceIntervalRef = useRef<number | null>(null);
  const hasFinishedRef = useRef(false);
  const finishOrderRef = useRef<number[]>([]);

  const finishRace = (order: number[], betValue: number) => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    setResults(order);

    const position = order.indexOf(selectedHorse); // 0-based (0 = first)
    const betVolume = Math.min(1, Math.max(0, betValue / 100));
    let newVolume = value;

    if (position === 0) {
      newVolume = betVolume;
      setMessage(
        `Your horse won! Volume set to ${Math.round(newVolume * 100)}%.`,
      );
    } else {
      const penaltyFactors = [0, 0.25, 0.5, 0.75, 1];
      const factor = penaltyFactors[position] ?? 1;
      const penaltyAmount = betVolume * factor;
      newVolume = Math.max(0, value - penaltyAmount);

      const penaltyPercent = Math.round(factor * 100);
      setMessage(
        `Your horse finished #${position + 1}. Volume decreased by ${penaltyPercent}%.`,
      );
    }

    onChange(newVolume);
    setIsRacing(false);

    if (raceIntervalRef.current !== null) {
      window.clearInterval(raceIntervalRef.current);
      raceIntervalRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (raceIntervalRef.current !== null) {
        window.clearInterval(raceIntervalRef.current);
      }
    },
    [],
  );

  const handleRace = () => {
    setError(null);
    setMessage(null);
    setResults(null);
    setProgress(HORSES.map(() => 0));
    hasFinishedRef.current = false;
    finishOrderRef.current = [];

    const betValue = Number.parseInt(bet, 10);
    if (Number.isNaN(betValue) || betValue < 0 || betValue > 50) {
      setError("Bet must be an integer between 0 and 50.");
      return;
    }

    if (!HORSES.includes(selectedHorse)) {
      setError("Please pick a horse.");
      return;
    }

    setIsRacing(true);

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev.map((p, index) => {
          if (p >= 100) return 100;
          const delta = 0.5 + Math.random() * 2.5;
          const updated = Math.min(100, p + delta);

          if (
            updated >= 100 &&
            !finishOrderRef.current.includes(HORSES[index])
          ) {
            finishOrderRef.current.push(HORSES[index]);
          }

          return updated;
        });

        if (
          finishOrderRef.current.length === HORSES.length &&
          !hasFinishedRef.current
        ) {
          finishRace([...finishOrderRef.current], betValue);
        }

        return next;
      });
    }, 80);

    raceIntervalRef.current = interval;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          Horse Race
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Pick a horse, bet , GO! 🐎 Win = volume up! Lose = RIP volume.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Race track
        </p>
        <div className="space-y-1">
          {HORSES.map((horse, index) => {
            const laneProgress = progress[index] ?? 0;
            const isPlayerHorse = horse === selectedHorse;
            return (
              <div
                key={horse}
                className={[
                  "flex items-center gap-2 text-[11px]",
                  isPlayerHorse ? "text-emerald-300" : "text-zinc-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-14 text-right font-medium",
                    isPlayerHorse ? "text-emerald-400" : "text-zinc-500",
                  ].join(" ")}
                >
                  {HORSE_NAMES[horse]}
                </span>
                <button
                  type="button"
                  disabled={isRacing}
                  onClick={() => {
                    setSelectedHorse(horse);
                    setResults(null);
                    setMessage(null);
                  }}
                  className={[
                    "relative h-6 flex-1 overflow-hidden rounded-full border text-left transition",
                    "bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900",
                    "shadow-sm",
                    isPlayerHorse
                      ? "border-emerald-500/80 shadow-[0_0_0_2px_rgba(74,222,128,0.35)]"
                      : "border-zinc-800/80",
                    !isRacing
                      ? "cursor-pointer hover:border-emerald-400/70 hover:shadow-[0_0_0_1px_rgba(74,222,128,0.35)]"
                      : "cursor-default opacity-80",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "h-full rounded-full transition-[width] duration-700 ease-out",
                      isPlayerHorse
                        ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-300"
                        : "bg-gradient-to-r from-zinc-600 via-zinc-500 to-zinc-400",
                    ].join(" ")}
                    style={{ width: `${laneProgress}%` }}
                  />
                  <span
                    className="pointer-events-none absolute text-xl -top-0.5 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]"
                    style={{
                      left: `calc(${laneProgress}% - 0.6rem)`,
                      transform: "scaleX(-1)",
                      display: "inline-block",
                    }}
                  >
                    🐎
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-400">
          Bet (0-50)
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            disabled={isRacing}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none ring-0 focus:border-emerald-500"
          />
        </label>

        <button
          type="button"
          onClick={handleRace}
          disabled={isRacing}
          className="rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-800"
        >
          {isRacing ? "Racing..." : "Start race"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      {results && (
        <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-xs">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Race results
          </p>
          <ol className="space-y-1">
            {results.map((horse, index) => {
              const isPlayerHorse = horse === selectedHorse;
              return (
                <li
                  key={horse}
                  className={[
                    "flex items-center justify-between rounded px-2 py-1",
                    isPlayerHorse
                      ? "bg-emerald-500/10 text-emerald-200"
                      : "text-zinc-200",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-200">
                      {index + 1}
                    </span>
                    <span>{HORSE_NAMES[horse]}</span>
                  </span>
                  {isPlayerHorse && (
                    <span className="text-[10px] uppercase tracking-wide text-emerald-300">
                      Your pick
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {message && (
        <p className="text-xs text-zinc-300" role="status">
          {message}
        </p>
      )}

      <p className="text-[10px] text-zinc-500">
        Current volume: {Math.round(value * 100)}%
      </p>
    </div>
  );
}
