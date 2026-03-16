"use client";

import { useEffect, useRef, useState } from "react";

type SnakeProps = {
  value: number;
  onChange: (value: number) => void;
};

const W = 320;
const H = 320;
const CELL = 16;
const COLS = W / CELL;
const ROWS = H / CELL;

type Point = { x: number; y: number };
type Item = Point & { type: "+5" | "+1" | "-5" | "-1" | "bomb" };

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

function randomPos(exclude: Point[]): Point {
  let p: Point;
  do {
    p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (exclude.some((e) => e.x === p.x && e.y === p.y));
  return p;
}

export function Snake({ value, onChange }: SnakeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("WASD or Arrows to move");
  const [started, setStarted] = useState(false);
  const volumePercent = Math.round(clamp(value) * 100);

  const initSnake = (): Point[] => {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    return Array.from({ length: 5 }, (_, i) => ({ x: startX - i, y: startY }));
  };

  const initItems = (snake: Point[]): Item[] => {
    const items: Item[] = [];
    const types: Item["type"][] = ["+5", "+1", "-5", "-1", "bomb"];
    let excluded = [...snake];
    for (const type of types) {
      const pos = randomPos(excluded);
      items.push({ ...pos, type });
      excluded.push(pos);
    }
    return items;
  };

  const stateRef = useRef({
    snake: initSnake(),
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    items: [] as Item[],
    gameOver: false,
    bombTimer: 0,
  });

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    const s = stateRef.current;
    s.items = initItems(s.snake);
  }, []);

  const startedRef = useRef(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;

      // Start game on first key press
      if (!startedRef.current) {
        startedRef.current = true;
        setStarted(true);
        return;
      }

      if (s.gameOver) {
        s.snake = initSnake();
        s.dir = { x: 1, y: 0 };
        s.nextDir = { x: 1, y: 0 };
        s.items = initItems(s.snake);
        s.gameOver = false;
        s.bombTimer = 0;
        setStatus("WASD or Arrows to move");
        return;
      }

      const key = e.key.toLowerCase();
      if ((key === "w" || key === "arrowup") && s.dir.y !== 1) {
        s.nextDir = { x: 0, y: -1 };
      } else if ((key === "s" || key === "arrowdown") && s.dir.y !== -1) {
        s.nextDir = { x: 0, y: 1 };
      } else if ((key === "a" || key === "arrowleft") && s.dir.x !== 1) {
        s.nextDir = { x: -1, y: 0 };
      } else if ((key === "d" || key === "arrowright") && s.dir.x !== -1) {
        s.nextDir = { x: 1, y: 0 };
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let running = true;
    let lastTime = 0;
    let lastBombMove = 0;
    const interval = 120;
    const bombInterval = 5000;

    const loop = (time: number) => {
      if (!running) return;

      const s = stateRef.current;

      // Don't run game logic until started
      if (!startedRef.current) {
        // Just draw the initial state
        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, W, H);

        // Draw snake
        ctx.fillStyle = "#d4d4d8";
        for (const p of s.snake) {
          ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
        }
        if (s.snake.length > 0) {
          ctx.fillStyle = "#f4f4f5";
          ctx.fillRect(s.snake[0].x * CELL + 1, s.snake[0].y * CELL + 1, CELL - 2, CELL - 2);
        }

        requestAnimationFrame(loop);
        return;
      }

      // Relocate bomb every 5 seconds
      if (!s.gameOver && time - lastBombMove >= bombInterval) {
        lastBombMove = time;
        const bombIdx = s.items.findIndex((i) => i.type === "bomb");
        if (bombIdx !== -1) {
          const excluded = [...s.snake, ...s.items.filter((_, i) => i !== bombIdx)];
          const newPos = randomPos(excluded);
          s.items[bombIdx] = { ...newPos, type: "bomb" };
        }
      }

      if (time - lastTime >= interval) {
        lastTime = time;

        if (!s.gameOver) {
          s.dir = s.nextDir;
          const head = s.snake[0];
          const newHead = { x: head.x + s.dir.x, y: head.y + s.dir.y };

          // Wall collision - mute volume
          if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
            s.gameOver = true;
            valueRef.current = 0;
            onChangeRef.current(0);
            setStatus("MUTED! Press any key");
          }
          // Self collision
          else if (s.snake.some((p) => p.x === newHead.x && p.y === newHead.y)) {
            s.gameOver = true;
            setStatus("Game Over! Press any key");
          } else {
            s.snake.unshift(newHead);
            s.snake.pop();

            // Check item collision
            const hitIdx = s.items.findIndex((i) => i.x === newHead.x && i.y === newHead.y);
            if (hitIdx !== -1) {
              const item = s.items[hitIdx];
              const excluded = [...s.snake, ...s.items.filter((_, i) => i !== hitIdx)];

              if (item.type === "bomb") {
                s.gameOver = true;
                valueRef.current = 0;
                onChangeRef.current(0);
                setStatus("BOOM! MUTED! Press any key");
              } else {
                const change = item.type === "+5" ? 0.05 : item.type === "+1" ? 0.01 : item.type === "-5" ? -0.05 : -0.01;
                const newVal = clamp(valueRef.current + change);
                valueRef.current = newVal;
                onChangeRef.current(newVal);
                setStatus(`${item.type}% volume!`);
                const newPos = randomPos(excluded);
                s.items[hitIdx] = { ...newPos, type: item.type };
              }
            }
          }
        }
      }

      // Draw
      ctx.fillStyle = "#18181b";
      ctx.fillRect(0, 0, W, H);

      // Items
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const item of s.items) {
        const cx = item.x * CELL + CELL / 2;
        const cy = item.y * CELL + CELL / 2;

        if (item.type === "+5") {
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(item.x * CELL + 2, item.y * CELL + 2, CELL - 4, CELL - 4);
          ctx.fillStyle = "#fff";
          ctx.fillText("+5", cx, cy);
        } else if (item.type === "+1") {
          ctx.fillStyle = "#4ade80";
          ctx.fillRect(item.x * CELL + 2, item.y * CELL + 2, CELL - 4, CELL - 4);
          ctx.fillStyle = "#fff";
          ctx.fillText("+1", cx, cy);
        } else if (item.type === "-5") {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(item.x * CELL + 2, item.y * CELL + 2, CELL - 4, CELL - 4);
          ctx.fillStyle = "#fff";
          ctx.fillText("-5", cx, cy);
        } else if (item.type === "-1") {
          ctx.fillStyle = "#f87171";
          ctx.fillRect(item.x * CELL + 2, item.y * CELL + 2, CELL - 4, CELL - 4);
          ctx.fillStyle = "#fff";
          ctx.fillText("-1", cx, cy);
        } else if (item.type === "bomb") {
          ctx.fillStyle = "#a855f7";
          ctx.fillRect(item.x * CELL + 2, item.y * CELL + 2, CELL - 4, CELL - 4);
          ctx.fillStyle = "#fff";
          ctx.font = "bold 12px monospace";
          ctx.fillText("💣", cx, cy);
          ctx.font = "bold 10px monospace";
        }
      }

      // Snake
      ctx.fillStyle = "#d4d4d8";
      for (const p of s.snake) {
        ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
      }

      // Head highlight
      if (s.snake.length > 0) {
        ctx.fillStyle = "#f4f4f5";
        ctx.fillRect(s.snake[0].x * CELL + 1, s.snake[0].y * CELL + 1, CELL - 2, CELL - 2);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
    return () => { running = false; };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Snake</span>
        <span>{volumePercent}%</span>
      </div>
      <div className="relative flex justify-center">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded border border-zinc-800"
          tabIndex={0}
        />
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-black/70">
            <div className="space-y-4 text-center text-zinc-300">
              <p className="text-lg font-medium">Snake</p>
              <div className="space-y-1 text-sm">
                <p>Move: <span className="font-mono text-zinc-100">WASD</span> or <span className="font-mono text-zinc-100">Arrow Keys</span></p>
                <p>Collect <span className="text-green-400">+</span> for volume up</p>
                <p>Avoid <span className="text-red-400">-</span> for volume down</p>
                <p>Avoid <span className="text-purple-400">bomb</span> or walls = mute</p>
              </div>
              <p className="pt-2 text-xs text-zinc-500">Press any key to start</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-500" /> +5%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-lime-400" /> +1%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-500" /> -5%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-orange-400" /> -1%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-purple-500" /> bomb
        </span>
      </div>
      <p className="text-center text-xs text-zinc-600">{status}</p>
    </div>
  );
}
