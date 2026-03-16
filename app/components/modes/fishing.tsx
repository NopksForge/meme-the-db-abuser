"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const MINIGAME_H = 220;
const BAR_H = 62;
const FISH_H = 24;

const GRAVITY = 340;
const LIFT_ACCEL = 700;
const MAX_FALL_V = 240;
const MAX_LIFT_V = 195;
const BOUNCE_DAMPEN = 0.35;

const MAX_CHARGE_MS = 2500;

const PROGRESS_FILL_RATE = 0.22;
const PROGRESS_DRAIN_RATE = 0.14;

// ── Types ──────────────────────────────────────────────────────────────────────

type TierKey = "junk" | "common" | "uncommon" | "rare" | "legendary";

type CatchId =
  // junk
  | "old_boot" | "soggy_sock" | "rusty_can" | "lost_airpod" | "traffic_cone"
  // common
  | "sardine" | "catfish" | "mudfish" | "herring"
  // uncommon
  | "salmon" | "sea_bass" | "rainbow_trout" | "coelacanth"
  // rare
  | "swordfish" | "hammerhead" | "anglerfish"
  // legendary
  | "great_white" | "kraken" | "leviathan";

type Phase = "idle" | "casting" | "waiting" | "bite" | "minigame" | "result";

type GameState = {
  barPos: number;
  barVel: number;
  fishPos: number;
  fishVel: number;
  fishDirTimer: number;
  progress: number;
  lastTime: number;
  holding: boolean;
};

type FishingProps = {
  value: number;
  onChange: (value: number) => void;
};

// ── Catch catalogue ────────────────────────────────────────────────────────────

type CatchDef = {
  label: string;
  emoji: string;
  tier: TierKey;
  volMin: number;
  volMax: number;
  speed: number;
  erraticity: number;
};

const CATCHES: Record<CatchId, CatchDef> = {
  // ── Junk ──────────────────────────────────────────────────────────────────
  old_boot:     { label: "Old Boot",      emoji: "👟", tier: "junk",      volMin: 0.00, volMax: 0.02, speed: 25,  erraticity: 0.5 },
  soggy_sock:   { label: "Soggy Sock",    emoji: "🧦", tier: "junk",      volMin: 0.00, volMax: 0.02, speed: 30,  erraticity: 0.6 },
  rusty_can:    { label: "Rusty Can",     emoji: "🥫", tier: "junk",      volMin: 0.00, volMax: 0.03, speed: 35,  erraticity: 0.7 },
  lost_airpod:  { label: "Lost AirPod",   emoji: "🎧", tier: "junk",      volMin: 0.00, volMax: 0.04, speed: 40,  erraticity: 0.8 },
  traffic_cone: { label: "Traffic Cone",  emoji: "🚧", tier: "junk",      volMin: 0.00, volMax: 0.05, speed: 50,  erraticity: 1.0 },
  // ── Common ────────────────────────────────────────────────────────────────
  sardine:      { label: "Sardine",       emoji: "🐟", tier: "common",    volMin: 0.15, volMax: 0.30, speed: 72,  erraticity: 1.8 },
  catfish:      { label: "Catfish",       emoji: "🐱", tier: "common",    volMin: 0.20, volMax: 0.35, speed: 82,  erraticity: 2.0 },
  mudfish:      { label: "Mudfish",       emoji: "🐸", tier: "common",    volMin: 0.25, volMax: 0.40, speed: 92,  erraticity: 2.3 },
  herring:      { label: "Herring",       emoji: "🐠", tier: "common",    volMin: 0.30, volMax: 0.45, speed: 102, erraticity: 2.5 },
  // ── Uncommon ──────────────────────────────────────────────────────────────
  salmon:       { label: "Salmon",        emoji: "🍣", tier: "uncommon",  volMin: 0.45, volMax: 0.58, speed: 125, erraticity: 3.5 },
  sea_bass:     { label: "Sea Bass",      emoji: "🎸", tier: "uncommon",  volMin: 0.50, volMax: 0.63, speed: 138, erraticity: 3.9 },
  rainbow_trout:{ label: "Rainbow Trout", emoji: "🌈", tier: "uncommon",  volMin: 0.55, volMax: 0.68, speed: 150, erraticity: 4.3 },
  coelacanth:   { label: "Coelacanth",    emoji: "🦕", tier: "uncommon",  volMin: 0.60, volMax: 0.72, speed: 158, erraticity: 4.6 },
  // ── Rare ──────────────────────────────────────────────────────────────────
  swordfish:    { label: "Swordfish",     emoji: "⚔️", tier: "rare",      volMin: 0.72, volMax: 0.84, speed: 188, erraticity: 5.5 },
  hammerhead:   { label: "Hammerhead",    emoji: "🔨", tier: "rare",      volMin: 0.78, volMax: 0.88, speed: 205, erraticity: 6.1 },
  anglerfish:   { label: "Anglerfish",    emoji: "🔦", tier: "rare",      volMin: 0.82, volMax: 0.91, speed: 220, erraticity: 6.6 },
  // ── Legendary ─────────────────────────────────────────────────────────────
  great_white:  { label: "Great White",   emoji: "🦈", tier: "legendary", volMin: 0.91, volMax: 0.96, speed: 248, erraticity: 7.5 },
  kraken:       { label: "Kraken",        emoji: "🐙", tier: "legendary", volMin: 0.95, volMax: 0.98, speed: 264, erraticity: 8.2 },
  leviathan:    { label: "Leviathan",     emoji: "🐲", tier: "legendary", volMin: 0.97, volMax: 1.00, speed: 282, erraticity: 9.0 },
};

const TIER_META: Record<TierKey, { label: string; color: string; bg: string }> = {
  junk:      { label: "Junk",      color: "text-zinc-400",   bg: "bg-zinc-500/20"   },
  common:    { label: "Common",    color: "text-blue-400",   bg: "bg-blue-500/20"   },
  uncommon:  { label: "Uncommon",  color: "text-teal-400",   bg: "bg-teal-500/20"   },
  rare:      { label: "Rare",      color: "text-violet-400", bg: "bg-violet-500/20" },
  legendary: { label: "Legendary", color: "text-amber-400",  bg: "bg-amber-500/20"  },
};

const CATCHES_BY_TIER: Record<TierKey, CatchId[]> = {
  junk:      ["old_boot", "soggy_sock", "rusty_can", "lost_airpod", "traffic_cone"],
  common:    ["sardine", "catfish", "mudfish", "herring"],
  uncommon:  ["salmon", "sea_bass", "rainbow_trout", "coelacanth"],
  rare:      ["swordfish", "hammerhead", "anglerfish"],
  legendary: ["great_white", "kraken", "leviathan"],
};

function pickTier(dist: number): TierKey {
  const r = Math.random();
  if (dist < 0.3) {
    if (r < 0.55) return "junk";
    if (r < 0.85) return "common";
    if (r < 0.97) return "uncommon";
    return "rare";
  }
  if (dist < 0.6) {
    if (r < 0.20) return "junk";
    if (r < 0.60) return "common";
    if (r < 0.85) return "uncommon";
    if (r < 0.97) return "rare";
    return "legendary";
  }
  if (dist < 0.85) {
    if (r < 0.05) return "junk";
    if (r < 0.25) return "common";
    if (r < 0.60) return "uncommon";
    if (r < 0.88) return "rare";
    return "legendary";
  }
  if (r < 0.10) return "common";
  if (r < 0.35) return "uncommon";
  if (r < 0.65) return "rare";
  return "legendary";
}

function pickCatch(dist: number): CatchId {
  const tier = pickTier(dist);
  const pool = CATCHES_BY_TIER[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Fishing({ onChange }: FishingProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [chargePercent, setChargePercent] = useState(0);
  const [castDist, setCastDist] = useState(0);
  const [waitDots, setWaitDots] = useState(0);
  const [catchId, setCatchId] = useState<CatchId>("sardine");
  const [barPos, setBarPos] = useState(MINIGAME_H / 2 - BAR_H / 2);
  const [fishPos, setFishPos] = useState(MINIGAME_H / 2 - FISH_H / 2);
  const [progress, setProgress] = useState(0.3);
  const [isHolding, setIsHolding] = useState(false);
  const [result, setResult] = useState<{ catchId: CatchId; vol: number } | "escaped" | null>(null);
  const [missedBite, setMissedBite] = useState(false);

  const chargeStartRef = useRef<number | null>(null);
  const chargeRafRef = useRef<number>(0);
  const gameRafRef = useRef<number>(0);
  const biteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biteExpire = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gsRef = useRef<GameState>({
    barPos: MINIGAME_H / 2 - BAR_H / 2,
    barVel: 0,
    fishPos: MINIGAME_H / 2 - FISH_H / 2,
    fishVel: 0,
    fishDirTimer: 0,
    progress: 0.3,
    lastTime: 0,
    holding: false,
  });

  // ── Casting: global mouse/touch-up to release ─────────────────────────────

  useEffect(() => {
    if (phase !== "casting") return;
    const release = () => {
      const start = chargeStartRef.current;
      if (start === null) return;
      cancelAnimationFrame(chargeRafRef.current);
      const dist = Math.min(1, (Date.now() - start) / MAX_CHARGE_MS);
      chargeStartRef.current = null;
      setCastDist(dist);
      setChargePercent(0);
      setMissedBite(false);
      setPhase("waiting");
      const delay = 2000 + Math.random() * 3500;
      biteTimer.current = setTimeout(() => {
        setPhase("bite");
        biteExpire.current = setTimeout(() => {
          setMissedBite(true);
          setPhase("idle");
        }, 1500);
      }, delay);
    };
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    return () => {
      window.removeEventListener("mouseup", release);
      window.removeEventListener("touchend", release);
    };
  }, [phase]);

  // ── Charge display animation ──────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "casting") return;
    const animate = () => {
      const start = chargeStartRef.current;
      if (start === null) return;
      const pct = Math.min(100, ((Date.now() - start) / MAX_CHARGE_MS) * 100);
      setChargePercent(pct);
      if (pct < 100) chargeRafRef.current = requestAnimationFrame(animate);
    };
    chargeRafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(chargeRafRef.current);
  }, [phase]);

  // ── Waiting dots ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "waiting") return;
    const id = setInterval(() => setWaitDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, [phase]);

  // ── Sync isHolding into game state ref ───────────────────────────────────

  useEffect(() => {
    gsRef.current.holding = isHolding;
  }, [isHolding]);

  // ── Mini-game loop ────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "minigame") return;
    const cfg = CATCHES[catchId];
    gsRef.current.lastTime = performance.now();

    const tick = (now: number) => {
      const gs = gsRef.current;
      const dt = Math.min(0.05, (now - gs.lastTime) / 1000);
      gs.lastTime = now;

      // Bar physics: lift when holding, gravity when not
      const accel = gs.holding ? -LIFT_ACCEL : GRAVITY;
      gs.barVel = Math.max(-MAX_LIFT_V, Math.min(MAX_FALL_V, gs.barVel + accel * dt));
      let bp = gs.barPos + gs.barVel * dt;
      if (bp + BAR_H >= MINIGAME_H) {
        bp = MINIGAME_H - BAR_H;
        gs.barVel = -Math.abs(gs.barVel) * BOUNCE_DAMPEN;
      } else if (bp <= 0) {
        bp = 0;
        gs.barVel = Math.abs(gs.barVel) * BOUNCE_DAMPEN;
      }
      gs.barPos = bp;

      // Fish: randomly changes direction based on erraticity
      gs.fishDirTimer -= dt;
      if (gs.fishDirTimer <= 0) {
        gs.fishVel =
          (Math.random() > 0.5 ? 1 : -1) * cfg.speed * (0.5 + Math.random() * 0.8);
        gs.fishDirTimer = 0.12 + Math.random() * (1.4 / cfg.erraticity);
      }
      let fp = gs.fishPos + gs.fishVel * dt;
      if (fp <= 0) {
        fp = 0;
        gs.fishVel = Math.abs(gs.fishVel);
      }
      if (fp + FISH_H >= MINIGAME_H) {
        fp = MINIGAME_H - FISH_H;
        gs.fishVel = -Math.abs(gs.fishVel);
      }
      gs.fishPos = fp;

      // Progress: fills when fish center is inside the bar, drains otherwise
      const fishCenter = fp + FISH_H / 2;
      const inBar = fishCenter >= bp && fishCenter <= bp + BAR_H;
      gs.progress = Math.max(
        0,
        Math.min(1, gs.progress + (inBar ? PROGRESS_FILL_RATE : -PROGRESS_DRAIN_RATE) * dt)
      );

      setBarPos(bp);
      setFishPos(fp);
      setProgress(gs.progress);

      if (gs.progress >= 1) {
        const vol = cfg.volMin + Math.random() * (cfg.volMax - cfg.volMin);
        onChange(vol);
        setResult({ catchId, vol });
        setPhase("result");
        return;
      }
      if (gs.progress <= 0) {
        setResult("escaped");
        setPhase("result");
        return;
      }
      gameRafRef.current = requestAnimationFrame(tick);
    };

    gameRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(gameRafRef.current);
  }, [phase, catchId, onChange]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleCastStart = useCallback(() => {
    if (phase !== "idle") return;
    chargeStartRef.current = Date.now();
    setChargePercent(0);
    setPhase("casting");
  }, [phase]);

  const handleBite = useCallback(() => {
    if (phase !== "bite") return;
    if (biteExpire.current) clearTimeout(biteExpire.current);
    const id = pickCatch(castDist);
    setCatchId(id);
    const initBar = MINIGAME_H / 2 - BAR_H / 2;
    const initFish = Math.random() * (MINIGAME_H - FISH_H);
    gsRef.current = {
      barPos: initBar,
      barVel: 0,
      fishPos: initFish,
      fishVel: CATCHES[id].speed * (Math.random() > 0.5 ? 1 : -1),
      fishDirTimer: 0,
      progress: 0.3,
      lastTime: 0,
      holding: false,
    };
    setBarPos(initBar);
    setFishPos(initFish);
    setProgress(0.3);
    setIsHolding(false);
    setPhase("minigame");
  }, [phase, castDist]);

  const handleReset = useCallback(() => {
    if (biteTimer.current) clearTimeout(biteTimer.current);
    if (biteExpire.current) clearTimeout(biteExpire.current);
    cancelAnimationFrame(gameRafRef.current);
    cancelAnimationFrame(chargeRafRef.current);
    chargeStartRef.current = null;
    setPhase("idle");
    setChargePercent(0);
    setCastDist(0);
    setIsHolding(false);
    setResult(null);
    setMissedBite(false);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (biteTimer.current) clearTimeout(biteTimer.current);
      if (biteExpire.current) clearTimeout(biteExpire.current);
      cancelAnimationFrame(gameRafRef.current);
      cancelAnimationFrame(chargeRafRef.current);
    };
  }, []);

  // ── Derived display values ────────────────────────────────────────────────

  const chargeHue = 120 * (1 - chargePercent / 100);
  const distLabel =
    castDist < 0.3 ? "Short" : castDist < 0.6 ? "Medium" : castDist < 0.85 ? "Far" : "Very Far";
  const distColor =
    castDist < 0.3
      ? "text-zinc-400"
      : castDist < 0.6
      ? "text-blue-400"
      : castDist < 0.85
      ? "text-emerald-400"
      : "text-purple-400";
  const progressBarColor =
    progress > 0.6 ? "bg-green-500" : progress > 0.3 ? "bg-yellow-400" : "bg-red-500";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Cast! Hook! Maintain! Repeat!
      </p>

      {/* ── IDLE ──────────────────────────────────────────────────────────── */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-4 py-3">
          <div className="text-5xl select-none">🎣</div>
          {missedBite && (
            <p className="text-xs font-medium text-red-400">Too slow — the fish got away!</p>
          )}
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Hold longer → cast further → better fish
          </p>
          <button
            type="button"
            onMouseDown={handleCastStart}
            onTouchStart={(e) => {
              e.preventDefault();
              handleCastStart();
            }}
            className="touch-none select-none rounded-2xl bg-zinc-700 px-10 py-4 text-base font-semibold text-zinc-100 shadow-lg transition hover:bg-zinc-600 dark:bg-zinc-600 dark:hover:bg-zinc-500"
          >
            Hold to Cast
          </button>
        </div>
      )}

      {/* ── CASTING ───────────────────────────────────────────────────────── */}
      {phase === "casting" && (
        <div className="flex flex-col items-center gap-4 py-3">
          <div className="text-5xl select-none">🎣</div>
          <p
            className="text-xs font-semibold"
            style={{ color: `hsl(${chargeHue}, 75%, 55%)` }}
          >
            {chargePercent < 30
              ? "Charging…"
              : chargePercent < 70
              ? "Keep going…"
              : chargePercent < 97
              ? "Release now!"
              : "MAXED!"}
          </p>
          <div className="h-4 w-52 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full transition-none"
              style={{
                width: `${chargePercent}%`,
                backgroundColor: `hsl(${chargeHue}, 75%, 48%)`,
              }}
            />
          </div>
          <p className="text-xs text-zinc-400">Release mouse / finger to cast!</p>
        </div>
      )}

      {/* ── WAITING ───────────────────────────────────────────────────────── */}
      {phase === "waiting" && (
        <div className="flex flex-col items-center gap-3 py-3">
          <div className="text-4xl select-none">🪝</div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cast:{" "}
            <span className={`font-semibold ${distColor}`}>{distLabel}</span>
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Waiting for a bite{".".repeat(waitDots + 1)}
          </p>
        </div>
      )}

      {/* ── BITE ──────────────────────────────────────────────────────────── */}
      {phase === "bite" && (
        <div className="flex flex-col items-center gap-4 py-3">
          <div className="flex items-end gap-1">
            <span className="select-none text-4xl">🪝</span>
            <span className="animate-bounce select-none text-3xl font-black leading-none text-yellow-400">
              !
            </span>
          </div>
          <button
            type="button"
            onClick={handleBite}
            className="animate-pulse touch-none select-none rounded-2xl bg-yellow-400 px-10 py-4 text-base font-bold text-zinc-900 shadow-lg transition hover:bg-yellow-300"
          >
            Hook it!
          </button>
        </div>
      )}

      {/* ── MINI-GAME ─────────────────────────────────────────────────────── */}
      {phase === "minigame" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Keep {CATCHES[catchId].emoji} inside the green zone!
          </p>

          <div className="flex items-start gap-3">
            {/* Water scene */}
            <div
              className="relative overflow-hidden rounded-xl"
              style={{
                width: 84,
                height: MINIGAME_H,
                background: "linear-gradient(to bottom, #1e3a5f, #1a4a7a, #1060b0)",
              }}
            >
              {/* Subtle water ripple lines */}
              {[0.25, 0.5, 0.75].map((f) => (
                <div
                  key={f}
                  className="absolute left-2 right-2 border-t border-blue-400/10"
                  style={{ top: f * MINIGAME_H }}
                />
              ))}

              {/* Green bar */}
              <div
                className="absolute left-0 right-0 transition-none"
                style={{
                  top: barPos,
                  height: BAR_H,
                  backgroundColor: "rgba(74, 222, 128, 0.60)",
                  borderTop: "2px solid rgba(134, 239, 172, 0.85)",
                  borderBottom: "2px solid rgba(134, 239, 172, 0.85)",
                }}
              />

              {/* Catch icon */}
              <div
                className="absolute left-1/2 -translate-x-1/2 select-none text-xl leading-none transition-none"
                style={{ top: fishPos, lineHeight: `${FISH_H}px` }}
              >
                {CATCHES[catchId].emoji}
              </div>
            </div>

            {/* Catch progress bar */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Catch
              </span>
              <div
                className="relative overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
                style={{ width: 14, height: MINIGAME_H }}
              >
                <div
                  className={`absolute bottom-0 w-full rounded-full transition-none ${progressBarColor}`}
                  style={{ height: `${progress * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-400">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>

          {/* Hold button */}
          <button
            type="button"
            onMouseDown={() => setIsHolding(true)}
            onMouseUp={() => setIsHolding(false)}
            onMouseLeave={() => setIsHolding(false)}
            onTouchStart={(e) => {
              e.preventDefault();
              setIsHolding(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setIsHolding(false);
            }}
            className={[
              "touch-none select-none rounded-2xl px-10 py-4 text-base font-semibold shadow-lg transition-colors",
              isHolding
                ? "scale-105 bg-green-500 text-white"
                : "bg-zinc-700 text-zinc-100 hover:bg-zinc-600 dark:bg-zinc-600 dark:hover:bg-zinc-500",
            ].join(" ")}
          >
            {isHolding ? "▲ Lifting" : "Hold to Lift ▲"}
          </button>

          <p className={`text-xs font-medium ${TIER_META[CATCHES[catchId].tier].color}`}>
            {CATCHES[catchId].emoji} {CATCHES[catchId].label}
            {" · "}
            <span className="opacity-70">{TIER_META[CATCHES[catchId].tier].label}</span>
          </p>
        </div>
      )}

      {/* ── RESULT ────────────────────────────────────────────────────────── */}
      {phase === "result" && (
        <div className="flex flex-col items-center gap-4 py-3">
          {result === "escaped" ? (
            <>
              <div className="select-none text-5xl">💨</div>
              <p className="text-base font-semibold text-zinc-500">It got away!</p>
            </>
          ) : result ? (() => {
            const def = CATCHES[result.catchId];
            const tier = TIER_META[def.tier];
            return (
              <>
                <div className="select-none text-5xl">{def.emoji}</div>
                <div className={`rounded-full px-3 py-0.5 text-xs font-bold ${tier.color} ${tier.bg}`}>
                  {tier.label}
                </div>
                <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                  {def.label}!
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Volume set to {Math.round(result.vol * 100)}%
                </p>
              </>
            );
          })() : null}
          <button
            type="button"
            onClick={handleReset}
            className="rounded-2xl bg-zinc-700 px-10 py-4 text-base font-semibold text-zinc-100 shadow-lg transition hover:bg-zinc-600 dark:bg-zinc-600 dark:hover:bg-zinc-500"
          >
            Cast Again
          </button>
        </div>
      )}
    </div>
  );
}
