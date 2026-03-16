"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type HoldCarProps = {
  value: number;
  onChange: (value: number) => void;
};

const MAX_HOLD_S = 2.5;
const MAX_SPEED = 420;
const DECELERATION = 180;
const BASE_MAX_DISTANCE_PX = 420; // 100% volume; past this = mute
const MUTE_ZONE_PX = 80;
// Scale labels: positions = (pct / 100) * MAX_DISTANCE_PX
const SCALE_PERCENTS = [0, 25, 50, 75, 100] as const;

export function HoldCar({ value, onChange }: HoldCarProps) {
  const [holding, setHolding] = useState(false);
  const [holdStart, setHoldStart] = useState<number | null>(null);
  const [holdTick, setHoldTick] = useState(0); // force re-render while holding for smooth color
  const [position, setPosition] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [maxDistancePx, setMaxDistancePx] = useState(BASE_MAX_DISTANCE_PX);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const holdRafRef = useRef<number>(0);
  const mutedByOvershootRef = useRef(false); // only show "Mute" when user rolled past 100%

  const trackWidthPx = maxDistancePx + MUTE_ZONE_PX;

  const chargePercent =
    holdStart && holding
      ? Math.min(100, ((Date.now() - holdStart) / 1000 / MAX_HOLD_S) * 100)
      : 0;

  // Re-render every frame while holding so color updates smoothly
  useEffect(() => {
    if (!holding || holdStart === null) return;
    const tick = () => {
      setHoldTick((t) => t + 1);
      holdRafRef.current = requestAnimationFrame(tick);
    };
    holdRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(holdRafRef.current);
  }, [holding, holdStart]);

  const startHold = useCallback(() => {
    if (isMoving) return;
    setHolding(true);
    setHoldStart(Date.now());
  }, [isMoving]);

  const driveRef = useRef({ position: 0, speed: 0 });

  const releaseHold = useCallback(() => {
    if (!holding || holdStart === null) return;
    const holdDurationMs = Date.now() - holdStart;
    const holdDurationS = Math.min(MAX_HOLD_S, holdDurationMs / 1000);
    const initialSpeed = (holdDurationS / MAX_HOLD_S) * MAX_SPEED;
    setHolding(false);
    setHoldStart(null);
    setSpeed(initialSpeed);
    setPosition(0);
    driveRef.current = { position: 0, speed: initialSpeed };
    lastTimeRef.current = performance.now();
    setIsMoving(true);
  }, [holding, holdStart]);

  // Responsively adjust max travel distance based on container width
  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;

    const updateMaxDistance = (width: number) => {
      // Use the full inner width of the card (minus the `left-4 right-4` padding)
      // so the road + mute zone fill the track with no extra gap.
      const innerWidth = Math.max(0, width - 32); // 16px left + 16px right
      const clampedInner = Math.max(
        200,
        Math.min(BASE_MAX_DISTANCE_PX + MUTE_ZONE_PX, innerWidth)
      );
      const nextMaxDistance = Math.max(120, clampedInner - MUTE_ZONE_PX);

      setMaxDistancePx(nextMaxDistance);
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === el) {
          updateMaxDistance(entry.contentRect.width);
        }
      }
    });

    observer.observe(el);
    // Initialize immediately with the current width.
    updateMaxDistance(el.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isMoving) return;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      const { position: p, speed: s } = driveRef.current;

      if (s <= 0) {
        const volume = p <= maxDistancePx ? p / maxDistancePx : 0;
        mutedByOvershootRef.current = volume === 0;
        onChange(volume);
        setIsMoving(false);
        return;
      }

      const newSpeed = Math.max(0, s - DECELERATION * dt);
      const newPosition = p + s * dt;
      driveRef.current = { position: newPosition, speed: newSpeed };
      setPosition(newPosition);
      setSpeed(newSpeed);

      if (newSpeed <= 0) {
        const volume =
          newPosition <= maxDistancePx ? newPosition / maxDistancePx : 0;
        mutedByOvershootRef.current = volume === 0;
        onChange(volume);
        setIsMoving(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isMoving, maxDistancePx, onChange]);

  const displayPosition = isMoving ? position : 0;
  const isMuted =
    isMoving
      ? position > maxDistancePx
      : value === 0 && mutedByOvershootRef.current;
  const volumePercent = isMoving
    ? position <= maxDistancePx
      ? (position / maxDistancePx) * 100
      : 0
    : value * 100;
  const volumeInt = Math.round(volumePercent);

  // Charge: 0% green (120) -> ~33% yellow (60) -> ~66% orange (30) -> 100% red (0)
  const chargeHue =
    holdStart && holding ? 120 * (1 - chargePercent / 100) : 0;
  const buttonChargeStyle =
    holding && !isMoving
      ? {
          backgroundColor: `hsl(${chargeHue}, 75%, 48%)`,
          color: "white",
          transition: "background-color 0.08s ease-out",
        }
      : undefined;

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Hold the button to charge, release to launch.
      </p>

      <div
        ref={containerRef}
        className="relative h-28 overflow-visible rounded-xl bg-zinc-200/80 dark:bg-zinc-700/50 px-3 py-2"
      >
        {/* Road: volume zone (0–100%) + mute zone */}
        <div className="absolute bottom-8 left-5 right-5 flex">
          <div
            className="relative h-2 rounded-l-full bg-zinc-400/50 dark:bg-zinc-600/50"
            style={{ width: maxDistancePx }}
          />
          <div
            className="h-2 rounded-r-full bg-red-400/60 dark:bg-red-600/50"
            style={{ width: MUTE_ZONE_PX }}
            title="Past 100% = mute"
          />
        </div>
        {/* Scale ticks and labels: positions from MAX_DISTANCE_PX */}
        <div className="absolute bottom-0 left-5 flex text-[10px] text-zinc-500 dark:text-zinc-400">
          {SCALE_PERCENTS.map((pct) => (
            <div
              key={pct}
              className="absolute flex flex-col items-center -translate-x-1/2"
              style={{ left: (pct / 100) * maxDistancePx }}
            >
              <div className="w-px h-1.5 bg-zinc-500 dark:bg-zinc-500" />
              <span className="mt-0.5 font-medium">{pct}%</span>
            </div>
          ))}
          <div
            className="absolute flex flex-col items-center -translate-x-1/2"
            style={{ left: maxDistancePx + MUTE_ZONE_PX / 2 }}
          >
            <div className="w-px h-1.5 bg-red-500 dark:bg-red-500" />
            <span className="mt-0.5 font-medium text-red-600 dark:text-red-400">Mute</span>
          </div>
        </div>
        {/* Car */}
        <div
          className="absolute bottom-10 transition-none"
          style={{
            left: 20 + Math.min(displayPosition, trackWidthPx),
            transform: "translateX(0)",
          }}
        >
          <span
            className="text-3xl inline-block"
            role="img"
            aria-label="car"
            style={{ transform: "scaleX(-1)" }}
          >
            🚗
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={releaseHold}
          onMouseLeave={releaseHold}
          onTouchStart={(e) => {
            e.preventDefault();
            startHold();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            releaseHold();
          }}
          disabled={isMoving}
          style={buttonChargeStyle}
          className={[
            "mt-6 touch-none select-none rounded-2xl px-10 py-4 text-lg font-semibold shadow-lg transition focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:opacity-70",
            holding && !isMoving ? "scale-105" : "",
            !holding && !isMoving
              ? "bg-zinc-700 text-zinc-100 hover:bg-zinc-600 dark:bg-zinc-600 dark:hover:bg-zinc-500"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {holding && !isMoving ? "Hold…" : isMoving ? "Rolling…" : "Hold to charge"}
        </button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Volume: {isMuted ? "Mute" : `${volumeInt}%`}
        </p>
      </div>
    </div>
  );
}
