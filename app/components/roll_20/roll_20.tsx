"use client";

import { useMemo, useState } from "react";

type DndDiceRollProps = {
  /** Current volume between 0 and 1 */
  value: number;
  /** Called with new volume (0–1) after each roll */
  onChange: (value: number) => void;
};

type Enemy = {
  emoji: string;
  name: string;
  str: number; // 1–20
  reward: number; // 1–5 (volume percent)
};

const ENEMIES: { emoji: string; name: string }[] = [
  { emoji: "🐀", name: "Giant Rat" },
  { emoji: "🐺", name: "Dire Wolf" },
  { emoji: "🐻", name: "Cave Bear" },
  { emoji: "🦅", name: "Sky Raptor" },
  { emoji: "🦴", name: "Skeleton Warrior" },
  { emoji: "🧟", name: "Zombie" },
  { emoji: "👹", name: "Ogre" },
  { emoji: "🐉", name: "Young Dragon" },
  { emoji: "🕷️", name: "Spider Swarm" },
  { emoji: "🦄", name: "Cursed Unicorn" },
  // Meme-style enemies
  { emoji: "🙎‍♀️", name: "Wild Karen" },
  { emoji: "🧑‍💻", name: "Overcaffeinated Dev" },
  { emoji: "🧌", name: "Comment Section Troll" },
  { emoji: "📢", name: "Corporate Buzzword Golem" },
  { emoji: "🔥", name: "Production Server On Fire" },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createRandomEnemy(): Enemy {
  const base = ENEMIES[randomInt(0, ENEMIES.length - 1)];
  return {
    ...base,
    str: randomInt(1, 20),
    reward: randomInt(1, 5),
  };
}

function clampVolume(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export function DndDiceRoll({ value, onChange }: DndDiceRollProps) {
  const [enemy, setEnemy] = useState<Enemy>(() => createRandomEnemy());
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [hasBattled, setHasBattled] = useState(false);

  const volumePercent = useMemo(
    () => Math.round(clampVolume(value) * 100),
    [value],
  );

  const handleNextEnemy = () => {
    setEnemy(createRandomEnemy());
    setLastRoll(null);
    setLastOutcome(null);
    setHasBattled(false);
  };

  const handleRoll = () => {
    if (isRolling || hasBattled) return;
    setIsRolling(true);

    const roll = randomInt(1, 20);

    setTimeout(() => {
      setLastRoll(roll);

      const enemyStr = enemy.str;
      const reward = enemy.reward;

      if (roll > enemyStr) {
        const rewardDelta = reward / 100; // 1–5% volume up
        const nextVolume = clampVolume(value + rewardDelta);
        onChange(nextVolume);
        setLastOutcome(
          `You WIN! Rolled ${roll} vs STR ${enemyStr}. Reward +${reward}% volume.`,
        );
      } else {
        const penaltyPoints = enemyStr - roll; // 0–19
        const penaltyDelta = penaltyPoints / 100; // 0–19% volume down
        const nextVolume = clampVolume(value - penaltyDelta);
        onChange(nextVolume);
        setLastOutcome(
          `You LOSE! Rolled ${roll} vs STR ${enemyStr}. Volume -${penaltyPoints}%`,
        );
      }

      setHasBattled(true);
      setIsRolling(false);
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>DnD Dice Roll volume</span>
        <span className="font-medium">{volumePercent}%</span>
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 text-xs text-zinc-100">
        <p className="mb-2 text-[11px] text-zinc-400">Encounter</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              {enemy.emoji}
            </span>
            <div>
              <p className="text-sm font-semibold">{enemy.name}</p>
              <p className="text-[11px] text-zinc-400">
                Reward {enemy.reward}% volume
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2">
            <span className="text-[10px] text-zinc-400">STR</span>
            <span className="text-xl font-bold text-zinc-100">{enemy.str}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-center">
          <div
            className={[
              "flex h-16 w-16 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-lg font-bold text-zinc-100 transition-transform",
              isRolling ? "animate-spin" : "",
            ].join(" ")}
          >
            {isRolling ? "?" : lastRoll ?? "d20"}
          </div>
        </div>
        <button
          type="button"
          onClick={hasBattled ? handleNextEnemy : handleRoll}
          disabled={isRolling}
          className="w-full rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {hasBattled ? "New Enemy" : "Roll d20"}
        </button>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-200">
          {lastRoll === null ? (
            <p className="text-[11px] text-zinc-400">
              Click &quot;Roll d20&quot; to see if you beat the enemy&apos;s
              STR.
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold">
                Your roll: <span className="font-bold">{lastRoll}</span>
              </p>
              {lastOutcome && (
                <p className="mt-1 text-[11px] text-zinc-300">{lastOutcome}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

