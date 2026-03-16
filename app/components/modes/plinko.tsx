"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PlinkoProps = {
  value: number;
  onChange: (value: number) => void;
};

const SLOTS = [-5, 4, 3, -2, 1, 0, -1, 2, -3, -4, 5];
const W = 320;
const H = 380;
const ROWS = 10;

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function Plinko({ value, onChange }: PlinkoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Click to drop");
  const volumePercent = Math.round(clamp(value) * 100);

  const state = useRef({
    barX: W / 2,
    barDir: 1,
    balls: [] as { x: number; y: number; vx: number; vy: number }[],
  });

  const pegsRef = useRef<{ x: number; y: number }[]>([]);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    // Generate pegs - full grid with offset rows, edge to edge
    const pegs: { x: number; y: number }[] = [];
    const startY = 50;
    const rowGap = 22;
    const colGap = 18;
    const cols = 17;
    const margin = 8;
    for (let r = 0; r < ROWS; r++) {
      const offset = (r % 2) * (colGap / 2);
      for (let c = 0; c < cols; c++) {
        const x = margin + offset + c * colGap;
        if (x >= margin && x <= W - margin) {
          pegs.push({ x: x | 0, y: (startY + r * rowGap) | 0 });
        }
      }
    }
    pegsRef.current = pegs;

    // Create static canvas for pegs + slots
    const sc = document.createElement("canvas");
    sc.width = W;
    sc.height = H;
    const sctx = sc.getContext("2d")!;
    
    // Background
    sctx.fillStyle = "#18181b";
    sctx.fillRect(0, 0, W, H);
    
    // Pegs
    sctx.fillStyle = "#3f3f46";
    for (const p of pegs) {
      sctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    
    // Slots
    const slotW = W / SLOTS.length;
    const slotY = H - 32;
    sctx.font = "10px monospace";
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    for (let i = 0; i < SLOTS.length; i++) {
      const g = 32 + (5 - Math.abs(SLOTS[i])) * 5;
      sctx.fillStyle = `rgb(${g},${g},${g})`;
      sctx.fillRect((i * slotW + 1) | 0, slotY, (slotW - 2) | 0, 32);
      sctx.fillStyle = "#888";
      sctx.fillText(SLOTS[i] > 0 ? `+${SLOTS[i]}` : `${SLOTS[i]}`, (i * slotW + slotW / 2) | 0, slotY + 16);
    }
    
    staticCanvasRef.current = sc;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    
    let running = true;
    let lastTime = 0;
    const interval = 33; // ~30fps

    const loop = (time: number) => {
      if (!running) return;
      
      if (time - lastTime < interval) {
        requestAnimationFrame(loop);
        return;
      }
      lastTime = time;

      const s = state.current;
      const pegs = pegsRef.current;

      // Bar movement
      s.barX += 3 * s.barDir;
      if (s.barX > W - 20) { s.barX = W - 20; s.barDir = -1; }
      else if (s.barX < 20) { s.barX = 20; s.barDir = 1; }

      // Ball physics
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const b = s.balls[i];
        b.vy += 0.6;
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < 4) { b.x = 4; b.vx *= -0.5; }
        else if (b.x > W - 4) { b.x = W - 4; b.vx *= -0.5; }

        for (const p of pegs) {
          const dx = b.x - p.x;
          const dy = b.y - p.y;
          if (dx * dx + dy * dy < 49) {
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = dx / d, ny = dy / d;
            b.x = p.x + nx * 7;
            b.y = p.y + ny * 7;
            const dot = b.vx * nx + b.vy * ny;
            b.vx = (b.vx - 2 * dot * nx) * 0.5 + (Math.random() - 0.5);
            b.vy = (b.vy - 2 * dot * ny) * 0.5;
          }
        }

        if (b.y > H - 34) {
          const idx = Math.min(10, Math.max(0, (b.x / (W / 11)) | 0));
          const change = SLOTS[idx];
          valueRef.current = clamp(valueRef.current + change / 100);
          onChangeRef.current(valueRef.current);
          setStatus(`${change >= 0 ? "+" : ""}${change}%`);
          s.balls.splice(i, 1);
        }
      }

      // Draw static background
      if (staticCanvasRef.current) {
        ctx.drawImage(staticCanvasRef.current, 0, 0);
      }

      // Draw bar
      ctx.fillStyle = "#52525b";
      ctx.fillRect((s.barX - 16) | 0, 8, 32, 4);
      ctx.fillRect((s.barX - 3) | 0, 12, 6, 10);

      // Draw balls
      ctx.fillStyle = "#d4d4d8";
      for (const b of s.balls) {
        ctx.fillRect((b.x - 4) | 0, (b.y - 4) | 0, 8, 8);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
    return () => { running = false; };
  }, []);

  const drop = useCallback(() => {
    const s = state.current;
    if (s.balls.length >= 10) return; // limit max balls
    s.balls.push({ x: s.barX, y: 22, vx: (Math.random() - 0.5), vy: 0 });
    setStatus(`${s.balls.length} ball${s.balls.length > 1 ? "s" : ""}`);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Plinko</span>
        <span>{volumePercent}%</span>
      </div>
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={drop}
          className="cursor-pointer rounded border border-zinc-800"
        />
      </div>
      <p className="text-center text-xs text-zinc-600">{status}</p>
    </div>
  );
}
