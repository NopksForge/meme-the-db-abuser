"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ARROWS = ["←", "↓", "↑", "→"] as const;
type ArrowDir = (typeof ARROWS)[number];

const ARROW_KEYS: Record<string, ArrowDir> = {
  ArrowLeft: "←",
  ArrowDown: "↓",
  ArrowUp: "↑",
  ArrowRight: "→",
};

const SEQ_LENGTH = 6;
const HIT_ZONE_START = 0.75;
const HIT_ZONE_END = 0.9;
const BALL_SPEED_MIN = 0.25;
const BALL_SPEED_MAX = 0.75;
const VOLUME_STEP = 0.01; // +1% per correct arrow on submit; -1% on miss-all when ball loops

type AuditionProps = {
  value: number;
  onChange: (value: number) => void;
};

function randomSequence(len: number): ArrowDir[] {
  return Array.from(
    { length: len },
    () => ARROWS[Math.floor(Math.random() * ARROWS.length)],
  );
}

type SlotStatus = "correct" | "wrong" | null;

export function Audition({ value, onChange }: AuditionProps) {
  const [sequence, setSequence] = useState(() => randomSequence(SEQ_LENGTH));
  const [userIndex, setUserIndex] = useState(0);
  const [positionStatus, setPositionStatus] = useState<SlotStatus[]>(() =>
    Array(SEQ_LENGTH).fill(null),
  );
  const [ballPos, setBallPos] = useState(0);
  const [lastHit, setLastHit] = useState<"perfect" | "miss" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const rafRef = useRef<number>(0);
  const ballRef = useRef(0);
  const prevBallRef = useRef(0);
  const lastSubmitMissAllRef = useRef(false);
  const pendingOutOfZonePenaltyRef = useRef(false);
  const pendingInZoneResetRef = useRef(false);
  const spaceLockedRef = useRef(false);
  const valueRef = useRef(value);
  const positionStatusRef = useRef<SlotStatus[]>(positionStatus);
  valueRef.current = value;
  positionStatusRef.current = positionStatus;

  // Loop ball along slider; on new round, if last submit was miss-all, decrease volume
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const speed =
        BALL_SPEED_MIN + valueRef.current * (BALL_SPEED_MAX - BALL_SPEED_MIN);
      const next = (ballRef.current + speed * dt) % 1;
      const crossedLoop = ballRef.current > 0.9 && next < 0.1;
      prevBallRef.current = ballRef.current;
      ballRef.current = next;
      setBallPos(ballRef.current);

      if (crossedLoop) {
        if (pendingOutOfZonePenaltyRef.current) {
          pendingOutOfZonePenaltyRef.current = false;
          spaceLockedRef.current = false;
          onChange(Math.max(0, valueRef.current - VOLUME_STEP * SEQ_LENGTH));
          setSequence(randomSequence(SEQ_LENGTH));
          setUserIndex(0);
          setPositionStatus(Array(SEQ_LENGTH).fill(null));
        } else if (lastSubmitMissAllRef.current) {
          lastSubmitMissAllRef.current = false;
          spaceLockedRef.current = false;
          onChange(Math.max(0, valueRef.current - VOLUME_STEP));
          setSequence(randomSequence(SEQ_LENGTH));
          setUserIndex(0);
          setPositionStatus(Array(SEQ_LENGTH).fill(null));
        } else if (pendingInZoneResetRef.current) {
          pendingInZoneResetRef.current = false;
          spaceLockedRef.current = false;
          setSequence(randomSequence(SEQ_LENGTH));
          setUserIndex(0);
          setPositionStatus(Array(SEQ_LENGTH).fill(null));
        } else if (!spaceLockedRef.current) {
          // User never hit space this round: apply full-round miss penalty
          const newVolume = Math.max(
            0,
            valueRef.current - VOLUME_STEP * SEQ_LENGTH,
          );
          onChange(newVolume);
          setLastHit("miss");
          setFeedback(
            `No submission that round — volume -${VOLUME_STEP * SEQ_LENGTH * 100}% (now ${Math.round(
              newVolume * 100,
            )}%).`,
          );
          setSequence(randomSequence(SEQ_LENGTH));
          setUserIndex(0);
          setPositionStatus(Array(SEQ_LENGTH).fill(null));
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key;
      if (key === " ") {
        if (spaceLockedRef.current) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        const inZone =
          ballRef.current >= HIT_ZONE_START && ballRef.current <= HIT_ZONE_END;
        if (inZone) {
          const correctCount = positionStatusRef.current.filter(
            (s) => s === "correct",
          ).length;
          const newVolume = Math.min(
            1,
            valueRef.current + correctCount * VOLUME_STEP,
          );
          onChange(newVolume);
          lastSubmitMissAllRef.current = correctCount === 0;
          setLastHit(correctCount > 0 ? "perfect" : "miss");
          setFeedback(
            correctCount > 0
              ? `${correctCount} arrow${correctCount !== 1 ? "s" : ""} correct → +${correctCount * (VOLUME_STEP * 100)}% volume (now ${Math.round(newVolume * 100)}%)`
              : "Miss all — no arrows correct. Volume -6% on next ball loop.",
          );
          spaceLockedRef.current = true;
          pendingInZoneResetRef.current = true;
        } else {
          spaceLockedRef.current = true;
          pendingOutOfZonePenaltyRef.current = true;
          setPositionStatus(Array(SEQ_LENGTH).fill("wrong"));
          setLastHit("miss");
          setFeedback(
            `Too early/late! All red — volume -${VOLUME_STEP * SEQ_LENGTH * 100}% on next ball loop.`,
          );
        }
        return;
      }
      const expected = ARROW_KEYS[key];
      if (!expected) return;
      e.preventDefault();
      if (userIndex >= sequence.length) return; // already filled all slots
      const correct = sequence[userIndex] === expected;
      setPositionStatus((status) => {
        const next = [...status];
        next[userIndex] = correct ? "correct" : "wrong";
        return next;
      });
      setUserIndex((i) => Math.min(i + 1, sequence.length));
    },
    [sequence, userIndex, onChange],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [handleKeyDown]);

  const clearFeedback = useCallback(() => {
    setLastHit(null);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (feedback === null) return;
    const t = setTimeout(clearFeedback, 2000);
    return () => clearTimeout(t);
  }, [feedback, clearFeedback]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Audition — back to the 90's
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Volume: {Math.round(value * 100)}%
        </p>
      </div>


      {/* System arrow sequence */}
      <div className="rounded-xl border border-zinc-300 bg-zinc-200/80 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800/80">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Match this
        </p>

        {/* Timing slider with ball */}
        <div className="relative h-10 w-full rounded-full bg-zinc-300 dark:bg-zinc-700">
          {/* Hit zone */}
          <div
            className="absolute top-0 h-full rounded-full bg-emerald-500/40 dark:bg-emerald-500/30"
            style={{
              left: `${HIT_ZONE_START * 100}%`,
              width: `${(HIT_ZONE_END - HIT_ZONE_START) * 100}%`,
            }}
          />
          {/* Ball */}
          <div
            className="absolute top-1/2 h-6 w-6 -translate-y-1/2 -translate-x-1/2 rounded-full bg-amber-400 shadow-md dark:bg-amber-500"
            style={{ left: `${ballPos * 100}%` }}
          />
        </div>


        <div className="flex justify-center gap-2 mt-4">
          {sequence.map((arrow, i) => (
            <span
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold ${
                positionStatus[i] === "correct"
                  ? "bg-emerald-500/60 text-emerald-800 dark:bg-emerald-400/70 dark:text-emerald-100"
                  : positionStatus[i] === "wrong"
                    ? "bg-red-500/60 text-red-800 dark:bg-red-400/70 dark:text-red-100"
                    : "bg-zinc-300 text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200"
              }`}
            >
              {arrow}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
          Use arrow keys. Score counts only green. Progress: {userIndex}/
          {sequence.length}
        </p>
      </div>

      {/* Toast notification */}
      {feedback && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
          <div
            className={`pointer-events-auto max-w-xs rounded-lg border px-4 py-3 text-center text-xs shadow-lg backdrop-blur ${
              lastHit === "perfect"
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
                : "border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-200"
            }`}
          >
            {feedback}
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-zinc-500 dark:text-zinc-400">
        Match arrows in order with ← ↓ ↑ → then press space when the ball is in
        the green zone.
      </p>
    </div>
  );
}
