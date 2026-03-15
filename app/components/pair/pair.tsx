"use client";

import { useCallback, useMemo, useState } from "react";

type PairProps = {
  value: number;
  onChange: (value: number) => void;
};

type CardState = {
  id: number;
  value: number;
  revealed: boolean;
  removed: boolean;
};

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createInitialCards(): CardState[] {
  const pairs = Array.from({ length: 101 }, (_, n) => [n, n]).flat();
  const shuffled = shuffle(pairs);
  return shuffled.map((value, index) => ({
    id: index,
    value,
    revealed: false,
    removed: false,
  }));
}

const FLIP_BACK_DELAY_MS = 800;

export function Pair({ value, onChange }: PairProps) {
  const [cards, setCards] = useState<CardState[]>(createInitialCards);
  const [locked, setLocked] = useState(false);

  const revealedIds = useMemo(
    () => cards.filter((c) => c.revealed && !c.removed).map((c) => c.id),
    [cards],
  );
  const revealedCount = revealedIds.length;

  const handleCardClick = useCallback(
    (id: number) => {
      if (locked) return;
      const card = cards.find((c) => c.id === id);
      if (!card || card.removed || card.revealed) return;
      if (revealedCount >= 2) return;

      const nextRevealed = cards.map((c) =>
        c.id === id ? { ...c, revealed: true } : c,
      );
      setCards(nextRevealed);

      const newRevealedCount = revealedCount + 1;
      if (newRevealedCount !== 2) return;

      const [firstId, secondId] = [...revealedIds, id];
      const first = nextRevealed.find((c) => c.id === firstId);
      const second = nextRevealed.find((c) => c.id === secondId);
      if (!first || !second) return;

      if (first.value === second.value) {
        setLocked(true);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, revealed: false, removed: true }
                : c,
            ),
          );
          onChange(first.value / 100);
          setLocked(false);
        }, 300);
      } else {
        setLocked(true);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, revealed: false }
                : c,
            ),
          );
          setLocked(false);
        }, FLIP_BACK_DELAY_MS);
      }
    },
    [cards, locked, onChange, revealedCount, revealedIds],
  );

  const handleReset = useCallback(() => {
    setCards(createInitialCards());
    setLocked(false);
  }, []);

  const remaining = cards.filter((c) => !c.removed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Finding pairs 👯‍♀️
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          reset board
        </button>
      </div>
      <div className="grid grid-cols-12 gap-1.5 sm:grid-cols-14">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            disabled={card.removed || locked}
            onClick={() => handleCardClick(card.id)}
            className={[
              "aspect-square select-none rounded-lg border text-[10px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-zinc-500",
              card.removed
                ? "invisible border-transparent bg-transparent"
                : card.revealed
                  ? "border-zinc-400 bg-amber-100 text-zinc-800 dark:border-zinc-500 dark:bg-amber-900/40 dark:text-zinc-100"
                  : "border-zinc-300 bg-zinc-200 text-zinc-500 hover:bg-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600",
            ].join(" ")}
          >
            {card.removed ? "" : card.revealed ? card.value : "?"}
          </button>
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-center text-xs text-zinc-400">
          {remaining} cards left
        </p>
      )}
      {remaining === 0 && (
        <p className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-300">
          All pairs matched. Volume: {Math.round(value * 100)}%
        </p>
      )}
    </div>
  );
}
