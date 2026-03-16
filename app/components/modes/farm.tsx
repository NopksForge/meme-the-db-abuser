"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SeedType = "carrot" | "tomato" | "corn" | "wild";
type GrowthStage = "seed" | "sprout" | "grown";
type PromoType = "harvest_bonus" | "seed_sale" | "vol_discount" | "fast_growth";

type PlantCell = {
  seed: SeedType;
  stage: GrowthStage;
  growthProgress: number;
  water: number;
};

type Plots = (PlantCell | null)[][];

type ActiveDrag =
  | { kind: "water" }
  | { kind: "seed"; seed: SeedType }
  | null;

type ActivePromo = { type: PromoType; remaining: number } | null;

// ── Config ────────────────────────────────────────────────────────────────────

const SEED_CONFIG = {
  carrot: { name: "Carrot", icon: "🥕", cost: 5,  sellPrice: 15, growthTime: 30, maxWater: 4, waterPerSecond: 0.12, sproutAt: 0.35 },
  tomato: { name: "Tomato", icon: "🍅", cost: 10, sellPrice: 35, growthTime: 60, maxWater: 6, waterPerSecond: 0.09, sproutAt: 0.35 },
  corn:   { name: "Corn",   icon: "🌽", cost: 15, sellPrice: 55, growthTime: 90, maxWater: 8, waterPerSecond: 0.08, sproutAt: 0.35 },
  wild:   { name: "Wild",   icon: "🍄", cost: 0,  sellPrice: 8,  growthTime: 20, maxWater: 3, waterPerSecond: 0.10, sproutAt: 0.30 },
} as const;

// Volume tiers: [pct, buy cost, sell reward]
const VOL_TIERS: [number, number, number][] = [
  [1, 3,  2],
  [3, 8,  5],
  [5, 13, 8],
];

const PROMO_CONFIG: Record<PromoType, { label: string; emoji: string; desc: string; duration: number }> = {
  harvest_bonus: { label: "Harvest Bonus", emoji: "🌾", desc: "Crops sell for 2× price",   duration: 60 },
  seed_sale:     { label: "Seed Sale",     emoji: "🌱", desc: "All seeds 50% off",          duration: 45 },
  vol_discount:  { label: "Vol Discount",  emoji: "🔊", desc: "Buy volume at half price",   duration: 45 },
  fast_growth:   { label: "Growth Boost",  emoji: "⚡", desc: "Plants grow 2× faster",      duration: 60 },
};
const ALL_PROMO_TYPES = Object.keys(PROMO_CONFIG) as PromoType[];

const WATER_PER_DROP  = 3;
const WILD_COOLDOWN_SEC = 30;
const PROMO_INTERVAL_MIN = 40;  // seconds between promos
const PROMO_INTERVAL_MAX = 80;
const INITIAL_COINS   = 50;
const ALL_SEEDS: SeedType[]  = ["carrot", "tomato", "corn", "wild"];
const SHOP_SEEDS: SeedType[] = ["carrot", "tomato", "corn"];

type FarmProps = { value: number; onChange: (value: number) => void };

// ── Sub-components ─────────────────────────────────────────────────────────────

function WaterBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-600">
      <div
        className={`h-full rounded-full transition-none ${
          pct > 0.5 ? "bg-blue-400" : pct > 0.2 ? "bg-yellow-400" : "bg-orange-400"
        }`}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}

function GrowthBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-600">
      <div className="h-full rounded-full bg-green-500 transition-none" style={{ width: `${value * 100}%` }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Farm({ value, onChange }: FarmProps) {
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [plots, setPlots] = useState<Plots>(() =>
    Array.from({ length: 3 }, () => Array(9).fill(null))
  );
  const [seedInv, setSeedInv] = useState<Record<SeedType, number>>({
    carrot: 0, tomato: 0, corn: 0, wild: 0,
  });
  const [harvestInv, setHarvestInv] = useState<Record<SeedType, number>>({
    carrot: 0, tomato: 0, corn: 0, wild: 0,
  });
  const [wildCooldown, setWildCooldown]   = useState(0);
  const [activePromo, setActivePromo]     = useState<ActivePromo>(null);
  const [nextPromoIn, setNextPromoIn]     = useState(() =>
    PROMO_INTERVAL_MIN + Math.floor(Math.random() * (PROMO_INTERVAL_MAX - PROMO_INTERVAL_MIN))
  );

  const [activeDrag, setActiveDrag]       = useState<ActiveDrag>(null);
  const [dragPos, setDragPos]             = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell]     = useState<string | null>(null);
  const [feedback, setFeedback]           = useState<string | null>(null);
  const [mounted, setMounted]             = useState(false);
  const [hoveredSeedRow, setHoveredSeedRow] = useState<SeedType | null>(null);
  const [growFrame, setGrowFrame]           = useState(0);

  // Stable refs
  const valueRef        = useRef(value); valueRef.current = value;
  const activeDragRef   = useRef<ActiveDrag>(null);
  const plotsRef        = useRef(plots);  plotsRef.current = plots;
  const seedInvRef      = useRef(seedInv); seedInvRef.current = seedInv;
  const activePromoRef  = useRef<PromoType | null>(null);
  activePromoRef.current = activePromo?.type ?? null;
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Growth loop — reads fastGrow from ref so RAF doesn't need to restart
  const fastGrowRef = useRef(false);
  fastGrowRef.current = activePromo?.type === "fast_growth";

  useEffect(() => {
    let lastTime = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const speedMult = fastGrowRef.current ? 2 : 1;
      setPlots((prev) => {
        let anyChanged = false;
        const next = prev.map((plot) =>
          plot.map((cell) => {
            if (!cell || cell.stage === "grown" || cell.water <= 0) return cell;
            const cfg = SEED_CONFIG[cell.seed];
            const newProgress = Math.min(1, cell.growthProgress + (dt * speedMult) / cfg.growthTime);
            const newWater    = Math.max(0, cell.water - cfg.waterPerSecond * dt);
            const newStage: GrowthStage =
              newProgress >= 1 ? "grown" : newProgress >= cfg.sproutAt ? "sprout" : "seed";
            anyChanged = true;
            return { ...cell, growthProgress: newProgress, water: newWater, stage: newStage };
          })
        );
        return anyChanged ? next : prev;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  // Unified 1-second ticker: wild cooldown + promo countdown + promo timer
  useEffect(() => {
    const t = setInterval(() => {
      setWildCooldown((c) => Math.max(0, c - 1));

      setActivePromo((prev) => {
        if (!prev) return null;
        if (prev.remaining <= 1) return null;
        return { ...prev, remaining: prev.remaining - 1 };
      });

      setNextPromoIn((n) => {
        if (n > 1) return n - 1;
        // Fire a random promo (avoid repeating active one)
        const cur = activePromoRef.current;
        const choices = ALL_PROMO_TYPES.filter((p) => p !== cur);
        const picked  = choices[Math.floor(Math.random() * choices.length)];
        setActivePromo({ type: picked, remaining: PROMO_CONFIG[picked].duration });
        return PROMO_INTERVAL_MIN + Math.floor(Math.random() * (PROMO_INTERVAL_MAX - PROMO_INTERVAL_MIN));
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Cycle grow-preview frame while hovering a seed row
  useEffect(() => {
    if (!hoveredSeedRow) { setGrowFrame(0); return; }
    setGrowFrame(0);
    const t = setInterval(() => setGrowFrame((f) => (f + 1) % 3), 420);
    return () => clearInterval(t);
  }, [hoveredSeedRow]);

  const showFeedback = useCallback((msg: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2500);
  }, []);

  // ── Drag system ─────────────────────────────────────────────────────────────

  const startDrag = useCallback((drag: ActiveDrag, e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    activeDragRef.current = drag;
    setActiveDrag(drag);
    setDragPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!activeDragRef.current) return;
    setDragPos({ x: e.clientX, y: e.clientY });
    const el    = document.elementFromPoint(e.clientX, e.clientY);
    const cellEl = el?.closest("[data-farm-cell]") as HTMLElement | null;
    setHoveredCell(cellEl ? `${cellEl.dataset.plotIdx}-${cellEl.dataset.cellIdx}` : null);
  }, []);

  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    const drag = activeDragRef.current;
    if (!drag) return;
    activeDragRef.current = null;
    setActiveDrag(null);
    setHoveredCell(null);

    const el     = document.elementFromPoint(e.clientX, e.clientY);
    const cellEl = el?.closest("[data-farm-cell]") as HTMLElement | null;
    if (!cellEl) return;

    const plotIdx = parseInt(cellEl.dataset.plotIdx ?? "");
    const cellIdx = parseInt(cellEl.dataset.cellIdx ?? "");
    if (isNaN(plotIdx) || isNaN(cellIdx)) return;

    if (drag.kind === "water") {
      const cell = plotsRef.current[plotIdx]?.[cellIdx];
      if (!cell || cell.stage === "grown") { showFeedback("Can only water growing plants!"); return; }
      if (cell.water >= SEED_CONFIG[cell.seed].maxWater) { showFeedback("Already fully watered 💧"); return; }
      setPlots((prev) => {
        const c = prev[plotIdx]?.[cellIdx];
        if (!c || c.stage === "grown") return prev;
        const next = prev.map((p) => [...p]);
        next[plotIdx][cellIdx] = { ...c, water: Math.min(SEED_CONFIG[c.seed].maxWater, c.water + WATER_PER_DROP) };
        return next;
      });
      showFeedback("💧 Watered! Watch it grow.");
    } else if (drag.kind === "seed") {
      if (plotsRef.current[plotIdx]?.[cellIdx] !== null) { showFeedback("That spot is taken!"); return; }
      if (seedInvRef.current[drag.seed] <= 0) { showFeedback("No seeds left!"); return; }
      const cfg = SEED_CONFIG[drag.seed];
      setSeedInv((inv) => ({ ...inv, [drag.seed]: inv[drag.seed] - 1 }));
      setPlots((prev) => {
        const next = prev.map((p) => [...p]);
        next[plotIdx][cellIdx] = { seed: drag.seed, stage: "seed", growthProgress: 0, water: 0 };
        return next;
      });
      showFeedback(`Planted ${cfg.icon} ${cfg.name}! Drag 💧 to water it.`);
    }
  }, [showFeedback]);

  // ── Shop actions ─────────────────────────────────────────────────────────────

  const buySeed = useCallback((type: SeedType) => {
    const cfg      = SEED_CONFIG[type];
    const onSale   = activePromoRef.current === "seed_sale";
    const cost     = onSale ? Math.ceil(cfg.cost * 0.5) : cfg.cost;
    if (coins < cost) { showFeedback("Not enough coins! 💸"); return; }
    setCoins((c) => c - cost);
    setSeedInv((inv) => ({ ...inv, [type]: inv[type] + 1 }));
    showFeedback(`Got ${cfg.icon} ${cfg.name} seed${onSale ? " (50% off!)" : ""} — drag to a plot!`);
  }, [coins, showFeedback]);

  const pickWildSeed = useCallback(() => {
    if (wildCooldown > 0) return;
    setSeedInv((inv) => ({ ...inv, wild: inv.wild + 1 }));
    setWildCooldown(WILD_COOLDOWN_SEC);
    showFeedback("Found a 🍄 Wild Seed in the forest!");
  }, [wildCooldown, showFeedback]);

  const buyVolume = useCallback((pct: number, baseCost: number) => {
    const onDiscount = activePromoRef.current === "vol_discount";
    const cost = onDiscount ? Math.max(1, Math.ceil(baseCost * 0.5)) : baseCost;
    if (coins < cost) { showFeedback("Not enough coins! 💸"); return; }
    const newVol = Math.min(1, valueRef.current + pct / 100);
    setCoins((c) => c - cost);
    onChange(newVol);
    showFeedback(`Volume +${pct}%! Now ${Math.round(newVol * 100)}%${onDiscount ? " (50% off!)" : ""} 🔊`);
  }, [coins, onChange, showFeedback]);

  const sellVolume = useCallback((pct: number, reward: number) => {
    if (valueRef.current < pct / 100) { showFeedback("Volume too low!"); return; }
    const newVol = Math.max(0, valueRef.current - pct / 100);
    setCoins((c) => c + reward);
    onChange(newVol);
    showFeedback(`Sold ${pct}% vol for 💰${reward}! Now ${Math.round(newVol * 100)}%`);
  }, [onChange, showFeedback]);

  const sellHarvest = useCallback((type: SeedType) => {
    const count = harvestInv[type];
    if (count <= 0) return;
    const cfg    = SEED_CONFIG[type];
    const multi  = activePromoRef.current === "harvest_bonus" ? 2 : 1;
    const earned = count * cfg.sellPrice * multi;
    setCoins((c) => c + earned);
    setHarvestInv((inv) => ({ ...inv, [type]: 0 }));
    showFeedback(`Sold ${count}× ${cfg.icon} for 💰${earned}!${multi > 1 ? " (2× bonus!)" : ""}`);
  }, [harvestInv, showFeedback]);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const hasSeedInv = ALL_SEEDS.some((k) => seedInv[k] > 0);
  const hasHarvest = ALL_SEEDS.some((k) => harvestInv[k] > 0);
  const dragEmoji  =
    activeDrag?.kind === "water" ? "💧"
    : activeDrag?.kind === "seed" ? SEED_CONFIG[activeDrag.seed].icon
    : null;

  const promoInfo = activePromo ? PROMO_CONFIG[activePromo.type] : null;

  return (
    <div className="select-none space-y-3">
      {/* Title */}
      <p className="text-center text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        🌾 Farm — grow crops, earn coins
      </p>

      {/* Promo banner */}
      {activePromo && promoInfo && (
        <div className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-600/50 dark:bg-amber-900/20">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
              {promoInfo.emoji} {promoInfo.label}
            </span>
            <span className="text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {activePromo.remaining}s
            </span>
          </div>
          <p className="px-3 pb-1 text-[11px] text-amber-600 dark:text-amber-400">{promoInfo.desc}</p>
          <div className="h-1 w-full bg-amber-200 dark:bg-amber-800/50">
            <div
              className="h-full bg-amber-400 transition-none dark:bg-amber-500"
              style={{ width: `${(activePromo.remaining / promoInfo.duration) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats + water */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800">
        <span className="font-semibold tabular-nums">💰 {coins}</span>
        <span className="text-zinc-500 dark:text-zinc-400">🔊 {Math.round(value * 100)}%</span>
        <div
          className={`flex cursor-grab items-center gap-1.5 rounded-lg bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 ${
            activeDrag?.kind === "water" ? "scale-90 opacity-40" : ""
          }`}
          onPointerDown={(e) => startDrag({ kind: "water" }, e)}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          style={{ touchAction: "none" }}
          title="Free! Drag onto a growing plant."
        >
          💧 water
        </div>
      </div>

      {/* Shop */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60">

        {/* Seeds */}
        <div className="p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-400">Seeds</p>
          <div className="space-y-0.5">
            {SHOP_SEEDS.map((type) => {
              const cfg      = SEED_CONFIG[type];
              const onSale   = activePromo?.type === "seed_sale";
              const cost     = onSale ? Math.ceil(cfg.cost * 0.5) : cfg.cost;
              const isHover  = hoveredSeedRow === type;
              const preview  = isHover ? (["🌱", "🌿", cfg.icon] as const)[growFrame] : cfg.icon;
              return (
                <div
                  key={type}
                  onClick={() => buySeed(type)}
                  onMouseEnter={() => setHoveredSeedRow(type)}
                  onMouseLeave={() => setHoveredSeedRow(null)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    isHover ? "bg-amber-50 dark:bg-amber-900/10" : ""
                  }`}
                >
                  <span className={`w-5 text-base leading-none transition-transform ${isHover ? "scale-125" : ""}`}>
                    {preview}
                  </span>
                  <span className="w-14 text-xs font-medium text-zinc-700 dark:text-zinc-200">{cfg.name}</span>
                  <span className="text-[10px] text-zinc-400">{cfg.growthTime}s</span>
                  <span className="flex-1 text-[10px] text-zinc-400">sell 💰{cfg.sellPrice}</span>
                  <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                    onSale
                      ? "bg-amber-400 text-white"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}>
                    {onSale && <span className="mr-1 line-through opacity-50">💰{cfg.cost}</span>}
                    💰{cost}
                  </span>
                </div>
              );
            })}

            {/* Wild seed row */}
            {(() => {
              const cfg     = SEED_CONFIG.wild;
              const canPick = wildCooldown === 0;
              const isHover = hoveredSeedRow === "wild";
              const preview = isHover ? (["🌱", "🌿", cfg.icon] as const)[growFrame] : cfg.icon;
              return (
                <div
                  onClick={pickWildSeed}
                  onMouseEnter={() => canPick && setHoveredSeedRow("wild")}
                  onMouseLeave={() => setHoveredSeedRow(null)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    canPick ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                  } ${isHover ? "bg-emerald-50 dark:bg-emerald-900/10" : ""}`}
                >
                  <span className={`w-5 text-base leading-none transition-transform ${isHover ? "scale-125" : ""}`}>
                    {preview}
                  </span>
                  <span className="w-14 text-xs font-medium text-zinc-700 dark:text-zinc-200">{cfg.name}</span>
                  <span className="text-[10px] text-zinc-400">{cfg.growthTime}s</span>
                  <span className="flex-1 text-[10px] text-zinc-400">sell 💰{cfg.sellPrice}</span>
                  <div className="flex items-center gap-1.5">
                    {wildCooldown > 0 && (
                      <div className="h-1 w-10 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-none"
                          style={{ width: `${(wildCooldown / WILD_COOLDOWN_SEC) * 100}%` }}
                        />
                      </div>
                    )}
                    <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                      canPick
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                    }`}>
                      {wildCooldown > 0 ? `${wildCooldown}s` : "🌲 Free"}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Volume */}
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-700">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-400">Volume</p>
          <div className="space-y-1.5">
            {/* Buy row */}
            <div className="flex items-center gap-1.5">
              <span className="w-8 text-[10px] text-zinc-400">Buy</span>
              {VOL_TIERS.map(([pct, baseCost]) => {
                const onDiscount = activePromo?.type === "vol_discount";
                const cost = onDiscount ? Math.max(1, Math.ceil(baseCost * 0.5)) : baseCost;
                return (
                  <button
                    key={pct}
                    onClick={() => buyVolume(pct, baseCost)}
                    className={`flex flex-1 flex-col items-center rounded-lg py-1.5 text-center transition-colors ${
                      onDiscount
                        ? "bg-violet-400 text-white"
                        : "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-300"
                    }`}
                  >
                    <span className="text-xs font-semibold">+{pct}%</span>
                    <span className="text-[10px] opacity-70">💰{cost}</span>
                  </button>
                );
              })}
            </div>
            {/* Sell row */}
            <div className="flex items-center gap-1.5">
              <span className="w-8 text-[10px] text-zinc-400">Sell</span>
              {VOL_TIERS.map(([pct, , reward]) => (
                <button
                  key={pct}
                  onClick={() => sellVolume(pct, reward)}
                  className="flex flex-1 flex-col items-center rounded-lg bg-rose-50 py-1.5 text-center hover:bg-rose-100 dark:bg-rose-900/20"
                >
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">−{pct}%</span>
                  <span className="text-[10px] text-rose-500 dark:text-rose-400">+💰{reward}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bag */}
      {(hasSeedInv || hasHarvest) && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60">
          {hasSeedInv && (
            <div className="p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Seeds — drag to plot
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SEEDS.filter((t) => seedInv[t] > 0).map((type) => {
                  const cfg = SEED_CONFIG[type];
                  const isDraggingThis = activeDrag?.kind === "seed" && activeDrag.seed === type;
                  return (
                    <div
                      key={type}
                      className={`flex cursor-grab items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-amber-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 ${
                        isDraggingThis ? "scale-90 opacity-40" : ""
                      }`}
                      onPointerDown={(e) => startDrag({ kind: "seed", seed: type }, e)}
                      onPointerMove={handleDragMove}
                      onPointerUp={handleDragEnd}
                      style={{ touchAction: "none" }}
                      title="Drag to empty soil to plant"
                    >
                      {cfg.icon}
                      <span className="tabular-nums text-zinc-500 dark:text-zinc-400">×{seedInv[type]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {hasSeedInv && hasHarvest && (
            <div className="mx-3 border-t border-zinc-200 dark:border-zinc-700" />
          )}

          {hasHarvest && (
            <div className="p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Harvest — click to sell{activePromo?.type === "harvest_bonus" ? " (2×!)" : ""}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SEEDS.filter((t) => harvestInv[t] > 0).map((type) => {
                  const cfg    = SEED_CONFIG[type];
                  const multi  = activePromo?.type === "harvest_bonus" ? 2 : 1;
                  const earned = harvestInv[type] * cfg.sellPrice * multi;
                  return (
                    <button
                      key={type}
                      onClick={() => sellHarvest(type)}
                      className={`flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium dark:bg-zinc-800 ${
                        multi > 1
                          ? "border-amber-400 hover:bg-amber-50 dark:border-amber-600"
                          : "border-green-200 hover:border-green-400 hover:bg-green-50 dark:border-zinc-600"
                      }`}
                    >
                      <span className="text-zinc-700 dark:text-zinc-200">{cfg.icon} ×{harvestInv[type]}</span>
                      <span className={multi > 1 ? "font-bold text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}>
                        💰{earned}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Farm plots */}
      <div className="flex flex-wrap justify-center gap-3">
        {plots.map((plot, plotIdx) => (
          <div
            key={plotIdx}
            className="rounded-xl border-2 border-amber-300 bg-amber-50/50 p-2 dark:border-amber-700/50 dark:bg-amber-950/20"
          >
            <p className="mb-1.5 text-center text-[10px] font-medium text-amber-500 dark:text-amber-400">
              Plot {plotIdx + 1}
            </p>
            <div className="grid grid-cols-3 gap-1">
              {plot.map((cell, cellIdx) => {
                const key          = `${plotIdx}-${cellIdx}`;
                const isWaterTarget = hoveredCell === key && activeDrag?.kind === "water" && !!cell && cell.stage !== "grown";
                const isSeedTarget  = hoveredCell === key && activeDrag?.kind === "seed" && cell === null;
                const cfg           = cell ? SEED_CONFIG[cell.seed] : null;
                const emoji         = !cell ? "" : cell.stage === "grown" ? cfg!.icon : cell.stage === "sprout" ? "🌿" : "🌱";
                const isDry         = !!cell && cell.stage !== "grown" && cell.water <= 0;

                return (
                  <div
                    key={cellIdx}
                    data-farm-cell="1"
                    data-plot-idx={plotIdx}
                    data-cell-idx={cellIdx}
                    onClick={() => {
                      if (activeDragRef.current) return;
                      if (cell?.stage === "grown") {
                        setHarvestInv((inv) => ({ ...inv, [cell.seed]: inv[cell.seed] + 1 }));
                        setPlots((prev) => {
                          const next = prev.map((p) => [...p]);
                          next[plotIdx][cellIdx] = null;
                          return next;
                        });
                        showFeedback(`Harvested ${cfg!.icon} ${cfg!.name}!`);
                      }
                    }}
                    title={cell ? `${cfg!.name} · ${cell.stage} · ${Math.round(cell.growthProgress * 100)}% · 💧${cell.water.toFixed(1)}/${cfg!.maxWater}` : "Empty soil"}
                    className={`relative flex h-11 w-11 cursor-pointer flex-col items-center justify-center rounded-lg border transition-all ${
                      isWaterTarget ? "scale-110 border-blue-400 bg-blue-100 dark:border-blue-500 dark:bg-blue-900/30"
                      : isSeedTarget ? "scale-110 border-green-400 bg-green-100 dark:border-green-500 dark:bg-green-900/30"
                      : cell?.stage === "grown" ? "border-green-400 bg-green-100 hover:bg-green-200 dark:border-green-600 dark:bg-green-900/30"
                      : isDry ? "border-orange-300 bg-orange-50 dark:border-orange-600/60 dark:bg-orange-900/10"
                      : cell ? "border-green-200 bg-green-50 dark:border-green-700/40 dark:bg-green-950/20"
                      : "border-amber-200 bg-amber-50/80 dark:border-zinc-700 dark:bg-zinc-800"
                    }`}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    {isDry && <span className="absolute -right-1 -top-1 text-[12px] leading-none">😩</span>}
                    {cell && cell.stage !== "grown" && (
                      <div className="absolute bottom-0.5 left-0.5 right-0.5 space-y-px">
                        <WaterBar value={cell.water} max={cfg!.maxWater} />
                        <GrowthBar value={cell.growthProgress} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating drag emoji — portalled to escape backdrop-filter containing block */}
      {mounted && dragEmoji && createPortal(
        <div
          style={{
            position: "fixed",
            left: dragPos.x,
            top: dragPos.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 9999,
            fontSize: "1.5rem",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {dragEmoji}
        </div>,
        document.body
      )}

      {/* Feedback toast */}
      {feedback && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
          <div className="pointer-events-auto rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2.5 text-center text-xs font-medium text-emerald-700 shadow-lg backdrop-blur dark:border-emerald-500/30 dark:text-emerald-300">
            {feedback}
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">
        Buy/pick seeds → drag 🌱 to soil → drag 💧 to water → click grown plant → sell harvest 💰
      </p>
    </div>
  );
}
